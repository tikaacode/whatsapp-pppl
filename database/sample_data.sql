-- ============================================================================
-- WhatsApp PPPL - Sample Seed Data
-- 
-- Modul 2: Backend - Konfigurasi & Sample Data
-- Penulis: Raihandy Wijaya (NIM: 10241064)
-- Peran  : Backend (Database & Server Configuration)
-- Deskripsi: Kumpulan data awal (DML) untuk keperluan pengujian fungsionalitas
--            aplikasi WhatsApp: autentikasi, chat real-time, dan status 24 jam.
-- ============================================================================

-- Pastikan menggunakan database yang aktif (sesuaikan bila menggunakan whatsapp_db)
CREATE DATABASE IF NOT EXISTS whatsapp_pppl
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE whatsapp_pppl;

-- Nonaktifkan pengecekan foreign key sementara agar proses truncate & seed lancar
SET FOREIGN_KEY_CHECKS = 0;

-- Bersihkan data lama agar id auto-increment konsisten saat di-seed ulang
TRUNCATE TABLE tbl_kunci_publik;
TRUNCATE TABLE tbl_status_audiens;
TRUNCATE TABLE tbl_status_dilihat;
TRUNCATE TABLE tbl_status;
TRUNCATE TABLE tbl_pesan;
TRUNCATE TABLE tbl_percakapan;
TRUNCATE TABLE tbl_kontak;
TRUNCATE TABLE tbl_pengguna;

-- Aktifkan kembali pengecekan foreign key
SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================================
-- 1. SEED DATA PENGGUNA (tbl_pengguna)
-- Tokoh wireframe SDD dan anggota tim pengembang proyek PPPL
-- ============================================================================
INSERT INTO tbl_pengguna (id_pengguna, no_telepon, nama_profil, foto_profil, about, last_seen, created_at) VALUES
(1, '081234567801', 'Budi Santoso', 'assets/img/avatars/budi.png', 'Ada untuk berkolaborasi dan belajar.', NOW(), NOW() - INTERVAL 7 DAY),
(2, '081234567802', 'Clara Meylan', 'assets/img/avatars/clara.png', 'Frontend Developer | UI/UX enthusiast ✨', NOW(), NOW() - INTERVAL 7 DAY),
(3, '081234567803', 'Zaldy Firaz', 'assets/img/avatars/zaldy.png', 'Backend Engineer | Database Architect 🛠️', NOW(), NOW() - INTERVAL 7 DAY),
(4, '081234567804', 'Tika Wahyuni', 'assets/img/avatars/tika.png', 'Project Manager | Lead Developer 🚀', NOW(), NOW() - INTERVAL 7 DAY),
(5, '081234567805', 'Raihandy Wijaya', 'assets/img/avatars/raihandy.png', 'Backend Developer | Keep calm and code on ☕', NOW(), NOW() - INTERVAL 7 DAY),
(6, '081234567806', 'Muhammad Rifa', 'assets/img/avatars/rifa.png', 'Frontend Developer | Slicing with precision 🎨', NOW(), NOW() - INTERVAL 7 DAY);


-- ============================================================================
-- 2. SEED DATA BUKU KONTAK (tbl_kontak)
-- Menghubungkan kontak antar-pengguna untuk keperluan pertemanan & privasi status
-- ============================================================================
INSERT INTO tbl_kontak (id_kontak, id_pemilik, id_pengguna_kontak, nama_kontak, created_at) VALUES
-- Kontak milik Budi Santoso (id: 1)
(1,  1, 4, 'Tika Wahyuni (Ketua Tim)', NOW() - INTERVAL 5 DAY),
(2,  1, 2, 'Clara Meylan',             NOW() - INTERVAL 5 DAY),
(3,  1, 3, 'Zaldy Firaz',              NOW() - INTERVAL 5 DAY),
(4,  1, 5, 'Raihandy Wijaya',          NOW() - INTERVAL 5 DAY),
(5,  1, 6, 'Muhammad Rifa',            NOW() - INTERVAL 5 DAY),

-- Kontak milik Tika Wahyuni (id: 4)
(6,  4, 1, 'Budi Santoso',             NOW() - INTERVAL 5 DAY),
(7,  4, 2, 'Clara Meylan (Frontend)',  NOW() - INTERVAL 5 DAY),
(8,  4, 3, 'Zaldy Firaz (Backend)',    NOW() - INTERVAL 5 DAY),
(9,  4, 5, 'Raihandy Wijaya (Backend)',NOW() - INTERVAL 5 DAY),
(10, 4, 6, 'Muhammad Rifa (Frontend)',NOW() - INTERVAL 5 DAY),

-- Kontak milik Raihandy Wijaya (id: 5)
(11, 5, 1, 'Budi Santoso',             NOW() - INTERVAL 5 DAY),
(12, 5, 4, 'Tika Wahyuni (Ketua Tim)', NOW() - INTERVAL 5 DAY),
(13, 5, 3, 'Zaldy Firaz (Backend)',    NOW() - INTERVAL 5 DAY),
(14, 5, 2, 'Clara Meylan (Frontend)',  NOW() - INTERVAL 5 DAY),
(15, 5, 6, 'Muhammad Rifa (Frontend)',NOW() - INTERVAL 5 DAY),

-- Kontak milik Clara Meylan (id: 2)
(16, 2, 1, 'Budi Santoso',             NOW() - INTERVAL 5 DAY),
(17, 2, 4, 'Tika Wahyuni',             NOW() - INTERVAL 5 DAY),
(18, 2, 6, 'Muhammad Rifa (Frontend)',NOW() - INTERVAL 5 DAY),

-- Kontak milik Zaldy Firaz (id: 3)
(19, 3, 1, 'Budi Santoso',             NOW() - INTERVAL 5 DAY),
(20, 3, 4, 'Tika Wahyuni',             NOW() - INTERVAL 5 DAY),
(21, 3, 5, 'Raihandy Wijaya',          NOW() - INTERVAL 5 DAY),

-- Kontak milik Muhammad Rifa (id: 6)
(22, 6, 2, 'Clara Meylan',             NOW() - INTERVAL 5 DAY),
(23, 6, 4, 'Tika Wahyuni',             NOW() - INTERVAL 5 DAY),
(24, 6, 5, 'Raihandy Wijaya',          NOW() - INTERVAL 5 DAY);


-- ============================================================================
-- 3. SEED DATA RUANG OBROLAN (tbl_percakapan)
-- Ruang obrolan one-to-one (1-on-1 chat)
-- ============================================================================
INSERT INTO tbl_percakapan (id_percakapan, id_pengguna_1, id_pengguna_2) VALUES
-- Percakapan 1: Budi Santoso (1) dan Tika Wahyuni (4)
(1, 1, 4),
-- Percakapan 2: Raihandy Wijaya (5) dan Zaldy Firaz (3)
(2, 3, 5),
-- Percakapan 3: Clara Meylan (2) dan Muhammad Rifa (6)
(3, 2, 6);


-- ============================================================================
-- 4. SEED DATA PESAN (tbl_pesan)
-- Pesan obrolan dengan status 'terkirim', 'diterima', dan 'dibaca'
-- Kolom isi_terenkripsi bertipe BLOB (mensimulasikan enkripsi end-to-end)
-- ============================================================================
INSERT INTO tbl_pesan (id_pesan, id_pengirim, id_percakapan, isi_terenkripsi, status_pesan, created_at, diterima_at, dibaca_at) VALUES
-- Percakapan 1 (Budi Santoso <-> Tika Wahyuni)
(1, 1, 1, 'Halo, jadi rapat hari ini?', 'dibaca', NOW() - INTERVAL 30 MINUTE, NOW() - INTERVAL 29 MINUTE, NOW() - INTERVAL 28 MINUTE),
(2, 4, 1, 'Jadi, pukul 13.00 di Lab RPL ya', 'dibaca', NOW() - INTERVAL 25 MINUTE, NOW() - INTERVAL 24 MINUTE, NOW() - INTERVAL 23 MINUTE),
(3, 1, 1, 'Baik, materi presentasi sudah siap dibawa.', 'dibaca', NOW() - INTERVAL 20 MINUTE, NOW() - INTERVAL 19 MINUTE, NOW() - INTERVAL 18 MINUTE),
(4, 4, 1, 'Siap, jangan lupa bawa dokumen SDD juga ya!', 'diterima', NOW() - INTERVAL 10 MINUTE, NOW() - INTERVAL 9 MINUTE, NULL),
(5, 1, 1, 'Sudah siap semua di laptop, sampai ketemu di Lab!', 'terkirim', NOW() - INTERVAL 2 MINUTE, NULL, NULL),

-- Percakapan 2 (Zaldy Firaz <-> Raihandy Wijaya)
(6, 5, 2, 'Bro Zaldy, skema DDL di database/schema.sql sudah aman ya?', 'dibaca', NOW() - INTERVAL 60 MINUTE, NOW() - INTERVAL 59 MINUTE, NOW() - INTERVAL 58 MINUTE),
(7, 3, 2, 'Aman Handy! Sudah rapi dan sesuai SDD. Silakan lanjut bikin konfigurasi PDO & sample data ya.', 'dibaca', NOW() - INTERVAL 55 MINUTE, NOW() - INTERVAL 54 MINUTE, NOW() - INTERVAL 53 MINUTE),
(8, 5, 2, 'Siap, template config/database.example.php dan sample_data.sql sedang disiapkan!', 'diterima', NOW() - INTERVAL 40 MINUTE, NOW() - INTERVAL 39 MINUTE, NULL),

-- Percakapan 3 (Clara Meylan <-> Muhammad Rifa)
(9, 2, 3, 'Hai Rifa, wireframe untuk halaman chat sudah selesai direview?', 'dibaca', NOW() - INTERVAL 45 MINUTE, NOW() - INTERVAL 44 MINUTE, NOW() - INTERVAL 42 MINUTE),
(10, 6, 3, 'Hai Clara! Sudah, tampilannya clean dan konsisten dengan WhatsApp Web.', 'dibaca', NOW() - INTERVAL 35 MINUTE, NOW() - INTERVAL 34 MINUTE, NOW() - INTERVAL 33 MINUTE);


-- ============================================================================
-- 5. SEED DATA STATUS 24 JAM (tbl_status)
-- Status teks dan media dengan masa aktif 24 jam
-- ============================================================================
INSERT INTO tbl_status (id_status, id_pengguna, jenis_status, isi_terenkripsi, path_media, created_at, expired_at, privasi, warna_latar) VALUES
-- Status 1: Tika Wahyuni (teks)
(1, 4, 'teks', 'Semangat teman-teman sprint Modul 2 WhatsApp PPPL! Target selesai tepat waktu 🚀', NULL, NOW() - INTERVAL 2 HOUR, NOW() + INTERVAL 22 HOUR, 'semua_kontak', '#075E54'),

-- Status 2: Raihandy Wijaya (teks)
(2, 5, 'teks', 'Konfigurasi database PDO & sample seed data selesai dikerjakan 💻☕', NULL, NOW() - INTERVAL 1 HOUR, NOW() + INTERVAL 23 HOUR, 'semua_kontak', '#128C7E'),

-- Status 3: Clara Meylan (media gambar)
(3, 2, 'media', 'Desain mockup UI WhatsApp Web siap diimplementasikan ✨', 'uploads/status/mockup_preview.png', NOW() - INTERVAL 3 HOUR, NOW() + INTERVAL 21 HOUR, 'semua_kontak', NULL),

-- Status 4: Budi Santoso (teks)
(4, 1, 'teks', 'Hari yang produktif di Lab RPL kampus! 👨‍💻', NULL, NOW() - INTERVAL 4 HOUR, NOW() + INTERVAL 20 HOUR, 'semua_kontak', '#34B7F1');


-- ============================================================================
-- 6. SEED DATA RIWAYAT STATUS DILIHAT (tbl_status_dilihat)
-- Menandai pengguna yang telah melihat status tertentu
-- ============================================================================
INSERT INTO tbl_status_dilihat (id_status_dilihat, id_status, id_penonton, dilihat_at) VALUES
-- Status Tika (id: 1) dilihat oleh Budi (1) dan Raihandy (5)
(1, 1, 1, NOW() - INTERVAL 1 HOUR),
(2, 1, 5, NOW() - INTERVAL 50 MINUTE),

-- Status Raihandy (id: 2) dilihat oleh Zaldy (3) dan Tika (4)
(3, 2, 3, NOW() - INTERVAL 30 MINUTE),
(4, 2, 4, NOW() - INTERVAL 20 MINUTE),

-- Status Clara (id: 3) dilihat oleh Muhammad Rifa (6)
(5, 3, 6, NOW() - INTERVAL 2 HOUR);


-- ============================================================================
-- 7. SEED DATA KUNCI PUBLIK (tbl_kunci_publik)
-- Kunci publik (Identity Key, Signed Prekey, One-Time Prekey) untuk simulasi E2EE
-- ============================================================================
INSERT INTO tbl_kunci_publik (id_kunci, id_pengguna, jenis_kunci, kunci_publik, created_at) VALUES
-- Kunci untuk Budi Santoso (id: 1)
(1, 1, 'identity_key',    'budi_ik_65f7c3b4e18d9a207f2e1a4c9b3d8e5f0123456789abcdef0123456789abcdef', NOW() - INTERVAL 7 DAY),
(2, 1, 'signed_prekey',   'budi_spk_a9b8c7d6e5f403123456789abcdef0123456789abcdef0123456789abcdef01', NOW() - INTERVAL 7 DAY),
(3, 1, 'one_time_prekey', 'budi_otk_11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff', NOW() - INTERVAL 7 DAY),

-- Kunci untuk Tika Wahyuni (id: 4)
(4, 4, 'identity_key',    'tika_ik_77f8c9b0e28d1a308f3e2a5c0b4d9e6f1234567890abcdef1234567890abcdef', NOW() - INTERVAL 7 DAY),
(5, 4, 'signed_prekey',   'tika_spk_b0c9d8e7f605234567890abcdef1234567890abcdef1234567890abcdef12', NOW() - INTERVAL 7 DAY),

-- Kunci untuk Raihandy Wijaya (id: 5)
(6, 5, 'identity_key',    'handy_ik_88f9c0b1e38d2a409f4e3a6c1b5d0e7f2345678901abcdef2345678901abcdef', NOW() - INTERVAL 7 DAY),
(7, 5, 'signed_prekey',   'handy_spk_c1d0e9f80716345678901abcdef2345678901abcdef2345678901abcdef23', NOW() - INTERVAL 7 DAY);
