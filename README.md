# WhatsApp (PPPL)

## Deskripsi
Aplikasi web komunikasi real-time berbasis arsitektur client-server yang dirancang untuk mendukung tiga fungsionalitas utama: autentikasi pengguna dengan nomor telepon dan kode OTP, pengiriman pesan teks real-time dengan enkripsi end-to-end (E2EE), serta fitur berbagi status yang bertahan selama 24 jam.

## Anggota Tim
- 10241070 - Tika Mila Wahyuni — Backend (Ketua Tim)
- 10241050 - Muhammad Rifa Al Rizqul Aulia — Frontend
- 10241018 - Clara Uenike Meylan Langi — Frontend
- 10241064 - Raihandy Wijaya — Backend
- 10241054 - Muhammad Zaldy Syah Firaz — Backend

## Teknologi
- PHP
- MySQL / MariaDB
- HTML, CSS, dan Bootstrap

## Struktur Dokumentasi
- docs/SDD: dokumen desain perangkat lunak (Software Design Description)
- docs/STD: dokumen pengujian perangkat lunak (Software Test Description - menyusul)

## Persiapan
1. Clone repository:
   git clone https://github.com/tikaacode/whatsapp-pppl.git
2. Siapkan web server lokal (seperti Apache/XAMPP) dan database MySQL.
3. Buat database baru, lalu import skema database dari database/schema.sql dan data awal dari database/sample_data.sql.
4. Salin file konfigurasi database:
   cp config/database.example.php config/database.local.php
5. Sesuaikan konfigurasi username, password, dan nama database pada config/database.local.php.
6. Akses aplikasi melalui browser pada http://localhost/whatsapp-pppl.

## Catatan
Petunjuk instalasi dan penggunaan akan diperbarui sesuai perkembangan proyek.
