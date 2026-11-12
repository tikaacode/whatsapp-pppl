<?php
/**
 * WhatsApp PPPL - Modul Kontak & Daftar Percakapan
 * Penulis: Muhammad Zaldy Syah Firaz (NIM: 10241054)
 * Peran  : Backend Developer (Urutan 5 - Chat, Contacts & Messages API)
 *
 * Endpoint:
 *   GET  api/contacts.php?action=list               -> daftar kontak + pesan terakhir (urut terbaru)
 *   POST api/contacts.php?action=start_conversation -> body { "contact_id": <id_pengguna kontak> }
 *                                                      mengembalikan id_percakapan (dibuat jika belum ada)
 */

require_once __DIR__ . '/messages.php'; // auth.php + helper (dekripsi, format waktu, cari percakapan)

if (basename($_SERVER['PHP_SELF'] ?? '') === 'contacts.php') {
    header('Content-Type: application/json; charset=utf-8');

    $userId = requireAuth();
    $method = $_SERVER['REQUEST_METHOD'];
    $input  = array_merge($_GET, $_POST, waGetJsonInput());
    $action = $input['action'] ?? 'list';

    try {
        $pdo = getDbConnection();

        switch ($action) {
            // ------------------------------------------------------------------
            // GET api/contacts.php?action=list
            // ------------------------------------------------------------------
            case 'list':
                $stmt = $pdo->prepare("
                    SELECT
                        k.id_kontak,
                        k.nama_kontak,
                        p.id_pengguna        AS contact_user_id,
                        p.no_telepon,
                        p.nama_profil,
                        p.foto_profil,
                        p.about,
                        p.last_seen,
                        c.id_percakapan,
                        m.id_pesan           AS last_message_id,
                        m.id_pengirim        AS last_sender_id,
                        m.isi_terenkripsi    AS last_message_blob,
                        m.created_at         AS last_message_time,
                        m.status_pesan       AS last_message_status,
                        (
                            SELECT COUNT(*) FROM tbl_pesan u
                            WHERE u.id_percakapan = c.id_percakapan
                              AND u.id_pengirim <> :uid_unread
                              AND u.status_pesan <> 'dibaca'
                        ) AS unread_count
                    FROM tbl_kontak k
                    JOIN tbl_pengguna p ON p.id_pengguna = k.id_pengguna_kontak
                    LEFT JOIN tbl_percakapan c
                        ON (c.id_pengguna_1 = :uid_a AND c.id_pengguna_2 = k.id_pengguna_kontak)
                        OR (c.id_pengguna_1 = k.id_pengguna_kontak AND c.id_pengguna_2 = :uid_b)
                    LEFT JOIN tbl_pesan m
                        ON m.id_pesan = (
                            SELECT MAX(x.id_pesan) FROM tbl_pesan x WHERE x.id_percakapan = c.id_percakapan
                        )
                    WHERE k.id_pemilik = :uid_owner
                    ORDER BY last_message_time DESC, k.nama_kontak ASC
                ");
                $stmt->execute([
                    ':uid_unread' => $userId,
                    ':uid_a'      => $userId,
                    ':uid_b'      => $userId,
                    ':uid_owner'  => $userId,
                ]);

                $contacts = [];
                foreach ($stmt->fetchAll() as $row) {
                    $lastMessage = null;
                    if ($row['last_message_id'] !== null) {
                        $lastMessage = [
                            'id'         => (int)$row['last_message_id'],
                            'text'       => waDecryptMessage($row['last_message_blob']),
                            'time'       => waFormatChatTime($row['last_message_time']),
                            'created_at' => $row['last_message_time'],
                            'status'     => $row['last_message_status'],
                            'is_mine'    => ((int)$row['last_sender_id'] === $userId),
                        ];
                    }

                    $contacts[] = [
                        'id_kontak'       => (int)$row['id_kontak'],
                        'contact_id'      => (int)$row['contact_user_id'],   // id_pengguna lawan bicara
                        'name'            => $row['nama_kontak'],
                        'profile_name'    => $row['nama_profil'],
                        'phone'           => $row['no_telepon'],
                        'avatar'          => $row['foto_profil'],
                        'about'           => $row['about'],
                        'last_seen'       => $row['last_seen'],
                        'conversation_id' => $row['id_percakapan'] !== null ? (int)$row['id_percakapan'] : null,
                        'last_message'    => $lastMessage,
                        'unread_count'    => (int)$row['unread_count'],
                    ];
                }

                waJsonResponse(['success' => true, 'data' => $contacts]);
                break;

            // ------------------------------------------------------------------
            // POST api/contacts.php?action=start_conversation
            // ------------------------------------------------------------------
            case 'start_conversation':
                if ($method !== 'POST') {
                    waJsonResponse(['success' => false, 'message' => 'Gunakan metode POST.'], 405);
                }

                $contactId = (int)($input['contact_id'] ?? 0);
                if ($contactId <= 0) {
                    waJsonResponse(['success' => false, 'message' => 'contact_id wajib diisi.'], 400);
                }
                if ($contactId === $userId) {
                    waJsonResponse(['success' => false, 'message' => 'Tidak dapat memulai percakapan dengan diri sendiri.'], 400);
                }

                $stmt = $pdo->prepare('SELECT 1 FROM tbl_pengguna WHERE id_pengguna = :id LIMIT 1');
                $stmt->execute([':id' => $contactId]);
                if (!$stmt->fetchColumn()) {
                    waJsonResponse(['success' => false, 'message' => 'Pengguna kontak tidak ditemukan.'], 404);
                }

                $conversationId = waFindConversation($pdo, $userId, $contactId);
                $created = false;

                if ($conversationId === null) {
                    $u1 = min($userId, $contactId);
                    $u2 = max($userId, $contactId);
                    try {
                        $ins = $pdo->prepare('INSERT INTO tbl_percakapan (id_pengguna_1, id_pengguna_2) VALUES (:u1, :u2)');
                        $ins->execute([':u1' => $u1, ':u2' => $u2]);
                        $conversationId = (int)$pdo->lastInsertId();
                        $created = true;
                    } catch (PDOException $e) {
                        // Balapan request ganda (UNIQUE pasangan): ambil yang sudah ada
                        if ($e->getCode() !== '23000') {
                            throw $e;
                        }
                        $conversationId = waFindConversation($pdo, $userId, $contactId);
                    }
                }

                waJsonResponse([
                    'success' => true,
                    'data'    => [
                        'conversation_id' => $conversationId,
                        'id_percakapan'   => $conversationId,
                        'contact_id'      => $contactId,
                        'created'         => $created,
                    ],
                ], $created ? 201 : 200);
                break;

            default:
                waJsonResponse(['success' => false, 'message' => 'Aksi tidak dikenali: ' . htmlspecialchars((string)$action)], 400);
        }
    } catch (PDOException $e) {
        error_log('[Contacts API] ' . $e->getMessage());
        waJsonResponse(['success' => false, 'message' => 'Terjadi kendala pada database: ' . $e->getMessage()], 500);
    } catch (Throwable $e) {
        error_log('[Contacts API] ' . $e->getMessage());
        waJsonResponse(['success' => false, 'message' => 'Terjadi kesalahan server: ' . $e->getMessage()], 500);
    }
    exit;
}
