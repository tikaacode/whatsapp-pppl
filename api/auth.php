<?php
/**
 * WhatsNew (PPPL) - Modul Autentikasi Pengguna & Sesi (OTP)
 * Penulis: Tika Mila Wahyuni (NIM: 10241070)
 * Peran  : Ketua Tim & Backend Developer (Urutan 3)
 * Deskripsi: Menangani alur login berbasis nomor telepon, pembangkitan kode OTP 6 digit,
 *            verifikasi OTP, manajemen sesi pengguna, serta helper otentikasi untuk modul lain.
 */

// 1. Inisialisasi Sesi PHP jika belum aktif (dengan atribut cookie lebih aman)
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'httponly' => true,
        'samesite' => 'Lax',
        'secure'   => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
    ]);
    session_start();
}

// 2. Hubungkan ke Konfigurasi Database
$configFile = __DIR__ . '/../config/database.local.php';
if (file_exists($configFile)) {
    require_once $configFile;
} else {
    require_once __DIR__ . '/../config/database.example.php';
}

// Pastikan default timezone & flag mode demo selalu terdefinisi meskipun database.local.php versi lama
if (!defined('APP_TIMEZONE')) {
    define('APP_TIMEZONE', 'Asia/Makassar');
}
if (!defined('APP_DEMO_MODE')) {
    define('APP_DEMO_MODE', true);
}
date_default_timezone_set(APP_TIMEZONE);

// ------------------------------------------------------------------------------
// FUNGSI HELPER GLOBAL (Dipakai oleh api/contacts.php, api/messages.php, api/status.php)
// ------------------------------------------------------------------------------

/**
 * Sinkronisasi timezone sesi MySQL dengan PHP pada koneksi PDO yang sudah ada.
 */
function syncDbTimezone(PDO $pdo): void
{
    static $synced = false;
    if ($synced) {
        return;
    }
    try {
        $offset = (new DateTimeImmutable('now', new DateTimeZone(APP_TIMEZONE)))->format('P');
        $pdo->exec('SET time_zone = ' . $pdo->quote($offset));
    } catch (Throwable $e) {
        error_log('[Auth] Gagal sinkronisasi timezone MySQL: ' . $e->getMessage());
    }
    $synced = true;
}

/**
 * Mendapatkan koneksi DB dengan timezone tersinkronisasi.
 */
function waGetDb(): PDO
{
    $pdo = getDbConnection();
    syncDbTimezone($pdo);
    return $pdo;
}

/**
 * Mendapatkan ID pengguna yang saat ini sedang login dari session.
 */
function getCurrentUserId(): ?int
{
    return isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
}

/**
 * Membersihkan seluruh data sesi PHP secara aman.
 */
function clearAuthSession(): void
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }
}

/**
 * Mendapatkan profil lengkap pengguna yang saat ini sedang login.
 */
function getCurrentUser(): ?array
{
    $userId = getCurrentUserId();
    if (!$userId) {
        return null;
    }

    try {
        $pdo = waGetDb();
        $stmt = $pdo->prepare('
            SELECT id_pengguna, no_telepon, nama_profil, foto_profil, about, last_seen
            FROM tbl_pengguna
            WHERE id_pengguna = :id
            LIMIT 1
        ');
        $stmt->execute([':id' => $userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        return $user ?: null;
    } catch (Throwable $e) {
        error_log('[Auth Error] Gagal mengambil profil user aktif: ' . $e->getMessage());
        return null;
    }
}

/**
 * Memastikan request terautentikasi. Jika belum login atau akun sudah tidak ada di DB,
 * kembalikan HTTP 401 dan hentikan script.
 */
function requireAuth(): int
{
    $userId = getCurrentUserId();
    if (!$userId) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Sesi login tidak valid atau telah kedaluwarsa. Silakan masuk kembali.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    return $userId;
}

/**
 * Memastikan endpoint mutasi hanya dipanggil dengan metode POST.
 */
function requirePostMethod(string $message = 'Metode HTTP tidak diizinkan. Gunakan POST.'): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'message' => $message
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

/**
 * Perbarui kolom last_seen pengguna aktif (non-blocking jika gagal).
 */
function touchUserLastSeen(PDO $pdo, int $userId): void
{
    try {
        $stmt = $pdo->prepare('UPDATE tbl_pengguna SET last_seen = NOW() WHERE id_pengguna = :id');
        $stmt->execute([':id' => $userId]);
    } catch (Throwable $e) {
        error_log('[Auth] Gagal memperbarui last_seen: ' . $e->getMessage());
    }
}

/**
 * Normalisasi format nomor telepon (mendukung +62, +60, +65 dan format lokal).
 * - +62 / 628xx diseragamkan menjadi 08xx agar selaras dengan data seed Indonesia.
 * - Kode negara lain (+60, +65, dll.) dipertahankan tanpa spasi/tanda hubung, dengan prefiks '+'.
 */
function normalizePhoneNumber(string $phone): string
{
    $clean = preg_replace('/[^\d+]/', '', trim($phone));
    if ($clean === '') {
        return '';
    }

    if (str_starts_with($clean, '+62')) {
        $rest = ltrim(substr($clean, 3), '0');
        return '0' . $rest;
    }
    if (str_starts_with($clean, '62') && strlen($clean) > 10) {
        $rest = ltrim(substr($clean, 2), '0');
        return '0' . $rest;
    }
    if (str_starts_with($clean, '+')) {
        $digits = preg_replace('/\D/', '', substr($clean, 1));
        return $digits !== '' ? '+' . $digits : '';
    }

    return preg_replace('/\D/', '', $clean);
}

// ------------------------------------------------------------------------------
// PENANGANAN PERMINTAAN ENDPOINT (Jika dipanggil langsung via HTTP)
// ------------------------------------------------------------------------------
if (basename($_SERVER['PHP_SELF'] ?? '') === 'auth.php') {
    header('Content-Type: application/json; charset=utf-8');

    $rawInput = file_get_contents('php://input');
    $jsonInput = json_decode($rawInput ?: '', true);
    if (!is_array($jsonInput)) {
        $jsonInput = [];
    }
    $input = array_merge($_GET, $_POST, $jsonInput);

    $action = (string)($input['action'] ?? 'me');

    try {
        switch ($action) {
            /**
             * POST api/auth.php?action=send_otp (SKPL-F-001)
             */
            case 'send_otp':
                requirePostMethod('Gunakan metode POST untuk mengirim kode OTP.');
                $pdo = waGetDb();
                $rawPhone = (string)($input['phone'] ?? $input['phone_number'] ?? $input['no_telepon'] ?? '');
                $phone = normalizePhoneNumber($rawPhone);

                if ($phone === '' || strlen(preg_replace('/\D/', '', $phone)) < 8 || strlen($phone) > 20) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Nomor telepon tidak valid. Masukkan nomor telepon dengan benar (8-20 digit).'
                    ], JSON_UNESCAPED_UNICODE);
                    exit;
                }

                $otpCode = strval(random_int(100000, 999999));

                $_SESSION['pending_otp'] = [
                    'phone'      => $phone,
                    'otp'        => $otpCode,
                    'created_at' => time(),
                    'expires_at' => time() + 300,
                ];

                $stmt = $pdo->prepare('SELECT id_pengguna, nama_profil, foto_profil FROM tbl_pengguna WHERE no_telepon = :phone LIMIT 1');
                $stmt->execute([':phone' => $phone]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                $respData = [
                    'phone'         => $phone,
                    'is_registered' => (bool)$user,
                    'nama_profil'   => $user['nama_profil'] ?? null,
                ];
                if (APP_DEMO_MODE) {
                    $respData['otp_debug'] = $otpCode;
                }

                echo json_encode([
                    'success' => true,
                    'message' => 'Kode verifikasi 6 digit telah dikirimkan ke nomor ' . $phone,
                    'data'    => $respData,
                ], JSON_UNESCAPED_UNICODE);
                break;

            /**
             * POST api/auth.php?action=verify_otp (SKPL-F-001)
             */
            case 'verify_otp':
                requirePostMethod('Gunakan metode POST untuk memverifikasi kode OTP.');
                $pdo = waGetDb();
                $rawPhone = (string)($input['phone'] ?? $input['phone_number'] ?? $input['no_telepon'] ?? '');
                $phone = normalizePhoneNumber($rawPhone);
                $otpInput = trim((string)($input['otp'] ?? $input['otp_code'] ?? ''));
                $namaProfil = trim((string)($input['nama_profil'] ?? ''));

                if ($phone === '' || strlen(preg_replace('/\D/', '', $phone)) < 8) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Nomor telepon tidak valid.'
                    ], JSON_UNESCAPED_UNICODE);
                    exit;
                }

                if ($otpInput === '' || !preg_match('/^\d{6}$/', $otpInput)) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Kode OTP 6 digit wajib diisi.'
                    ], JSON_UNESCAPED_UNICODE);
                    exit;
                }

                $pending = $_SESSION['pending_otp'] ?? null;
                $isValidOtp = false;

                if (
                    is_array($pending)
                    && ($pending['phone'] ?? '') === $phone
                    && time() <= (int)($pending['expires_at'] ?? 0)
                    && hash_equals((string)($pending['otp'] ?? ''), $otpInput)
                ) {
                    $isValidOtp = true;
                }

                // Fallback kode pengujian praktikum hanya aktif saat APP_DEMO_MODE = true
                if (APP_DEMO_MODE && ($otpInput === '123456' || $otpInput === '481920')) {
                    $isValidOtp = true;
                }

                if (!$isValidOtp) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Kode OTP yang Anda masukkan salah atau sudah kedaluwarsa.'
                    ], JSON_UNESCAPED_UNICODE);
                    exit;
                }

                $stmt = $pdo->prepare('SELECT * FROM tbl_pengguna WHERE no_telepon = :phone LIMIT 1');
                $stmt->execute([':phone' => $phone]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                $isNewUser = !$user;

                if (!$user) {
                    $namaBaru = $namaProfil !== '' ? mb_substr($namaProfil, 0, 100) : 'Pengguna Baru (' . substr($phone, -4) . ')';
                    $pdo->beginTransaction();
                    try {
                        $insertStmt = $pdo->prepare('
                            INSERT INTO tbl_pengguna (no_telepon, nama_profil, foto_profil, about, last_seen, created_at)
                            VALUES (:phone, :nama, NULL, :about, NOW(), NOW())
                        ');
                        $insertStmt->execute([
                            ':phone' => $phone,
                            ':nama'  => $namaBaru,
                            ':about' => 'Ada untuk berkolaborasi dan belajar.',
                        ]);

                        $newId = (int)$pdo->lastInsertId();

                        // 1. Tambahkan seluruh pengguna lama ke buku kontak pengguna baru
                        $seedOutgoing = $pdo->prepare('
                            INSERT IGNORE INTO tbl_kontak (id_pemilik, id_pengguna_kontak, nama_kontak, created_at)
                            SELECT :owner_id, id_pengguna, nama_profil, NOW()
                            FROM tbl_pengguna
                            WHERE id_pengguna <> :self_id
                        ');
                        $seedOutgoing->execute([':owner_id' => $newId, ':self_id' => $newId]);

                        // 2. Tambahkan pengguna baru ke buku kontak pengguna lama agar chat dua arah langsung muncul
                        $seedIncoming = $pdo->prepare('
                            INSERT IGNORE INTO tbl_kontak (id_pemilik, id_pengguna_kontak, nama_kontak, created_at)
                            SELECT id_pengguna, :new_contact_id, :new_contact_name, NOW()
                            FROM tbl_pengguna
                            WHERE id_pengguna <> :self_id
                        ');
                        $seedIncoming->execute([
                            ':new_contact_id'   => $newId,
                            ':new_contact_name' => $namaBaru,
                            ':self_id'          => $newId,
                        ]);

                        $pdo->commit();
                    } catch (Throwable $txErr) {
                        if ($pdo->inTransaction()) {
                            $pdo->rollBack();
                        }
                        throw $txErr;
                    }

                    $stmt = $pdo->prepare('SELECT * FROM tbl_pengguna WHERE id_pengguna = :id LIMIT 1');
                    $stmt->execute([':id' => $newId]);
                    $user = $stmt->fetch(PDO::FETCH_ASSOC);
                } else {
                    touchUserLastSeen($pdo, (int)$user['id_pengguna']);
                }

                // Cegah session fixation setelah autentikasi berhasil
                session_regenerate_id(true);
                $_SESSION['user_id']     = (int)$user['id_pengguna'];
                $_SESSION['user_phone']  = $user['no_telepon'];
                $_SESSION['user_name']   = $user['nama_profil'];
                $_SESSION['user_avatar'] = $user['foto_profil'];
                unset($_SESSION['pending_otp']);

                echo json_encode([
                    'success' => true,
                    'message' => 'Verifikasi nomor telepon berhasil. Sesi masuk telah aktif.',
                    'data'    => [
                        'id_pengguna' => (int)$user['id_pengguna'],
                        'no_telepon'  => $user['no_telepon'],
                        'nama_profil' => $user['nama_profil'],
                        'foto_profil' => $user['foto_profil'],
                        'about'       => $user['about'],
                        'is_new_user' => $isNewUser,
                    ],
                ], JSON_UNESCAPED_UNICODE);
                break;

            /**
             * GET api/auth.php?action=me
             */
            case 'me':
            case 'check_session':
                $userId = getCurrentUserId();
                if (!$userId) {
                    echo json_encode([
                        'success'       => true,
                        'authenticated' => false,
                        'message'       => 'Tidak ada sesi aktif.',
                    ], JSON_UNESCAPED_UNICODE);
                    exit;
                }

                $user = getCurrentUser();
                if (!$user) {
                    // Sesi menunjuk user yang sudah dihapus / DB di-reset: bersihkan sesi hantu
                    clearAuthSession();
                    echo json_encode([
                        'success'       => true,
                        'authenticated' => false,
                        'message'       => 'Sesi tidak valid atau akun tidak ditemukan.',
                    ], JSON_UNESCAPED_UNICODE);
                    exit;
                }

                echo json_encode([
                    'success'       => true,
                    'authenticated' => true,
                    'data'          => $user,
                ], JSON_UNESCAPED_UNICODE);
                break;

            /**
             * POST api/auth.php?action=logout
             */
            case 'logout':
                requirePostMethod('Gunakan metode POST untuk keluar.');
                clearAuthSession();
                echo json_encode([
                    'success' => true,
                    'message' => 'Anda telah berhasil keluar (logout).',
                ], JSON_UNESCAPED_UNICODE);
                break;

            /**
             * POST api/auth.php?action=switch_user (Khusus APP_DEMO_MODE)
             */
            case 'switch_user':
                requirePostMethod('Gunakan metode POST untuk beralih akun.');
                if (!APP_DEMO_MODE) {
                    http_response_code(403);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Fitur beralih akun demo dinonaktifkan.'
                    ], JSON_UNESCAPED_UNICODE);
                    exit;
                }

                $pdo = waGetDb();
                $targetId = isset($input['user_id']) ? (int)$input['user_id'] : 0;
                if ($targetId <= 0) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'user_id tidak valid.'], JSON_UNESCAPED_UNICODE);
                    exit;
                }

                $stmt = $pdo->prepare('SELECT * FROM tbl_pengguna WHERE id_pengguna = :id LIMIT 1');
                $stmt->execute([':id' => $targetId]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$user) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'User ID target tidak ditemukan.'], JSON_UNESCAPED_UNICODE);
                    exit;
                }

                touchUserLastSeen($pdo, (int)$user['id_pengguna']);
                session_regenerate_id(true);
                $_SESSION['user_id']     = (int)$user['id_pengguna'];
                $_SESSION['user_phone']  = $user['no_telepon'];
                $_SESSION['user_name']   = $user['nama_profil'];
                $_SESSION['user_avatar'] = $user['foto_profil'];

                echo json_encode([
                    'success' => true,
                    'message' => 'Berhasil beralih ke akun: ' . $user['nama_profil'],
                    'data'    => $user,
                ], JSON_UNESCAPED_UNICODE);
                break;

            /**
             * POST api/auth.php?action=update_profile
             */
            case 'update_profile':
                requirePostMethod('Gunakan metode POST untuk memperbarui profil.');
                $userId = requireAuth();
                $pdo = waGetDb();
                $namaProfil = trim((string)($input['nama_profil'] ?? ''));

                if ($namaProfil === '' || mb_strlen($namaProfil) > 100) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Nama profil wajib diisi (maksimal 100 karakter).'
                    ], JSON_UNESCAPED_UNICODE);
                    exit;
                }

                $updStmt = $pdo->prepare('UPDATE tbl_pengguna SET nama_profil = :nama, last_seen = NOW() WHERE id_pengguna = :id');
                $updStmt->execute([
                    ':nama' => $namaProfil,
                    ':id'   => $userId,
                ]);

                // Sinkronkan juga nama kontak default bila masih berbentuk "Pengguna Baru (...)"
                $syncContacts = $pdo->prepare("
                    UPDATE tbl_kontak
                    SET nama_kontak = :nama
                    WHERE id_pengguna_kontak = :id AND nama_kontak LIKE 'Pengguna Baru (%)'
                ");
                $syncContacts->execute([
                    ':nama' => $namaProfil,
                    ':id'   => $userId,
                ]);

                $_SESSION['user_name'] = $namaProfil;

                echo json_encode([
                    'success' => true,
                    'message' => 'Profil berhasil diperbarui.',
                    'data'    => getCurrentUser(),
                ], JSON_UNESCAPED_UNICODE);
                break;

            /**
             * GET api/auth.php?action=demo_users
             */
            case 'demo_users':
                if (!APP_DEMO_MODE) {
                    echo json_encode([
                        'success'      => true,
                        'db_available' => true,
                        'data'         => [],
                    ], JSON_UNESCAPED_UNICODE);
                    break;
                }

                try {
                    $pdo = waGetDb();
                    $stmtUsers = $pdo->query('SELECT id_pengguna, no_telepon, nama_profil, foto_profil FROM tbl_pengguna ORDER BY id_pengguna ASC LIMIT 20');
                    $users = $stmtUsers->fetchAll(PDO::FETCH_ASSOC);

                    echo json_encode([
                        'success'      => true,
                        'db_available' => true,
                        'data'         => $users,
                    ], JSON_UNESCAPED_UNICODE);
                } catch (PDOException $e) {
                    error_log('[Auth demo_users] ' . $e->getMessage());
                    echo json_encode([
                        'success'      => true,
                        'db_available' => false,
                        'data'         => [],
                    ], JSON_UNESCAPED_UNICODE);
                }
                break;

            default:
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Aksi autentikasi tidak dikenali.'
                ], JSON_UNESCAPED_UNICODE);
                break;
        }
    } catch (PDOException $e) {
        error_log('[Auth API DB Error] ' . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Terjadi kendala pada koneksi database. Silakan coba lagi.'
        ], JSON_UNESCAPED_UNICODE);
    } catch (Throwable $e) {
        error_log('[Auth API Error] ' . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Terjadi kesalahan pada server.'
        ], JSON_UNESCAPED_UNICODE);
    }
    exit;
}
