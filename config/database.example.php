<?php
/**
 * WhatsNew (PPPL) - Template Konfigurasi Database (PDO)
 *
 * Modul 2: Backend - Konfigurasi & Sample Data
 * Penulis: Raihandy Wijaya (NIM: 10241064)
 *
 * PETUNJUK PENGGUNAAN:
 * 1. File ini adalah berkas contoh (template) dan aman di-commit ke Git.
 * 2. Salin menjadi `config/database.local.php`:
 *      cp config/database.example.php config/database.local.php
 * 3. Sesuaikan DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS, APP_TIMEZONE,
 *    dan APP_DEMO_MODE pada `config/database.local.php`.
 */

// Konfigurasi Parameter Database (Default selaras dengan database/schema.sql)
if (!defined('DB_HOST')) define('DB_HOST', 'localhost');
if (!defined('DB_PORT')) define('DB_PORT', '3306');
if (!defined('DB_NAME')) define('DB_NAME', 'whatsapp_pppl');
if (!defined('DB_USER')) define('DB_USER', 'root');
if (!defined('DB_PASS')) define('DB_PASS', '');
if (!defined('DB_CHARSET')) define('DB_CHARSET', 'utf8mb4');

// Zona waktu aplikasi (disinkronkan ke PHP & koneksi MySQL)
if (!defined('APP_TIMEZONE')) define('APP_TIMEZONE', 'Asia/Makassar');

// Mode demo praktikum: mengaktifkan otp_debug, master OTP demo, dan switch_user.
// Ubah menjadi false untuk lingkungan produksi.
if (!defined('APP_DEMO_MODE')) define('APP_DEMO_MODE', true);

date_default_timezone_set(APP_TIMEZONE);

/**
 * Mendapatkan koneksi aktif ke database MySQL menggunakan PDO (singleton lazy).
 *
 * @return PDO
 * @throws PDOException
 */
function getDbConnection(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            DB_HOST,
            DB_PORT,
            DB_NAME,
            DB_CHARSET
        );

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
            // Sinkronkan offset timezone sesi MySQL dengan timezone PHP
            $offset = (new DateTimeImmutable('now', new DateTimeZone(APP_TIMEZONE)))->format('P');
            $pdo->exec("SET time_zone = " . $pdo->quote($offset));
        } catch (PDOException $e) {
            error_log('[Database Error] Gagal terhubung ke database: ' . $e->getMessage());
            throw new PDOException('Koneksi ke database gagal.', (int)$e->getCode(), $e);
        }
    }

    return $pdo;
}
