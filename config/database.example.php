<?php
/**
 * WhatsApp PPPL - Template Konfigurasi Database (PDO)
 * 
 * Modul 2: Backend - Konfigurasi & Sample Data
 * Penulis: Raihandy Wijaya (NIM: 10241064)
 * Peran  : Backend (Database & Server Configuration)
 * 
 * ============================================================================
 * PETUNJUK PENGGUNAAN:
 * 1. File ini adalah berkas contoh (template) dan aman di-commit ke Git.
 *    JANGAN menuliskan password atau kredensial produksi asli pada file ini.
 * 2. Salin (copy) file ini menjadi `database.local.php` pada folder `config/`:
 *    - Linux / macOS : cp config/database.example.php config/database.local.php
 *    - Windows (CMD) : copy config\database.example.php config\database.local.php
 *    - PowerShell    : Copy-Item config/database.example.php config/database.local.php
 * 3. Buka file `config/database.local.php` lalu sesuaikan DB_HOST, DB_PORT,
 *    DB_NAME, DB_USER, dan DB_PASS dengan konfigurasi server lokal Anda (Laragon/XAMPP).
 * 4. File `config/database.local.php` sudah terdaftar pada `.gitignore`, sehingga
 *    kredensial lokal Anda tidak akan terunggah ke repositori GitHub.
 * ============================================================================
 */

// Konfigurasi Parameter Database (Default)
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'whatsapp_db'); // Atau 'whatsapp_pppl' sesuai nama database lokal Anda
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

/**
 * Mendapatkan koneksi aktif ke database MySQL menggunakan PDO.
 * 
 * Menggunakan static instance (pola singleton sederhana) untuk menghindari
 * overhead pembuatan koneksi baru berulang kali dalam satu siklus request.
 * 
 * @return PDO Objek koneksi PDO
 * @throws PDOException Jika koneksi gagal dibuat
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
        } catch (PDOException $e) {
            // Catat galat ke log server untuk keperluan debugging lokal
            error_log('[Database Error] Gagal terhubung ke database: ' . $e->getMessage());

            // Lontarkan exception agar dapat ditangani oleh pengendali aplikasi
            throw new PDOException('Koneksi ke database gagal: ' . $e->getMessage(), (int)$e->getCode());
        }
    }

    return $pdo;
}

// Inisialisasi variabel koneksi global untuk kemudahan pemanggilan langsung
try {
    $pdo = getDbConnection();
} catch (PDOException $e) {
    // Pada file template contoh, $pdo diatur null jika koneksi belum dikonfigurasi
    $pdo = null;
}

