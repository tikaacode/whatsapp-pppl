<?php
/**
 * ==============================================================================
 * WhatsNew (PPPL) - Modul API Status 24 Jam & Privasi Audiens
 * ==============================================================================
 *
 * Pengembang : Raihandy Wijaya (NIM: 10241064)
 * Peran      : Backend Developer (Status 24 Jam & Privacy API Specialist - Urutan 4)
 * File Target: api/status.php
 *
 * Endpoint:
 *   POST api/status.php?action=create    -> buat status teks/media aktif 24 jam
 *   GET  api/status.php?action=feed      -> ambil my_status, recent_updates, viewed_updates
 *   POST api/status.php?action=view      -> tandai status dilihat (tervalidasi privasi)
 *   GET  api/status.php?action=viewers   -> daftar penonton untuk status milik sendiri
 *   POST api/status.php?action=delete    -> hapus status & file media milik sendiri
 *   GET  api/status.php?action=contacts  -> daftar kontak untuk seleksi privasi
 */

require_once __DIR__ . '/messages.php';

/**
 * Validasi apakah $viewerId berhak melihat status milik $ownerId sesuai relasi kontak & privasi.
 */
function waCanUserViewStatus(PDO $pdo, int $statusId, int $ownerId, string $privasi, int $viewerId): bool
{
    if ($ownerId === $viewerId) {
        return true;
    }

    // Harus memiliki relasi kontak minimal satu arah
    $stmtContact = $pdo->prepare('
        SELECT 1 FROM tbl_kontak
        WHERE (id_pemilik = :o1 AND id_pengguna_kontak = :v1)
           OR (id_pemilik = :v2 AND id_pengguna_kontak = :o2)
        LIMIT 1
    ');
    $stmtContact->execute([
        ':o1' => $ownerId,
        ':v1' => $viewerId,
        ':v2' => $viewerId,
        ':o2' => $ownerId,
    ]);
    if (!$stmtContact->fetchColumn()) {
        return false;
    }

    if ($privasi === 'semua_kontak') {
        return true;
    }

    $stmtAud = $pdo->prepare('
        SELECT 1 FROM tbl_status_audiens
        WHERE id_status = :sid AND id_pengguna = :vid
        LIMIT 1
    ');
    $stmtAud->execute([':sid' => $statusId, ':vid' => $viewerId]);
    $inAudience = (bool)$stmtAud->fetchColumn();

    if ($privasi === 'kecuali_beberapa') {
        return !$inAudience;
    }
    if ($privasi === 'hanya_terpilih') {
        return $inAudience;
    }

    return false;
}

/**
 * Hapus file fisik status media secara aman (hanya jika berada dalam folder uploads/status).
 */
function waDeleteStatusMediaFile(?string $relativePath): void
{
    if (!$relativePath) {
        return;
    }
    $baseDir = realpath(__DIR__ . '/../uploads/status');
    if ($baseDir === false) {
        return;
    }
    $targetPath = realpath(__DIR__ . '/../' . ltrim($relativePath, '/\\'));
    if ($targetPath !== false && str_starts_with($targetPath, $baseDir . DIRECTORY_SEPARATOR) && is_file($targetPath)) {
        @unlink($targetPath);
    }
}

if (basename($_SERVER['PHP_SELF'] ?? '') === 'status.php') {
    header('Content-Type: application/json; charset=utf-8');

    $userId = requireAuth();
    $input  = array_merge($_GET, $_POST, waGetJsonInput());
    $action = (string)($input['action'] ?? 'feed');

    $pdo = null;

    try {
        $pdo = waGetDb();

        switch ($action) {
            /**
             * POST api/status.php?action=create
             */
            case 'create':
                requirePostMethod('Metode HTTP tidak diizinkan. Gunakan POST untuk membuat status.');

                $jenisStatus = trim((string)($input['jenis_status'] ?? 'teks'));
                if (!in_array($jenisStatus, ['teks', 'media'], true)) {
                    $jenisStatus = 'teks';
                }

                $isiStatus = trim((string)($input['isi_status'] ?? $input['isi_terenkripsi'] ?? $input['isi'] ?? ''));
                if (mb_strlen($isiStatus) > 1000) {
                    waJsonResponse(['success' => false, 'message' => 'Teks status terlalu panjang (maksimal 1000 karakter).'], 400);
                }

                $warnaLatar = trim((string)($input['warna_latar'] ?? '#075e54'));
                if ($warnaLatar === '' || !preg_match('/^#[0-9a-fA-F]{6}$/', $warnaLatar)) {
                    $warnaLatar = '#075e54';
                }

                // Path media hanya berasal dari file upload tervalidasi (tidak menerima path arbitrary dari input user)
                $pathMedia = '';
                if (isset($_FILES['media_file']) && $_FILES['media_file']['error'] !== UPLOAD_ERR_NO_FILE) {
                    $uploadErr = (int)$_FILES['media_file']['error'];
                    if ($uploadErr !== UPLOAD_ERR_OK) {
                        waJsonResponse(['success' => false, 'message' => 'Gagal mengunggah file media.'], 400);
                    }

                    $maxBytes = 5 * 1024 * 1024; // 5 MB
                    if ((int)$_FILES['media_file']['size'] > $maxBytes) {
                        waJsonResponse(['success' => false, 'message' => 'Ukuran file gambar maksimal 5 MB.'], 400);
                    }

                    $fileTmp = $_FILES['media_file']['tmp_name'];
                    $finfo = new finfo(FILEINFO_MIME_TYPE);
                    $mime = $finfo->file($fileTmp) ?: '';
                    $mimeToExt = [
                        'image/jpeg' => 'jpg',
                        'image/png'  => 'png',
                        'image/webp' => 'webp',
                        'image/gif'  => 'gif',
                    ];

                    if (!isset($mimeToExt[$mime]) || @getimagesize($fileTmp) === false) {
                        waJsonResponse(['success' => false, 'message' => 'Format file tidak didukung. Unggah gambar JPG, PNG, WEBP, atau GIF.'], 400);
                    }

                    $uploadDir = __DIR__ . '/../uploads/status/';
                    if (!is_dir($uploadDir)) {
                        mkdir($uploadDir, 0755, true);
                    }

                    $ext = $mimeToExt[$mime];
                    $uniqueName = 'status_' . $userId . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
                    $targetPath = $uploadDir . $uniqueName;

                    if (!move_uploaded_file($fileTmp, $targetPath)) {
                        waJsonResponse(['success' => false, 'message' => 'Gagal menyimpan file gambar di server.'], 500);
                    }

                    $pathMedia = 'uploads/status/' . $uniqueName;
                    $jenisStatus = 'media';
                }

                if ($jenisStatus === 'teks' && $isiStatus === '') {
                    waJsonResponse(['success' => false, 'message' => 'Isi teks status tidak boleh kosong.'], 400);
                }
                if ($jenisStatus === 'media' && $pathMedia === '' && $isiStatus === '') {
                    waJsonResponse(['success' => false, 'message' => 'Status gambar memerlukan file gambar atau keterangan.'], 400);
                }

                $privasi = trim((string)($input['privasi'] ?? 'semua_kontak'));
                if (!in_array($privasi, ['semua_kontak', 'kecuali_beberapa', 'hanya_terpilih'], true)) {
                    $privasi = 'semua_kontak';
                }

                $audiensRaw = $input['audiens_ids'] ?? $input['audiens'] ?? [];
                if (is_string($audiensRaw)) {
                    $audiensRaw = explode(',', $audiensRaw);
                }

                $audiensIds = [];
                if (is_array($audiensRaw)) {
                    $stmtFind = $pdo->prepare('SELECT id_pengguna FROM tbl_pengguna WHERE nama_profil = :nama LIMIT 1');
                    foreach ($audiensRaw as $item) {
                        $item = trim((string)$item);
                        if (is_numeric($item) && (int)$item > 0) {
                            $audiensIds[] = (int)$item;
                        } elseif ($item !== '') {
                            $stmtFind->execute([':nama' => $item]);
                            $foundId = $stmtFind->fetchColumn();
                            if ($foundId) {
                                $audiensIds[] = (int)$foundId;
                            }
                        }
                    }
                }
                $audiensIds = array_values(array_unique(array_filter($audiensIds, fn($id) => $id !== $userId)));

                $encryptedContent = $isiStatus !== '' ? waEncryptMessage($isiStatus) : '';

                $pdo->beginTransaction();

                $stmtInsert = $pdo->prepare('
                    INSERT INTO tbl_status (
                        id_pengguna, jenis_status, isi_terenkripsi, path_media, privasi, warna_latar, created_at, expired_at
                    ) VALUES (
                        :id_pengguna, :jenis, :isi, :path_media, :privasi, :warna, NOW(), NOW() + INTERVAL 24 HOUR
                    )
                ');
                $stmtInsert->bindValue(':id_pengguna', $userId, PDO::PARAM_INT);
                $stmtInsert->bindValue(':jenis', $jenisStatus, PDO::PARAM_STR);
                $stmtInsert->bindValue(':isi', $encryptedContent, PDO::PARAM_LOB);
                $stmtInsert->bindValue(':path_media', $pathMedia !== '' ? $pathMedia : null, $pathMedia !== '' ? PDO::PARAM_STR : PDO::PARAM_NULL);
                $stmtInsert->bindValue(':privasi', $privasi, PDO::PARAM_STR);
                $stmtInsert->bindValue(':warna', $jenisStatus === 'teks' ? $warnaLatar : null, $jenisStatus === 'teks' ? PDO::PARAM_STR : PDO::PARAM_NULL);
                $stmtInsert->execute();

                $statusId = (int)$pdo->lastInsertId();

                if (in_array($privasi, ['kecuali_beberapa', 'hanya_terpilih'], true) && !empty($audiensIds)) {
                    $stmtAudience = $pdo->prepare('
                        INSERT IGNORE INTO tbl_status_audiens (id_status, id_pengguna)
                        VALUES (:id_status, :id_pengguna)
                    ');
                    foreach ($audiensIds as $audId) {
                        $stmtAudience->execute([
                            ':id_status'   => $statusId,
                            ':id_pengguna' => $audId,
                        ]);
                    }
                }

                $pdo->commit();
                touchUserLastSeen($pdo, $userId);

                $stmtGet = $pdo->prepare('
                    SELECT s.id_status, s.id_pengguna, s.jenis_status, s.isi_terenkripsi, s.path_media,
                           s.privasi, s.warna_latar, s.created_at, s.expired_at,
                           p.nama_profil, p.foto_profil
                    FROM tbl_status s
                    JOIN tbl_pengguna p ON p.id_pengguna = s.id_pengguna
                    WHERE s.id_status = :id
                    LIMIT 1
                ');
                $stmtGet->execute([':id' => $statusId]);
                $newStatus = $stmtGet->fetch(PDO::FETCH_ASSOC);

                waJsonResponse([
                    'success' => true,
                    'message' => 'Status berhasil dibuat dan aktif selama 24 jam.',
                    'data'    => [
                        'id_status'     => (int)$newStatus['id_status'],
                        'id_pengguna'   => (int)$newStatus['id_pengguna'],
                        'nama_pengguna' => $newStatus['nama_profil'],
                        'foto_profil'   => $newStatus['foto_profil'],
                        'jenis_status'  => $newStatus['jenis_status'],
                        'isi_status'    => waDecryptMessage($newStatus['isi_terenkripsi']),
                        'path_media'    => $newStatus['path_media'],
                        'warna_latar'   => $newStatus['warna_latar'],
                        'privasi'       => $newStatus['privasi'],
                        'audiens_count' => count($audiensIds),
                        'created_at'    => $newStatus['created_at'],
                        'expired_at'    => $newStatus['expired_at'],
                        'time_ago'      => waFormatTimeAgo($newStatus['created_at']),
                    ],
                ], 201);
                break;

            /**
             * GET api/status.php?action=feed
             */
            case 'feed':
                // 1. Ambil status aktif milik pengguna aktif
                $stmtMyStatus = $pdo->prepare('
                    SELECT s.id_status, s.id_pengguna, s.jenis_status, s.isi_terenkripsi,
                           s.path_media, s.privasi, s.warna_latar, s.created_at, s.expired_at,
                           p.nama_profil, p.foto_profil
                    FROM tbl_status s
                    JOIN tbl_pengguna p ON p.id_pengguna = s.id_pengguna
                    WHERE s.id_pengguna = :user_id
                      AND s.expired_at > NOW()
                    ORDER BY s.created_at DESC
                ');
                $stmtMyStatus->execute([':user_id' => $userId]);
                $myStatusRows = $stmtMyStatus->fetchAll(PDO::FETCH_ASSOC);

                // Batch fetch semua penonton untuk my_status dalam 1 query (menghindari N+1)
                $viewersByStatus = [];
                if (!empty($myStatusRows)) {
                    $myIds = array_map(fn($r) => (int)$r['id_status'], $myStatusRows);
                    $placeholders = implode(',', array_fill(0, count($myIds), '?'));
                    $stmtViewers = $pdo->prepare("
                        SELECT v.id_status, v.dilihat_at, p.id_pengguna, p.nama_profil, p.foto_profil
                        FROM tbl_status_dilihat v
                        JOIN tbl_pengguna p ON p.id_pengguna = v.id_penonton
                        WHERE v.id_status IN ($placeholders)
                          AND v.id_penonton <> ?
                        ORDER BY v.dilihat_at DESC
                    ");
                    $stmtViewers->execute([...$myIds, $userId]);
                    foreach ($stmtViewers->fetchAll(PDO::FETCH_ASSOC) as $vw) {
                        $sid = (int)$vw['id_status'];
                        $viewersByStatus[$sid][] = [
                            'id_pengguna' => (int)$vw['id_pengguna'],
                            'nama_profil' => $vw['nama_profil'],
                            'foto_profil' => $vw['foto_profil'],
                            'dilihat_at'  => $vw['dilihat_at'],
                            'time_ago'    => waFormatTimeAgo($vw['dilihat_at']),
                        ];
                    }
                }

                $myStatus = [];
                foreach ($myStatusRows as $row) {
                    $sid = (int)$row['id_status'];
                    $vList = $viewersByStatus[$sid] ?? [];
                    $myStatus[] = [
                        'id_status'     => $sid,
                        'id_pengguna'   => (int)$row['id_pengguna'],
                        'nama_pengguna' => $row['nama_profil'],
                        'foto_profil'   => $row['foto_profil'],
                        'jenis_status'  => $row['jenis_status'],
                        'isi_status'    => waDecryptMessage($row['isi_terenkripsi']),
                        'path_media'    => $row['path_media'],
                        'warna_latar'   => $row['warna_latar'],
                        'privasi'       => $row['privasi'],
                        'created_at'    => $row['created_at'],
                        'expired_at'    => $row['expired_at'],
                        'time_ago'      => waFormatTimeAgo($row['created_at']),
                        'viewers_count' => count($vList),
                        'viewers'       => $vList,
                    ];
                }

                // 2. Ambil status aktif teman sesuai relasi kontak & filter privasi (single-quoted SQL literals)
                $queryFriendsStatus = "
                    SELECT s.id_status, s.id_pengguna, s.jenis_status, s.isi_terenkripsi,
                           s.path_media, s.privasi, s.warna_latar, s.created_at, s.expired_at,
                           p.nama_profil, p.foto_profil,
                           k.nama_kontak,
                           d.id_status_dilihat,
                           d.dilihat_at
                    FROM tbl_status s
                    JOIN tbl_pengguna p ON p.id_pengguna = s.id_pengguna
                    LEFT JOIN tbl_kontak k
                        ON (k.id_pemilik = :user_id_k AND k.id_pengguna_kontak = s.id_pengguna)
                    LEFT JOIN tbl_status_dilihat d
                        ON (d.id_status = s.id_status AND d.id_penonton = :user_id_d)
                    WHERE s.id_pengguna <> :user_id_self
                      AND s.expired_at > NOW()
                      AND (
                          EXISTS (
                              SELECT 1 FROM tbl_kontak c1
                              WHERE c1.id_pemilik = s.id_pengguna AND c1.id_pengguna_kontak = :user_id_c1
                          )
                          OR EXISTS (
                              SELECT 1 FROM tbl_kontak c2
                              WHERE c2.id_pemilik = :user_id_c2 AND c2.id_pengguna_kontak = s.id_pengguna
                          )
                      )
                      AND (
                          s.privasi = 'semua_kontak'
                          OR (
                              s.privasi = 'kecuali_beberapa'
                              AND NOT EXISTS (
                                  SELECT 1 FROM tbl_status_audiens sa1
                                  WHERE sa1.id_status = s.id_status AND sa1.id_pengguna = :user_id_sa1
                              )
                          )
                          OR (
                              s.privasi = 'hanya_terpilih'
                              AND EXISTS (
                                  SELECT 1 FROM tbl_status_audiens sa2
                                  WHERE sa2.id_status = s.id_status AND sa2.id_pengguna = :user_id_sa2
                              )
                          )
                      )
                    ORDER BY s.created_at DESC
                ";

                $stmtFriends = $pdo->prepare($queryFriendsStatus);
                $stmtFriends->execute([
                    ':user_id_k'    => $userId,
                    ':user_id_d'    => $userId,
                    ':user_id_self' => $userId,
                    ':user_id_c1'   => $userId,
                    ':user_id_c2'   => $userId,
                    ':user_id_sa1'  => $userId,
                    ':user_id_sa2'  => $userId,
                ]);

                $recentUpdates = [];
                $viewedUpdates = [];

                foreach ($stmtFriends->fetchAll(PDO::FETCH_ASSOC) as $row) {
                    $isViewed = !empty($row['id_status_dilihat']);
                    $statusItem = [
                        'id_status'     => (int)$row['id_status'],
                        'id_pengguna'   => (int)$row['id_pengguna'],
                        'nama_pengguna' => $row['nama_kontak'] ?: $row['nama_profil'],
                        'nama_asli'     => $row['nama_profil'],
                        'foto_profil'   => $row['foto_profil'],
                        'jenis_status'  => $row['jenis_status'],
                        'isi_status'    => waDecryptMessage($row['isi_terenkripsi']),
                        'path_media'    => $row['path_media'],
                        'warna_latar'   => $row['warna_latar'],
                        'privasi'       => $row['privasi'],
                        'created_at'    => $row['created_at'],
                        'expired_at'    => $row['expired_at'],
                        'time_ago'      => waFormatTimeAgo($row['created_at']),
                        'sudah_dilihat' => $isViewed,
                        'dilihat_at'    => $row['dilihat_at'],
                    ];

                    if ($isViewed) {
                        $viewedUpdates[] = $statusItem;
                    } else {
                        $recentUpdates[] = $statusItem;
                    }
                }

                waJsonResponse([
                    'success' => true,
                    'data'    => [
                        'current_user_id' => $userId,
                        'my_status'       => $myStatus,
                        'recent_updates'  => $recentUpdates,
                        'viewed_updates'  => $viewedUpdates,
                    ],
                ]);
                break;

            /**
             * POST api/status.php?action=view
             */
            case 'view':
                requirePostMethod('Gunakan metode POST untuk menandai status telah dilihat.');
                $statusId = isset($input['status_id']) ? (int)$input['status_id'] : (int)($input['id_status'] ?? 0);

                if ($statusId <= 0) {
                    waJsonResponse(['success' => false, 'message' => 'Parameter status_id tidak valid.'], 400);
                }

                $stmtCheck = $pdo->prepare('
                    SELECT id_status, id_pengguna, privasi, (expired_at <= NOW()) AS is_expired
                    FROM tbl_status
                    WHERE id_status = :id
                    LIMIT 1
                ');
                $stmtCheck->execute([':id' => $statusId]);
                $targetStatus = $stmtCheck->fetch(PDO::FETCH_ASSOC);

                if (!$targetStatus) {
                    waJsonResponse(['success' => false, 'message' => 'Status tidak ditemukan.'], 404);
                }
                if ((int)$targetStatus['is_expired'] === 1) {
                    waJsonResponse(['success' => false, 'message' => 'Status ini telah kedaluwarsa (lebih dari 24 jam).'], 410);
                }

                $ownerId = (int)$targetStatus['id_pengguna'];
                if ($ownerId === $userId) {
                    waJsonResponse([
                        'success'   => true,
                        'message'   => 'Status milik sendiri dibuka (tidak dicatat ke penonton).',
                        'is_owner'  => true,
                        'status_id' => $statusId,
                    ]);
                }

                if (!waCanUserViewStatus($pdo, $statusId, $ownerId, (string)$targetStatus['privasi'], $userId)) {
                    waJsonResponse(['success' => false, 'message' => 'Anda tidak memiliki izin untuk melihat status ini.'], 403);
                }

                $stmtView = $pdo->prepare('
                    INSERT IGNORE INTO tbl_status_dilihat (id_status, id_penonton, dilihat_at)
                    VALUES (:status_id, :user_id, NOW())
                ');
                $stmtView->execute([
                    ':status_id' => $statusId,
                    ':user_id'   => $userId,
                ]);

                waJsonResponse([
                    'success'   => true,
                    'message'   => 'Status berhasil ditandai telah dilihat.',
                    'is_owner'  => false,
                    'status_id' => $statusId,
                ]);
                break;

            /**
             * GET api/status.php?action=viewers&status_id=...
             */
            case 'viewers':
                $statusId = isset($input['status_id']) ? (int)$input['status_id'] : (int)($input['id_status'] ?? 0);

                if ($statusId <= 0) {
                    waJsonResponse(['success' => false, 'message' => 'Parameter status_id tidak valid.'], 400);
                }

                $stmtOwner = $pdo->prepare('SELECT id_status, id_pengguna FROM tbl_status WHERE id_status = :id LIMIT 1');
                $stmtOwner->execute([':id' => $statusId]);
                $ownerCheck = $stmtOwner->fetch(PDO::FETCH_ASSOC);

                if (!$ownerCheck) {
                    waJsonResponse(['success' => false, 'message' => 'Status tidak ditemukan.'], 404);
                }
                if ((int)$ownerCheck['id_pengguna'] !== $userId) {
                    waJsonResponse(['success' => false, 'message' => 'Anda hanya dapat melihat daftar penonton untuk status milik Anda sendiri.'], 403);
                }

                $stmtList = $pdo->prepare('
                    SELECT d.id_status_dilihat, d.dilihat_at, p.id_pengguna, p.nama_profil, p.foto_profil
                    FROM tbl_status_dilihat d
                    JOIN tbl_pengguna p ON p.id_pengguna = d.id_penonton
                    WHERE d.id_status = :id_status AND d.id_penonton <> :owner_id
                    ORDER BY d.dilihat_at DESC
                ');
                $stmtList->execute([':id_status' => $statusId, ':owner_id' => $userId]);

                $formatted = array_map(fn($v) => [
                    'id_pengguna' => (int)$v['id_pengguna'],
                    'nama_profil' => $v['nama_profil'],
                    'foto_profil' => $v['foto_profil'],
                    'dilihat_at'  => $v['dilihat_at'],
                    'time_ago'    => waFormatTimeAgo($v['dilihat_at']),
                ], $stmtList->fetchAll(PDO::FETCH_ASSOC));

                waJsonResponse([
                    'success' => true,
                    'data'    => [
                        'status_id'     => $statusId,
                        'viewers_count' => count($formatted),
                        'viewers'       => $formatted,
                    ],
                ]);
                break;

            /**
             * POST api/status.php?action=delete
             */
            case 'delete':
                requirePostMethod('Gunakan metode POST untuk menghapus status.');
                $statusId = isset($input['status_id']) ? (int)$input['status_id'] : (int)($input['id_status'] ?? 0);

                if ($statusId <= 0) {
                    waJsonResponse(['success' => false, 'message' => 'Parameter status_id tidak valid.'], 400);
                }

                // Ambil path_media dulu sebelum dihapus agar file fisik ikut dibersihkan
                $stmtFindMedia = $pdo->prepare('
                    SELECT path_media
                    FROM tbl_status
                    WHERE id_status = :id AND id_pengguna = :user_id
                    LIMIT 1
                ');
                $stmtFindMedia->execute([':id' => $statusId, ':user_id' => $userId]);
                $mediaRow = $stmtFindMedia->fetch(PDO::FETCH_ASSOC);

                if (!$mediaRow) {
                    waJsonResponse(['success' => false, 'message' => 'Status tidak ditemukan atau Anda tidak memiliki akses untuk menghapusnya.'], 404);
                }

                $stmtDelete = $pdo->prepare('
                    DELETE FROM tbl_status
                    WHERE id_status = :id AND id_pengguna = :user_id
                ');
                $stmtDelete->execute([':id' => $statusId, ':user_id' => $userId]);

                if ($stmtDelete->rowCount() > 0) {
                    waDeleteStatusMediaFile($mediaRow['path_media'] ?? null);
                    waJsonResponse(['success' => true, 'message' => 'Status berhasil dihapus.']);
                }

                waJsonResponse(['success' => false, 'message' => 'Status tidak ditemukan.'], 404);
                break;

            /**
             * GET api/status.php?action=contacts
             */
            case 'contacts':
                $stmtContacts = $pdo->prepare('
                    SELECT k.id_kontak, k.id_pengguna_kontak, k.nama_kontak,
                           p.nama_profil, p.foto_profil, p.no_telepon
                    FROM tbl_kontak k
                    JOIN tbl_pengguna p ON p.id_pengguna = k.id_pengguna_kontak
                    WHERE k.id_pemilik = :user_id
                    ORDER BY k.nama_kontak ASC
                ');
                $stmtContacts->execute([':user_id' => $userId]);

                waJsonResponse([
                    'success' => true,
                    'data'    => $stmtContacts->fetchAll(PDO::FETCH_ASSOC),
                ]);
                break;

            default:
                waJsonResponse(['success' => false, 'message' => 'Aksi status tidak dikenali.'], 400);
        }
    } catch (PDOException $e) {
        if ($pdo instanceof PDO && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log('[Status API DB Error] ' . $e->getMessage());
        waJsonResponse(['success' => false, 'message' => 'Terjadi kendala pada basis data.'], 500);
    } catch (Throwable $e) {
        if ($pdo instanceof PDO && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log('[Status API Error] ' . $e->getMessage());
        waJsonResponse(['success' => false, 'message' => 'Terjadi kesalahan pada server.'], 500);
    }
    exit;
}
