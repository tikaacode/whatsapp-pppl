<?php
/**
 * WhatsApp PPPL - Modul Autentikasi Pengguna & Sesi (OTP)
 * Penulis: Tika Mila Wahyuni (NIM: 10241070)
 * Peran  : Ketua Tim & Backend Developer (Urutan 3)
 * Deskripsi: Menangani alur login berbasis nomor telepon, pembangkitan kode OTP 6 digit,
 *            verifikasi OTP, manajemen sesi pengguna, serta helper otentikasi untuk modul lain.
 */

// 1. Inisialisasi Sesi PHP jika belum aktif
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// 2. Hubungkan ke Konfigurasi Database
$configFile = __DIR__ . '/../config/database.local.php';
if (file_exists($configFile)) {
    require_once $configFile;
} else {
    require_once __DIR__ . '/../config/database.example.php';
}

// ------------------------------------------------------------------------------
// FUNGSI HELPER GLOBAL (Dapat digunakan oleh api/contacts.php, api/messages.php, api/status.php)
// ------------------------------------------------------------------------------

/**
 * Mendapatkan ID pengguna yang saat ini sedang login dari session.
 * @return int|null ID pengguna atau null jika belum login.
 */
function getCurrentUserId(): ?int
{
    return isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
}

/**
 * Mendapatkan profil lengkap pengguna yang saat ini sedang login.
 * @return array|null Data profil pengguna atau null jika belum login.
 */
function getCurrentUser(): ?array
{
    $userId = getCurrentUserId();
    if (!$userId) return null;

    try {
        $pdo = getDbConnection();
        $stmt = $pdo->prepare('SELECT id_pengguna, no_telepon, nama_profil, foto_profil, about, last_seen FROM tbl_pengguna WHERE id_pengguna = :id LIMIT 1');
        $stmt->execute([':id' => $userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        return $user ?: null;
    } catch (Exception $e) {
        error_log('[Auth Error] Gagal mengambil profil user aktif: ' . $e->getMessage());
        return null;
    }
}

/**
 * Memastikan request terautentikasi. Jika belum login, kirim respons HTTP 401 dan hentikan script.
 * @return int ID pengguna yang login
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
        ]);
        exit;
    }
    return $userId;
}

/**
 * Normalisasi format nomor telepon (menghilangkan spasi, tanda hubung, dan menyeragamkan prefiks)
 * @param string $phone
 * @return string
 */
function normalizePhoneNumber(string $phone): string
{
    // Hapus karakter non-digit selain tanda plus di awal
    $clean = preg_replace('/[^\d+]/', '', trim($phone));
    
    // Ubah format lokal 08xx menjadi standar 628xx atau tetap 08xx sesuai database
    if (str_starts_with($clean, '+62')) {
        $clean = '0' . substr($clean, 3);
    } elseif (str_starts_with($clean, '62') && strlen($clean) > 10) {
        $clean = '0' . substr($clean, 2);
    }
    
    return $clean;
}

// ------------------------------------------------------------------------------
// PENANGANAN PERMINTAAN ENDPOINT (Jika dipanggil langsung via HTTP)
// ------------------------------------------------------------------------------
if (basename($_SERVER['PHP_SELF']) === 'auth.php') {
    header('Content-Type: application/json; charset=utf-8');

    // Baca input baik dari $_GET, $_POST (x-www-form-urlencoded), maupun php://input (JSON)
    $rawInput = file_get_contents('php://input');
    $jsonInput = json_decode($rawInput, true) ?? [];
    $input = array_merge($_GET, $_POST, $jsonInput);

    $action = $input['action'] ?? 'me';

    try {
        $pdo = getDbConnection();

        switch ($action) {
            /**
             * ------------------------------------------------------------------
             * ACTION: send_otp (SKPL-F-001 / UI-001)
             * Menerima nomor telepon, membangkitkan 6 digit OTP acak, dan menyimpannya di session.
             * ------------------------------------------------------------------
             */
            case 'send_otp':
                $rawPhone = $input['phone'] ?? $input['phone_number'] ?? $input['no_telepon'] ?? '';
                $phone = normalizePhoneNumber($rawPhone);

                if (empty($phone) || strlen($phone) < 8) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Nomor telepon tidak valid. Masukkan nomor telepon dengan benar.'
                    ]);
                    exit;
                }

                // Bangkitkan 6-digit kode OTP acak
                $otpCode = strval(random_int(100000, 999999));

                // Simpan data OTP di session (masa berlaku 5 menit)
                $_SESSION['pending_otp'] = [
                    'phone'      => $phone,
                    'otp'        => $otpCode,
                    'created_at' => time(),
                    'expires_at' => time() + 300 // 5 menit
                ];

                // Cek apakah nomor telepon sudah terdaftar di database
                $stmt = $pdo->prepare('SELECT id_pengguna, nama_profil, foto_profil FROM tbl_pengguna WHERE no_telepon = :phone LIMIT 1');
                $stmt->execute([':phone' => $phone]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                echo json_encode([
                    'success' => true,
                    'message' => 'Kode verifikasi 6 digit telah dikirimkan ke nomor ' . htmlspecialchars($phone),
                    'data' => [
                        'phone'          => $phone,
                        'is_registered'  => (bool)$user,
                        'nama_profil'    => $user['nama_profil'] ?? null,
                        // otp_debug disertakan untuk keperluan testing praktikum di localhost tanpa modem SMS
                        'otp_debug'      => $otpCode
                    ]
                ]);
                break;

            /**
             * ------------------------------------------------------------------
             * ACTION: verify_otp (SKPL-F-001 / UI-002 & UI-008)
             * Memverifikasi kode OTP 6 digit dan mengaktifkan sesi login pengguna.
             * ------------------------------------------------------------------
             */
            case 'verify_otp':
                $rawPhone = $input['phone'] ?? $input['phone_number'] ?? $input['no_telepon'] ?? '';
                $phone = normalizePhoneNumber($rawPhone);
                $otpInput = trim($input['otp'] ?? $input['otp_code'] ?? '');
                $namaProfil = trim($input['nama_profil'] ?? '');

                if (empty($otpInput)) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Kode OTP 6 digit wajib diisi.'
                    ]);
                    exit;
                }

                // Ambil data OTP yang tersimpan di sesi
                $pending = $_SESSION['pending_otp'] ?? null;
                $isValidOtp = false;

                // Verifikasi terhadap kode OTP di sesi ATAU kode pengujian standar (123456 / 481920)
                if ($pending && $pending['phone'] === $phone && time() <= $pending['expires_at']) {
                    if ($pending['otp'] === $otpInput) {
                        $isValidOtp = true;
                    }
                }
                
                // Fallback kemudahan testing praktikum (master test code)
                if ($otpInput === '123456' || $otpInput === '481920') {
                    $isValidOtp = true;
                }

                if (!$isValidOtp) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Kode OTP yang Anda masukkan salah atau sudah kedaluwarsa.'
                    ]);
                    exit;
                }

                // Cari apakah pengguna sudah ada di database
                $stmt = $pdo->prepare('SELECT * FROM tbl_pengguna WHERE no_telepon = :phone LIMIT 1');
                $stmt->execute([':phone' => $phone]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$user) {
                    // Pengguna Baru (UI-008): Daftarkan ke database
                    $namaBaru = !empty($namaProfil) ? $namaProfil : 'Pengguna Baru (' . substr($phone, -4) . ')';
                    $insertStmt = $pdo->prepare('
                        INSERT INTO tbl_pengguna (no_telepon, nama_profil, foto_profil, about, last_seen, created_at)
                        VALUES (:phone, :nama, NULL, :about, NOW(), NOW())
                    ');
                    $insertStmt->execute([
                        ':phone' => $phone,
                        ':nama'  => $namaBaru,
                        ':about' => 'Ada untuk berkolaborasi dan belajar.'
                    ]);

                    $newId = (int)$pdo->lastInsertId();
                    $stmt = $pdo->prepare('SELECT * FROM tbl_pengguna WHERE id_pengguna = :id LIMIT 1');
                    $stmt->execute([':id' => $newId]);
                    $user = $stmt->fetch(PDO::FETCH_ASSOC);
                } else {
                    // Pengguna Lama: Perbarui waktu terakhir aktif (last_seen)
                    $updateStmt = $pdo->prepare('UPDATE tbl_pengguna SET last_seen = NOW() WHERE id_pengguna = :id');
                    $updateStmt->execute([':id' => $user['id_pengguna']]);
                }

                // Aktifkan sesi login pengguna
                $_SESSION['user_id']     = (int)$user['id_pengguna'];
                $_SESSION['user_phone']  = $user['no_telepon'];
                $_SESSION['user_name']   = $user['nama_profil'];
                $_SESSION['user_avatar'] = $user['foto_profil'];

                // Hapus data pending OTP setelah berhasil diverifikasi
                unset($_SESSION['pending_otp']);

                echo json_encode([
                    'success' => true,
                    'message' => 'Verifikasi nomor telepon berhasil. Sesi masuk telah aktif.',
                    'data' => [
                        'id_pengguna' => (int)$user['id_pengguna'],
                        'no_telepon'  => $user['no_telepon'],
                        'nama_profil' => $user['nama_profil'],
                        'foto_profil' => $user['foto_profil'],
                        'about'       => $user['about']
                    ]
                ]);
                break;

            /**
             * ------------------------------------------------------------------
             * ACTION: me / check_session
             * Memeriksa status sesi login dan mengambil data pengguna aktif.
             * ------------------------------------------------------------------
             */
            case 'me':
            case 'check_session':
                $userId = getCurrentUserId();
                if (!$userId) {
                    echo json_encode([
                        'success'       => true,
                        'authenticated' => false,
                        'message'       => 'Tidak ada sesi aktif. Pengguna berada dalam mode simulasi.'
                    ]);
                    exit;
                }

                $user = getCurrentUser();
                echo json_encode([
                    'success'       => true,
                    'authenticated' => true,
                    'data'          => $user
                ]);
                break;

            /**
             * ------------------------------------------------------------------
             * ACTION: logout
             * Mengakhiri sesi login pengguna.
             * ------------------------------------------------------------------
             */
            case 'logout':
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
                session_destroy();

                echo json_encode([
                    'success' => true,
                    'message' => 'Anda telah berhasil keluar (logout).'
                ]);
                break;

            /**
             * ------------------------------------------------------------------
             * ACTION: switch_user (Khusus Keperluan Praktikum / Testing)
             * Memungkinkan berpindah akun user dummy (1 s.d. 6) dengan cepat
             * ------------------------------------------------------------------
             */
            case 'switch_user':
                $targetId = isset($input['user_id']) ? (int)$input['user_id'] : 1;
                $stmt = $pdo->prepare('SELECT * FROM tbl_pengguna WHERE id_pengguna = :id LIMIT 1');
                $stmt->execute([':id' => $targetId]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$user) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'User ID target tidak ditemukan.']);
                    exit;
                }

                $_SESSION['user_id']     = (int)$user['id_pengguna'];
                $_SESSION['user_phone']  = $user['no_telepon'];
                $_SESSION['user_name']   = $user['nama_profil'];
                $_SESSION['user_avatar'] = $user['foto_profil'];

                echo json_encode([
                    'success' => true,
                    'message' => 'Berhasil beralih ke akun: ' . htmlspecialchars($user['nama_profil']),
                    'data'    => $user
                ]);
                break;

            default:
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Aksi autentikasi tidak dikenali: ' . htmlspecialchars($action)
                ]);
                break;
        }

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Terjadi kendala pada koneksi database: ' . $e->getMessage()
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Terjadi kesalahan server: ' . $e->getMessage()
        ]);
    }
    exit;
}
