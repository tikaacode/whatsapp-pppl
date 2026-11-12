<?php
/**
 * ==============================================================================
 * WhatsApp PPPL - Modul API Status 24 Jam & Privasi Audiens
 * ==============================================================================
 * 
 * Pengembang : Raihandy Wijaya (NIM: 10241064)
 * Peran      : Backend Developer (Status 24 Jam & Privacy API Specialist - Urutan 4)
 * Proyek     : WhatsApp PPPL (Praktikum Pengembangan Perangkat Lunak)
 * File Target: api/status.php
 * 
 * Deskripsi:
 * Menangani fungsionalitas status cerita (stories) 24 jam dengan:
 * 1. Proteksi sesi login aktif ($_SESSION['user_id']).
 * 2. Pembuatan status teks/media dengan masa kedaluwarsa otomatis 24 jam (expired_at = NOW() + 24 Jam).
 * 3. Pengaturan privasi selektif:
 *    - 'semua_kontak'     : Semua kontak yang saling terhubung dapat melihat.
 *    - 'kecuali_beberapa' : Semua kontak kecuali ID kontak yang tercatat di tbl_status_audiens.
 *    - 'hanya_terpilih'   : Hanya ID kontak yang tercatat di tbl_status_audiens yang dapat melihat.
 * 4. Pengambilan feed status aktif (expired_at > NOW()) yang dipisahkan menjadi:
 *    - my_status       : Status milik pengguna aktif beserta jumlah & daftar penonton.
 *    - recent_updates  : Status teman yang belum ditonton.
 *    - viewed_updates  : Status teman yang sudah pernah dibuka.
 * 5. Penandaan status telah dilihat (viewed) dengan pencegahan duplikasi (INSERT IGNORE).
 * 6. Penghapusan status aktif oleh pemiliknya (delete status).
 * ==============================================================================
 */

// 1. Header Wajib Respons JSON
header('Content-Type: application/json; charset=utf-8');

// 2. Inisialisasi Sesi PHP jika belum aktif
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// 3. Hubungkan ke Konfigurasi Database (PDO)
$configFile = __DIR__ . '/../config/database.local.php';
if (file_exists($configFile)) {
    require_once $configFile;
} else {
    require_once __DIR__ . '/../config/database.example.php';
}

// ------------------------------------------------------------------------------
// 4. PROTEKSI SESI LOGIN (BAGIAN 4.1 SPESIFIKASI)
// ------------------------------------------------------------------------------
$userId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;

// Fallback untuk kemudahan testing jika parameter simulasi disertakan dan sesi kosong
if (!$userId && isset($_REQUEST['simulate_user_id']) && is_numeric($_REQUEST['simulate_user_id'])) {
    $userId = (int)$_REQUEST['simulate_user_id'];
    $_SESSION['user_id'] = $userId;
}

if (!$userId) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Autentikasi diperlukan.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ------------------------------------------------------------------------------
// 5. HELPER FORMAT WAKTU RELATIF
// ------------------------------------------------------------------------------
/**
 * Mengubah timestamp MySQL menjadi format waktu relatif bahasa Indonesia
 * Contoh: "Baru saja", "15 menit lalu", "2 jam lalu", "Kemarin"
 * 
 * @param string $datetime
 * @return string
 */
function formatTimeAgo(string $datetime): string
{
    $time = strtotime($datetime);
    $diff = time() - $time;

    if ($diff < 60) {
        return 'Baru saja';
    } elseif ($diff < 3600) {
        $minutes = floor($diff / 60);
        return $minutes . ' menit lalu';
    } elseif ($diff < 86400) {
        $hours = floor($diff / 3600);
        return $hours . ' jam lalu';
    } elseif ($diff < 172800) {
        return 'Kemarin pukul ' . date('H:i', $time);
    } else {
        return date('d/m/Y H:i', $time);
    }
}

// ------------------------------------------------------------------------------
// 6. PENANGANAN INPUT REQUEST (GET, POST x-www-form-urlencoded, dan JSON)
// ------------------------------------------------------------------------------
$rawInput = file_get_contents('php://input');
$jsonInput = json_decode($rawInput, true) ?? [];
$input = array_merge($_GET, $_POST, $jsonInput);

$action = $input['action'] ?? 'feed';

try {
    $pdo = getDbConnection();

    switch ($action) {
        /**
         * ----------------------------------------------------------------------
         * ACTION: create (POST api/status.php?action=create)
         * Spesifikasi 4.2: Buat Status Baru dengan masa aktif 24 jam & privasi
         * ----------------------------------------------------------------------
         */
        case 'create':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST' && empty($jsonInput)) {
                http_response_code(405);
                echo json_encode([
                    'success' => false,
                    'message' => 'Metode HTTP tidak diizinkan. Gunakan POST untuk membuat status.'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }

            // Ekstraksi parameter input
            $jenisStatus = trim($input['jenis_status'] ?? 'teks');
            if (!in_array($jenisStatus, ['teks', 'media'], true)) {
                $jenisStatus = 'teks';
            }

            // Teks isi status
            $isiStatus = trim($input['isi_status'] ?? $input['isi_terenkripsi'] ?? $input['isi'] ?? '');

            // Warna latar (default #075e54)
            $warnaLatar = trim($input['warna_latar'] ?? '#075e54');
            if (empty($warnaLatar) || !preg_match('/^#[0-9a-fA-F]{6}$/', $warnaLatar)) {
                $warnaLatar = '#075e54';
            }

            // Path media jika status media
            $pathMedia = trim($input['path_media'] ?? '');

            // Penanganan upload file media jika ada multipart/form-data
            if (isset($_FILES['media_file']) && $_FILES['media_file']['error'] === UPLOAD_ERR_OK) {
                $fileTmp = $_FILES['media_file']['tmp_name'];
                $fileName = basename($_FILES['media_file']['name']);
                $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
                $allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

                if (in_array($ext, $allowedExts, true)) {
                    $uploadDir = __DIR__ . '/../uploads/status/';
                    if (!is_dir($uploadDir)) {
                        mkdir($uploadDir, 0777, true);
                    }
                    $uniqueName = 'status_' . $userId . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
                    $targetPath = $uploadDir . $uniqueName;
                    if (move_uploaded_file($fileTmp, $targetPath)) {
                        $pathMedia = 'uploads/status/' . $uniqueName;
                        $jenisStatus = 'media';
                    }
                }
            }

            // Validasi kelengkapan data
            if ($jenisStatus === 'teks' && $isiStatus === '') {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Isi teks status tidak boleh kosong.'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }

            if ($jenisStatus === 'media' && empty($pathMedia) && empty($isiStatus)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Status gambar memerlukan file gambar atau keterangan.'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }

            // Pengaturan privasi
            $privasi = trim($input['privasi'] ?? 'semua_kontak');
            $allowedPrivacy = ['semua_kontak', 'kecuali_beberapa', 'hanya_terpilih'];
            if (!in_array($privasi, $allowedPrivacy, true)) {
                $privasi = 'semua_kontak';
            }

            // ID audiens (kontak terpilih / kontak dikecualikan)
            $audiensRaw = $input['audiens_ids'] ?? $input['audiens'] ?? [];
            $audiensIds = [];

            if (is_string($audiensRaw)) {
                $audiensRaw = explode(',', $audiensRaw);
            }

            if (is_array($audiensRaw)) {
                foreach ($audiensRaw as $item) {
                    $item = trim((string)$item);
                    if (is_numeric($item) && (int)$item > 0) {
                        $audiensIds[] = (int)$item;
                    } elseif (!empty($item)) {
                        // Jika frontend mengirim nama kontak (misal 'Budi Santoso'), cocokkan ID-nya
                        $stmtFind = $pdo->prepare('
                            SELECT id_pengguna FROM tbl_pengguna WHERE nama_profil = :nama LIMIT 1
                        ');
                        $stmtFind->execute([':nama' => $item]);
                        $foundId = $stmtFind->fetchColumn();
                        if ($foundId) {
                            $audiensIds[] = (int)$foundId;
                        }
                    }
                }
            }
            $audiensIds = array_unique(array_filter($audiensIds, fn($id) => $id !== $userId));

            // Transaksi Database untuk memastikan integritas tbl_status & tbl_status_audiens
            $pdo->beginTransaction();

            // INSERT status dengan perhitungan otomatis kedaluwarsa 24 jam (NOW() + INTERVAL 24 HOUR)
            $stmtInsert = $pdo->prepare('
                INSERT INTO tbl_status (
                    id_pengguna, jenis_status, isi_terenkripsi, path_media, privasi, warna_latar, created_at, expired_at
                ) VALUES (
                    :id_pengguna, :jenis, :isi, :path_media, :privasi, :warna, NOW(), NOW() + INTERVAL 24 HOUR
                )
            ');

            $stmtInsert->execute([
                ':id_pengguna' => $userId,
                ':jenis'       => $jenisStatus,
                ':isi'         => $isiStatus,
                ':path_media'  => !empty($pathMedia) ? $pathMedia : null,
                ':privasi'     => $privasi,
                ':warna'       => ($jenisStatus === 'teks') ? $warnaLatar : null,
            ]);

            $statusId = (int)$pdo->lastInsertId();

            // Jika privasi selektif, simpan daftar ID kontak ke tbl_status_audiens
            if (in_array($privasi, ['kecuali_beberapa', 'hanya_terpilih'], true) && !empty($audiensIds)) {
                $stmtAudience = $pdo->prepare('
                    INSERT IGNORE INTO tbl_status_audiens (id_status, id_pengguna)
                    VALUES (:id_status, :id_pengguna)
                ');
                foreach ($audiensIds as $audId) {
                    $stmtAudience->execute([
                        ':id_status'   => $statusId,
                        ':id_pengguna' => $audId
                    ]);
                }
            }

            $pdo->commit();

            // Ambil data status yang baru dibuat untuk konfirmasi
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

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Status berhasil dibuat dan aktif selama 24 jam.',
                'data'    => [
                    'id_status'      => (int)$newStatus['id_status'],
                    'id_pengguna'    => (int)$newStatus['id_pengguna'],
                    'nama_pengguna'  => $newStatus['nama_profil'],
                    'foto_profil'    => $newStatus['foto_profil'],
                    'jenis_status'   => $newStatus['jenis_status'],
                    'isi_status'     => (string)$newStatus['isi_terenkripsi'],
                    'path_media'     => $newStatus['path_media'],
                    'warna_latar'    => $newStatus['warna_latar'],
                    'privasi'        => $newStatus['privasi'],
                    'audiens_count'  => count($audiensIds),
                    'created_at'     => $newStatus['created_at'],
                    'expired_at'     => $newStatus['expired_at'],
                    'time_ago'       => formatTimeAgo($newStatus['created_at'])
                ]
            ], JSON_UNESCAPED_UNICODE);
            break;

        /**
         * ----------------------------------------------------------------------
         * ACTION: feed (GET api/status.php?action=feed)
         * Spesifikasi 4.3: Mengambil Status Aktif (< 24 Jam) Sesuai Filter Privasi
         * Terbagi menjadi: my_status, recent_updates, viewed_updates
         * ----------------------------------------------------------------------
         */
        case 'feed':
            // 1. Ambil SEMUA Status Aktif Milik Pengguna yang Sedang Login (my_status)
            $stmtMyStatus = $pdo->prepare('
                SELECT s.id_status, s.id_pengguna, s.jenis_status, s.isi_terenkripsi,
                       s.path_media, s.privasi, s.warna_latar, s.created_at, s.expired_at,
                       p.nama_profil, p.foto_profil,
                       (SELECT COUNT(DISTINCT d.id_penonton) 
                        FROM tbl_status_dilihat d 
                        WHERE d.id_status = s.id_status AND d.id_penonton != :user_id1) AS viewers_count
                FROM tbl_status s
                JOIN tbl_pengguna p ON p.id_pengguna = s.id_pengguna
                WHERE s.id_pengguna = :user_id2
                  AND s.expired_at > NOW()
                ORDER BY s.created_at DESC
            ');
            $stmtMyStatus->execute([
                ':user_id1' => $userId,
                ':user_id2' => $userId
            ]);
            $myStatusRows = $stmtMyStatus->fetchAll(PDO::FETCH_ASSOC);

            // Format my_status dan sertakan daftar penontonnya
            $myStatus = [];
            foreach ($myStatusRows as $row) {
                // Ambil daftar penonton untuk setiap status milik user aktif
                $stmtViewers = $pdo->prepare('
                    SELECT v.id_status_dilihat, v.dilihat_at, p.id_pengguna, p.nama_profil, p.foto_profil
                    FROM tbl_status_dilihat v
                    JOIN tbl_pengguna p ON p.id_pengguna = v.id_penonton
                    WHERE v.id_status = :id_status AND v.id_penonton != :user_id
                    ORDER BY v.dilihat_at DESC
                ');
                $stmtViewers->execute([
                    ':id_status' => $row['id_status'],
                    ':user_id'   => $userId
                ]);
                $viewersList = $stmtViewers->fetchAll(PDO::FETCH_ASSOC);

                $formattedViewers = array_map(function ($vw) {
                    return [
                        'id_pengguna' => (int)$vw['id_pengguna'],
                        'nama_profil' => $vw['nama_profil'],
                        'foto_profil' => $vw['foto_profil'],
                        'dilihat_at'  => $vw['dilihat_at'],
                        'time_ago'    => formatTimeAgo($vw['dilihat_at'])
                    ];
                }, $viewersList);

                $myStatus[] = [
                    'id_status'      => (int)$row['id_status'],
                    'id_pengguna'    => (int)$row['id_pengguna'],
                    'nama_pengguna'  => $row['nama_profil'],
                    'foto_profil'    => $row['foto_profil'],
                    'jenis_status'   => $row['jenis_status'],
                    'isi_status'     => (string)$row['isi_terenkripsi'],
                    'path_media'     => $row['path_media'],
                    'warna_latar'    => $row['warna_latar'],
                    'privasi'        => $row['privasi'],
                    'created_at'     => $row['created_at'],
                    'expired_at'     => $row['expired_at'],
                    'time_ago'       => formatTimeAgo($row['created_at']),
                    'viewers_count'  => (int)$row['viewers_count'],
                    'viewers'        => $formattedViewers
                ];
            }

            // 2. Ambil Status Aktif Milik Teman dengan Filter Privasi & Relasi Kontak
            // Logika Privasi:
            // a. expired_at > NOW()
            // b. s.id_pengguna != :user_id
            // c. Teman menyimpan kontak user login ATAU user login menyimpan kontak teman
            //    (relasi kontak di tbl_kontak)
            // d. Privasi:
            //    - 'semua_kontak': user login diizinkan melihat
            //    - 'kecuali_beberapa': user login BUKAN audiens yang dikecualikan (NOT IN tbl_status_audiens)
            //    - 'hanya_terpilih': user login TERDAFTAR sebagai audiens terpilih (IN tbl_status_audiens)
            // e. LEFT JOIN tbl_status_dilihat untuk mendeteksi apakah sudah ditonton oleh user login
            $queryFriendsStatus = '
                SELECT s.id_status, s.id_pengguna, s.jenis_status, s.isi_terenkripsi,
                       s.path_media, s.privasi, s.warna_latar, s.created_at, s.expired_at,
                       p.nama_profil, p.foto_profil,
                       k.nama_kontak,
                       d.id_status_dilihat,
                       d.dilihat_at
                FROM tbl_status s
                JOIN tbl_pengguna p ON p.id_pengguna = s.id_pengguna
                -- Hubungkan dengan buku kontak user aktif jika ada nama kontak khusus
                LEFT JOIN tbl_kontak k ON (k.id_pemilik = :user_id_k AND k.id_pengguna_kontak = s.id_pengguna)
                -- Cek apakah status sudah pernah dilihat oleh user aktif
                LEFT JOIN tbl_status_dilihat d ON (d.id_status = s.id_status AND d.id_penonton = :user_id_d)
                WHERE s.id_pengguna != :user_id_self
                  AND s.expired_at > NOW()
                  -- Pembuat status harus terhubung kontak dengan user login
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
                  -- Filter aturan privasi pembuat status
                  AND (
                      s.privasi = "semua_kontak"
                      OR (
                          s.privasi = "kecuali_beberapa"
                          AND NOT EXISTS (
                              SELECT 1 FROM tbl_status_audiens sa1
                              WHERE sa1.id_status = s.id_status AND sa1.id_pengguna = :user_id_sa1
                          )
                      )
                      OR (
                          s.privasi = "hanya_terpilih"
                          AND EXISTS (
                              SELECT 1 FROM tbl_status_audiens sa2
                              WHERE sa2.id_status = s.id_status AND sa2.id_pengguna = :user_id_sa2
                          )
                      )
                  )
                ORDER BY s.created_at DESC
            ';

            $stmtFriends = $pdo->prepare($queryFriendsStatus);
            $stmtFriends->execute([
                ':user_id_k'    => $userId,
                ':user_id_d'    => $userId,
                ':user_id_self' => $userId,
                ':user_id_c1'   => $userId,
                ':user_id_c2'   => $userId,
                ':user_id_sa1'  => $userId,
                ':user_id_sa2'  => $userId
            ]);
            $friendsRows = $stmtFriends->fetchAll(PDO::FETCH_ASSOC);

            $recentUpdates = [];
            $viewedUpdates = [];

            foreach ($friendsRows as $row) {
                $isViewed = !empty($row['id_status_dilihat']);

                $statusItem = [
                    'id_status'      => (int)$row['id_status'],
                    'id_pengguna'    => (int)$row['id_pengguna'],
                    'nama_pengguna'  => $row['nama_kontak'] ?: $row['nama_profil'],
                    'nama_asli'      => $row['nama_profil'],
                    'foto_profil'    => $row['foto_profil'],
                    'jenis_status'   => $row['jenis_status'],
                    'isi_status'     => (string)$row['isi_terenkripsi'],
                    'path_media'     => $row['path_media'],
                    'warna_latar'    => $row['warna_latar'],
                    'privasi'        => $row['privasi'],
                    'created_at'     => $row['created_at'],
                    'expired_at'     => $row['expired_at'],
                    'time_ago'       => formatTimeAgo($row['created_at']),
                    'sudah_dilihat'  => $isViewed,
                    'dilihat_at'     => $row['dilihat_at']
                ];

                if ($isViewed) {
                    $viewedUpdates[] = $statusItem;
                } else {
                    $recentUpdates[] = $statusItem;
                }
            }

            echo json_encode([
                'success' => true,
                'data'    => [
                    'current_user_id' => $userId,
                    'my_status'       => $myStatus,
                    'recent_updates'  => $recentUpdates,
                    'viewed_updates'  => $viewedUpdates
                ]
            ], JSON_UNESCAPED_UNICODE);
            break;

        /**
         * ----------------------------------------------------------------------
         * ACTION: view (POST api/status.php?action=view)
         * Spesifikasi 4.4: Menandai Status Telah Dilihat oleh Pengguna
         * ----------------------------------------------------------------------
         */
        case 'view':
            $statusId = isset($input['status_id']) ? (int)$input['status_id'] : (int)($input['id_status'] ?? 0);

            if ($statusId <= 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Parameter status_id tidak valid.'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }

            // Periksa keberadaan status dan masa aktifnya
            $stmtCheck = $pdo->prepare('
                SELECT id_status, id_pengguna, expired_at 
                FROM tbl_status 
                WHERE id_status = :id 
                LIMIT 1
            ');
            $stmtCheck->execute([':id' => $statusId]);
            $targetStatus = $stmtCheck->fetch(PDO::FETCH_ASSOC);

            if (!$targetStatus) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Status tidak ditemukan.'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }

            // Cek apakah sudah kedaluwarsa (> 24 jam)
            if (strtotime($targetStatus['expired_at']) <= time()) {
                http_response_code(410);
                echo json_encode([
                    'success' => false,
                    'message' => 'Status ini telah kedaluwarsa (lebih dari 24 jam).'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }

            // Jika status milik sendiri, tidak perlu dicatat sebagai viewer
            if ((int)$targetStatus['id_pengguna'] === $userId) {
                echo json_encode([
                    'success'   => true,
                    'message'   => 'Status milik sendiri dibuka (tidak dicatat ke penonton).',
                    'is_owner'  => true,
                    'status_id' => $statusId
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }

            // Catat penonton ke tbl_status_dilihat menggunakan INSERT IGNORE untuk cegah duplikasi
            $stmtView = $pdo->prepare('
                INSERT IGNORE INTO tbl_status_dilihat (id_status, id_penonton, dilihat_at)
                VALUES (:status_id, :user_id, NOW())
            ');
            $stmtView->execute([
                ':status_id' => $statusId,
                ':user_id'   => $userId
            ]);

            echo json_encode([
                'success'   => true,
                'message'   => 'Status berhasil ditandai telah dilihat.',
                'is_owner'  => false,
                'status_id' => $statusId
            ], JSON_UNESCAPED_UNICODE);
            break;

        /**
         * ----------------------------------------------------------------------
         * ACTION: viewers (GET api/status.php?action=viewers&status_id=...)
         * Melihat daftar penonton untuk status milik pengguna aktif
         * ----------------------------------------------------------------------
         */
        case 'viewers':
            $statusId = isset($input['status_id']) ? (int)$input['status_id'] : (int)($input['id_status'] ?? 0);

            if ($statusId <= 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Parameter status_id tidak valid.'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }

            // Pastikan status tersebut milik pengguna yang sedang login
            $stmtOwner = $pdo->prepare('
                SELECT id_status, id_pengguna FROM tbl_status WHERE id_status = :id LIMIT 1
            ');
            $stmtOwner->execute([':id' => $statusId]);
            $ownerCheck = $stmtOwner->fetch(PDO::FETCH_ASSOC);

            if (!$ownerCheck) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Status tidak ditemukan.']);
                exit;
            }

            if ((int)$ownerCheck['id_pengguna'] !== $userId) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Anda hanya dapat melihat daftar penonton untuk status milik Anda sendiri.'
                ]);
                exit;
            }

            $stmtList = $pdo->prepare('
                SELECT d.id_status_dilihat, d.dilihat_at, p.id_pengguna, p.nama_profil, p.foto_profil
                FROM tbl_status_dilihat d
                JOIN tbl_pengguna p ON p.id_pengguna = d.id_penonton
                WHERE d.id_status = :id_status
                ORDER BY d.dilihat_at DESC
            ');
            $stmtList->execute([':id_status' => $statusId]);
            $viewers = $stmtList->fetchAll(PDO::FETCH_ASSOC);

            $formatted = array_map(function ($v) {
                return [
                    'id_pengguna' => (int)$v['id_pengguna'],
                    'nama_profil' => $v['nama_profil'],
                    'foto_profil' => $v['foto_profil'],
                    'dilihat_at'  => $v['dilihat_at'],
                    'time_ago'    => formatTimeAgo($v['dilihat_at'])
                ];
            }, $viewers);

            echo json_encode([
                'success' => true,
                'data'    => [
                    'status_id'     => $statusId,
                    'viewers_count' => count($formatted),
                    'viewers'       => $formatted
                ]
            ], JSON_UNESCAPED_UNICODE);
            break;

        /**
         * ----------------------------------------------------------------------
         * ACTION: delete (POST api/status.php?action=delete)
         * Menghapus status milik pengguna aktif
         * ----------------------------------------------------------------------
         */
        case 'delete':
            $statusId = isset($input['status_id']) ? (int)$input['status_id'] : (int)($input['id_status'] ?? 0);

            if ($statusId <= 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Parameter status_id tidak valid.'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $stmtDelete = $pdo->prepare('
                DELETE FROM tbl_status 
                WHERE id_status = :id AND id_pengguna = :user_id
            ');
            $stmtDelete->execute([
                ':id'      => $statusId,
                ':user_id' => $userId
            ]);

            if ($stmtDelete->rowCount() > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Status berhasil dihapus.'
                ], JSON_UNESCAPED_UNICODE);
            } else {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Status tidak ditemukan atau Anda tidak memiliki akses untuk menghapusnya.'
                ], JSON_UNESCAPED_UNICODE);
            }
            break;

        /**
         * ----------------------------------------------------------------------
         * ACTION: contacts (GET api/status.php?action=contacts)
         * Daftar kontak pengguna aktif untuk modal seleksi audiens privasi status
         * ----------------------------------------------------------------------
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
            $contacts = $stmtContacts->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'data'    => $contacts
            ], JSON_UNESCAPED_UNICODE);
            break;

        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Aksi status tidak dikenali: ' . htmlspecialchars($action)
            ], JSON_UNESCAPED_UNICODE);
            break;
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Terjadi kendala pada basis data: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Terjadi kesalahan server: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

