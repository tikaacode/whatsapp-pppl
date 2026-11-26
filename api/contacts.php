<?php
/**
 * WhatsNew (PPPL) - Modul Kontak & Daftar Percakapan
 * Penulis: Muhammad Zaldy Syah Firaz (NIM: 10241054)
 * Peran  : Backend Developer (Urutan 5 - Chat, Contacts & Messages API)
 *
 * Endpoint:
 *   GET  api/contacts.php?action=list               -> daftar kontak & percakapan aktif + pesan terakhir
 *   POST api/contacts.php?action=start_conversation -> body { "contact_id": <id_pengguna kontak> }
 */

require_once __DIR__ . '/messages.php';

if (basename($_SERVER['PHP_SELF'] ?? '') === 'contacts.php') {
    header('Content-Type: application/json; charset=utf-8');

    $userId = requireAuth();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $input  = array_merge($_GET, $_POST, waGetJsonInput());
    $action = (string)($input['action'] ?? 'list');

    try {
        $pdo = waGetDb();

        switch ($action) {
            /**
             * GET api/contacts.php?action=list
             * Menggabungkan buku kontak (tbl_kontak) DAN pengguna lain yang sudah memiliki
             * ruang percakapan (tbl_percakapan) agar chat dari pengguna baru tidak pernah hilang.
             */
            case 'list':
                // Tandai pesan masuk yang masih 'terkirim' di percakapan user ini menjadi 'diterima'
                $markDelivered = $pdo->prepare("
                    UPDATE tbl_pesan m
                    JOIN tbl_percakapan c ON c.id_percakapan = m.id_percakapan
                    SET m.status_pesan = 'diterima',
                        m.diterima_at = COALESCE(m.diterima_at, NOW())
                    WHERE (c.id_pengguna_1 = :uid_d1 OR c.id_pengguna_2 = :uid_d2)
                      AND m.id_pengirim <> :uid_d3
                      AND m.status_pesan = 'terkirim'
                ");
                $markDelivered->execute([
                    ':uid_d1' => $userId,
                    ':uid_d2' => $userId,
                    ':uid_d3' => $userId,
                ]);

                $stmt = $pdo->prepare("
                    SELECT
                        k.id_kontak,
                        COALESCE(k.nama_kontak, p.nama_profil) AS display_name,
                        p.id_pengguna                          AS contact_user_id,
                        p.no_telepon,
                        p.nama_profil,
                        p.foto_profil,
                        p.about,
                        p.last_seen,
                        c.id_percakapan,
                        m.id_pesan                             AS last_message_id,
                        m.id_pengirim                          AS last_sender_id,
                        m.isi_terenkripsi                      AS last_message_blob,
                        m.created_at                           AS last_message_time,
                        m.status_pesan                         AS last_message_status,
                        (
                            SELECT COUNT(*)
                            FROM tbl_pesan u
                            WHERE u.id_percakapan = c.id_percakapan
                              AND u.id_pengirim <> :uid_unread
                              AND u.status_pesan <> 'dibaca'
                        ) AS unread_count
                    FROM (
                        SELECT id_pengguna_kontak AS peer_id
                        FROM tbl_kontak
                        WHERE id_pemilik = :uid_k1
                        UNION
                        SELECT CASE
                            WHEN id_pengguna_1 = :uid_p1 THEN id_pengguna_2
                            ELSE id_pengguna_1
                        END AS peer_id
                        FROM tbl_percakapan
                        WHERE id_pengguna_1 = :uid_p2 OR id_pengguna_2 = :uid_p3
                    ) peers
                    JOIN tbl_pengguna p ON p.id_pengguna = peers.peer_id
                    LEFT JOIN tbl_kontak k
                        ON k.id_pemilik = :uid_k2 AND k.id_pengguna_kontak = p.id_pengguna
                    LEFT JOIN tbl_percakapan c
                        ON (c.id_pengguna_1 = :uid_a AND c.id_pengguna_2 = p.id_pengguna)
                        OR (c.id_pengguna_1 = p.id_pengguna AND c.id_pengguna_2 = :uid_b)
                    LEFT JOIN tbl_pesan m
                        ON m.id_pesan = (
                            SELECT MAX(x.id_pesan)
                            FROM tbl_pesan x
                            WHERE x.id_percakapan = c.id_percakapan
                        )
                    WHERE p.id_pengguna <> :uid_self
                    ORDER BY (m.created_at IS NULL) ASC, m.created_at DESC, display_name ASC
                ");
                $stmt->execute([
                    ':uid_unread' => $userId,
                    ':uid_k1'     => $userId,
                    ':uid_p1'     => $userId,
                    ':uid_p2'     => $userId,
                    ':uid_p3'     => $userId,
                    ':uid_k2'     => $userId,
                    ':uid_a'      => $userId,
                    ':uid_b'      => $userId,
                    ':uid_self'   => $userId,
                ]);

                $contacts = [];
                foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
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
                        'id_kontak'       => $row['id_kontak'] !== null ? (int)$row['id_kontak'] : null,
                        'contact_id'      => (int)$row['contact_user_id'],
                        'name'            => $row['display_name'],
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

                touchUserLastSeen($pdo, $userId);
                waJsonResponse(['success' => true, 'data' => $contacts]);
                break;

            /**
             * POST api/contacts.php?action=start_conversation
             */
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
                waJsonResponse(['success' => false, 'message' => 'Aksi tidak dikenali.'], 400);
        }
    } catch (PDOException $e) {
        error_log('[Contacts API DB Error] ' . $e->getMessage());
        waJsonResponse(['success' => false, 'message' => 'Terjadi kendala pada database.'], 500);
    } catch (Throwable $e) {
        error_log('[Contacts API Error] ' . $e->getMessage());
        waJsonResponse(['success' => false, 'message' => 'Terjadi kesalahan pada server.'], 500);
    }
    exit;
}
