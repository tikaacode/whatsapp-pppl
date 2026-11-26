<?php
/**
 * WhatsNew (PPPL) - Modul Pesan (Messaging API) & Enkripsi
 * Penulis: Muhammad Zaldy Syah Firaz (NIM: 10241054)
 * Peran  : Backend Developer (Urutan 5 - Chat, Contacts & Messages API)
 *
 * Endpoint:
 *   GET  api/messages.php?conversation_id={id}                 -> riwayat pesan (didekripsi), tandai 'dibaca'
 *   GET  api/messages.php?conversation_id={id}&since_id={id}   -> polling pesan baru + update read/delivered receipts
 *   POST api/messages.php?action=send                          -> kirim pesan (body JSON / form)
 *        body: { "conversation_id": 1, "message_text": "halo" }
 *
 * File ini juga berisi helper bersama (enkripsi terautentikasi, format waktu, cek percakapan)
 * yang dipakai ulang oleh api/contacts.php dan api/status.php.
 */

require_once __DIR__ . '/auth.php';

// ------------------------------------------------------------------------------
// HELPER: ENKRIPSI PESAN (AES-256-GCM terautentikasi + kompatibilitas ENC1 CBC)
// Format ENC2: "ENC2:" + IV (12 byte) + TAG (16 byte) + ciphertext
// Format ENC1 (legacy): "ENC1:" + IV (16 byte) + ciphertext (AES-256-CBC)
// ------------------------------------------------------------------------------

function waGetEncryptionKey(): string
{
    $secret = getenv('WA_MSG_SECRET') ?: 'whatsapp-pppl-dev-secret-change-me';
    return hash('sha256', $secret, true);
}

function waEncryptMessage(string $plain): string
{
    $iv = random_bytes(12);
    $tag = '';
    $cipher = openssl_encrypt(
        $plain,
        'aes-256-gcm',
        waGetEncryptionKey(),
        OPENSSL_RAW_DATA,
        $iv,
        $tag,
        '',
        16
    );
    if ($cipher === false || strlen($tag) !== 16) {
        throw new RuntimeException('Gagal mengenkripsi pesan.');
    }
    return 'ENC2:' . $iv . $tag . $cipher;
}

/**
 * Dekripsi isi_terenkripsi:
 * - ENC2: AES-256-GCM terautentikasi
 * - ENC1: AES-256-CBC (kompatibilitas data lama)
 * - Plaintext UTF-8 (kompatibilitas sample_data.sql)
 */
function waDecryptMessage($blob): string
{
    if ($blob === null) {
        return '';
    }
    if (is_resource($blob)) {
        $blob = stream_get_contents($blob);
    }
    $blob = (string)$blob;

    if (strncmp($blob, 'ENC2:', 5) === 0 && strlen($blob) >= 33) {
        $iv = substr($blob, 5, 12);
        $tag = substr($blob, 17, 16);
        $cipher = substr($blob, 33);
        $plain = openssl_decrypt(
            $cipher,
            'aes-256-gcm',
            waGetEncryptionKey(),
            OPENSSL_RAW_DATA,
            $iv,
            $tag
        );
        return $plain === false ? '[Pesan tidak dapat didekripsi]' : $plain;
    }

    if (strncmp($blob, 'ENC1:', 5) === 0 && strlen($blob) > 21) {
        $iv = substr($blob, 5, 16);
        $cipher = substr($blob, 21);
        $plain = openssl_decrypt($cipher, 'aes-256-cbc', waGetEncryptionKey(), OPENSSL_RAW_DATA, $iv);
        return $plain === false ? '[Pesan tidak dapat didekripsi]' : $plain;
    }

    return mb_check_encoding($blob, 'UTF-8') ? $blob : '[Pesan tidak dapat dibaca]';
}

// ------------------------------------------------------------------------------
// HELPER UMUM
// ------------------------------------------------------------------------------

function waJsonResponse(array $payload, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function waGetJsonInput(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

/** Label waktu untuk sidebar: HH:mm (hari ini), "Kemarin", atau dd/mm/yyyy. */
function waFormatChatTime(?string $timestamp): string
{
    if (!$timestamp) {
        return '';
    }
    $t = strtotime($timestamp);
    if ($t === false) {
        return '';
    }
    if (date('Y-m-d', $t) === date('Y-m-d')) {
        return date('H:i', $t);
    }
    if (date('Y-m-d', $t) === date('Y-m-d', strtotime('-1 day'))) {
        return 'Kemarin';
    }
    return date('d/m/Y', $t);
}

/** Label waktu relatif dalam Bahasa Indonesia untuk Status 24 Jam. */
function waFormatTimeAgo(?string $datetime): string
{
    if (!$datetime) {
        return 'Baru saja';
    }
    $time = strtotime($datetime);
    if ($time === false) {
        return 'Baru saja';
    }
    $diff = max(0, time() - $time);

    if ($diff < 60) {
        return 'Baru saja';
    }
    if ($diff < 3600) {
        return floor($diff / 60) . ' menit lalu';
    }
    if ($diff < 86400) {
        return floor($diff / 3600) . ' jam lalu';
    }
    if ($diff < 172800) {
        return 'Kemarin pukul ' . date('H:i', $time);
    }
    return date('d/m/Y H:i', $time);
}

/** Cari id_percakapan antara dua pengguna (urutan kolom bebas). */
function waFindConversation(PDO $pdo, int $userA, int $userB): ?int
{
    $stmt = $pdo->prepare('
        SELECT id_percakapan FROM tbl_percakapan
        WHERE (id_pengguna_1 = :a1 AND id_pengguna_2 = :b1)
           OR (id_pengguna_1 = :b2 AND id_pengguna_2 = :a2)
        LIMIT 1
    ');
    $stmt->execute([':a1' => $userA, ':b1' => $userB, ':b2' => $userB, ':a2' => $userA]);
    $id = $stmt->fetchColumn();
    return $id ? (int)$id : null;
}

/** Pastikan pengguna adalah peserta percakapan (mencegah baca/kirim ke chat orang lain). */
function waUserInConversation(PDO $pdo, int $conversationId, int $userId): bool
{
    $stmt = $pdo->prepare('
        SELECT 1 FROM tbl_percakapan
        WHERE id_percakapan = :c AND (id_pengguna_1 = :u1 OR id_pengguna_2 = :u2)
        LIMIT 1
    ');
    $stmt->execute([':c' => $conversationId, ':u1' => $userId, ':u2' => $userId]);
    return (bool)$stmt->fetchColumn();
}

/** Ubah satu baris tbl_pesan menjadi bentuk JSON untuk klien. */
function waFormatMessage(array $row, int $currentUserId): array
{
    $ts = strtotime((string)$row['created_at']);
    return [
        'id'              => (int)$row['id_pesan'],
        'conversation_id' => (int)$row['id_percakapan'],
        'sender_id'       => (int)$row['id_pengirim'],
        'is_mine'         => ((int)$row['id_pengirim'] === $currentUserId),
        'text'            => waDecryptMessage($row['isi_terenkripsi']),
        'status'          => $row['status_pesan'],
        'created_at'      => $row['created_at'],
        'time'            => $ts ? date('H:i', $ts) : '',
    ];
}

// ------------------------------------------------------------------------------
// PENANGANAN ENDPOINT (hanya jika file ini dipanggil langsung via HTTP)
// ------------------------------------------------------------------------------
if (basename($_SERVER['PHP_SELF'] ?? '') === 'messages.php') {
    header('Content-Type: application/json; charset=utf-8');

    $userId = requireAuth();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $input  = array_merge($_GET, $_POST, waGetJsonInput());
    $action = (string)($input['action'] ?? ($method === 'POST' ? 'send' : 'list'));

    try {
        $pdo = waGetDb();

        switch ($action) {
            /**
             * POST api/messages.php?action=send
             */
            case 'send':
                if ($method !== 'POST') {
                    waJsonResponse(['success' => false, 'message' => 'Gunakan metode POST untuk mengirim pesan.'], 405);
                }

                $conversationId = (int)($input['conversation_id'] ?? 0);
                $text = trim((string)($input['message_text'] ?? $input['message'] ?? ''));

                if ($conversationId <= 0) {
                    waJsonResponse(['success' => false, 'message' => 'conversation_id wajib diisi.'], 400);
                }
                if ($text === '') {
                    waJsonResponse(['success' => false, 'message' => 'Pesan tidak boleh kosong.'], 400);
                }
                if (mb_strlen($text) > 4000) {
                    waJsonResponse(['success' => false, 'message' => 'Pesan terlalu panjang (maksimal 4000 karakter).'], 400);
                }
                if (!waUserInConversation($pdo, $conversationId, $userId)) {
                    waJsonResponse(['success' => false, 'message' => 'Anda bukan peserta percakapan ini.'], 403);
                }

                $stmt = $pdo->prepare("
                    INSERT INTO tbl_pesan (id_pengirim, id_percakapan, isi_terenkripsi, status_pesan)
                    VALUES (:sender, :conv, :isi, 'terkirim')
                ");
                $stmt->bindValue(':sender', $userId, PDO::PARAM_INT);
                $stmt->bindValue(':conv', $conversationId, PDO::PARAM_INT);
                $stmt->bindValue(':isi', waEncryptMessage($text), PDO::PARAM_LOB);
                $stmt->execute();
                $newId = (int)$pdo->lastInsertId();

                touchUserLastSeen($pdo, $userId);

                $stmt = $pdo->prepare('
                    SELECT id_pesan, id_pengirim, id_percakapan, isi_terenkripsi, status_pesan, created_at
                    FROM tbl_pesan
                    WHERE id_pesan = :id
                ');
                $stmt->execute([':id' => $newId]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);

                waJsonResponse([
                    'success' => true,
                    'message' => 'Pesan terkirim.',
                    'data'    => waFormatMessage($row, $userId),
                ], 201);
                break;

            /**
             * GET api/messages.php?conversation_id={id}[&since_id={id}]
             */
            case 'list':
                $conversationId = (int)($input['conversation_id'] ?? 0);
                $sinceId = max(0, (int)($input['since_id'] ?? 0));

                if ($conversationId <= 0) {
                    waJsonResponse(['success' => false, 'message' => 'conversation_id wajib diisi.'], 400);
                }
                if (!waUserInConversation($pdo, $conversationId, $userId)) {
                    waJsonResponse(['success' => false, 'message' => 'Anda bukan peserta percakapan ini.'], 403);
                }

                // Tandai pesan masuk dari lawan bicara sebagai 'dibaca' sebelum membaca list
                $upd = $pdo->prepare("
                    UPDATE tbl_pesan
                    SET status_pesan = 'dibaca',
                        diterima_at = COALESCE(diterima_at, NOW()),
                        dibaca_at = NOW()
                    WHERE id_percakapan = :conv AND id_pengirim <> :uid AND status_pesan <> 'dibaca'
                ");
                $upd->execute([':conv' => $conversationId, ':uid' => $userId]);

                $stmt = $pdo->prepare('
                    SELECT id_pesan, id_pengirim, id_percakapan, isi_terenkripsi, status_pesan, created_at
                    FROM tbl_pesan
                    WHERE id_percakapan = :conv AND id_pesan > :since
                    ORDER BY created_at ASC, id_pesan ASC
                ');
                $stmt->execute([':conv' => $conversationId, ':since' => $sinceId]);

                $messages = [];
                $lastId = $sinceId;
                foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
                    $messages[] = waFormatMessage($row, $userId);
                    $lastId = max($lastId, (int)$row['id_pesan']);
                }

                // Kirim daftar status receipt terbaru untuk pesan milik user aktif (agar centang update real-time saat polling)
                $receiptStmt = $pdo->prepare("
                    SELECT id_pesan, status_pesan
                    FROM tbl_pesan
                    WHERE id_percakapan = :conv
                      AND id_pengirim = :uid
                      AND status_pesan IN ('diterima', 'dibaca')
                ");
                $receiptStmt->execute([':conv' => $conversationId, ':uid' => $userId]);
                $deliveredIds = [];
                $readIds = [];
                foreach ($receiptStmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
                    if ($r['status_pesan'] === 'dibaca') {
                        $readIds[] = (int)$r['id_pesan'];
                    } else {
                        $deliveredIds[] = (int)$r['id_pesan'];
                    }
                }

                touchUserLastSeen($pdo, $userId);

                waJsonResponse([
                    'success'       => true,
                    'data'          => $messages,
                    'last_id'       => $lastId,
                    'delivered_ids' => $deliveredIds,
                    'read_ids'      => $readIds,
                ]);
                break;

            default:
                waJsonResponse(['success' => false, 'message' => 'Aksi tidak dikenali.'], 400);
        }
    } catch (PDOException $e) {
        error_log('[Messages API DB Error] ' . $e->getMessage());
        waJsonResponse(['success' => false, 'message' => 'Terjadi kendala pada database.'], 500);
    } catch (Throwable $e) {
        error_log('[Messages API Error] ' . $e->getMessage());
        waJsonResponse(['success' => false, 'message' => 'Terjadi kesalahan pada server.'], 500);
    }
    exit;
}
