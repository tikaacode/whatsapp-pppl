# WhatsApp (PPPL)

## Deskripsi
Aplikasi web komunikasi real-time berbasis arsitektur client-server yang dirancang untuk mendukung tiga fungsionalitas utama: autentikasi pengguna dengan nomor telepon dan kode OTP, pengiriman pesan teks real-time dengan enkripsi end-to-end (E2EE), serta fitur berbagi status yang bertahan selama 24 jam.

Antarmuka (frontend) menggunakan **React + Tailwind CSS v4 + `@samasante/liquid-glass`** (efek refraksi Liquid Glass) yang sudah dikompilasi ke `assets/app/`, sehingga dapat langsung dijalankan melalui Apache/XAMPP/Laragon tanpa perlu instalasi Node.js di mesin pengguna.

## Anggota Tim
- 10241070 - Tika Mila Wahyuni — Backend (Ketua Tim)
- 10241050 - Muhammad Rifa Al Rizqul Aulia — Frontend
- 10241018 - Clara Uenike Meylan Langi — Frontend
- 10241064 - Raihandy Wijaya — Backend
- 10241054 - Muhammad Zaldy Syah Firaz — Backend

## Teknologi
- **Backend:** PHP 8+, MySQL / MariaDB (PDO)
- **Frontend:** React 19, Vite, Tailwind CSS v4, `@samasante/liquid-glass`, Lucide React
- **Build Output:** Pre-compiled di `assets/app/app.js` dan `assets/app/app.css`

## Struktur Dokumentasi
- `docs/SDD`: dokumen desain perangkat lunak (Software Design Description)
- `docs/STD`: dokumen pengujian perangkat lunak (Software Test Description)

## Persiapan (Menjalankan Aplikasi PHP + MySQL)
1. Clone repository:
   ```bash
   git clone https://github.com/tikaacode/whatsapp-pppl.git
   ```
2. Siapkan web server lokal (seperti Apache/XAMPP/Laragon) dan database MySQL.
3. Buat database baru, lalu import skema database dari `database/schema.sql` dan data awal dari `database/sample_data.sql`.
4. Salin file konfigurasi database:
   ```bash
   cp config/database.example.php config/database.local.php
   ```
5. Sesuaikan konfigurasi username, password, dan nama database pada `config/database.local.php`.
6. Akses aplikasi melalui browser pada `http://localhost/whatsapp-pppl` (atau via `php -S localhost:8088`).

## Pengembangan Frontend (Opsional)
Source React berada di folder `frontend/`. Jika Anda melakukan perubahan UI pada `frontend/src/`:
```bash
cd frontend
npm install
npm run build
```
Perintah `npm run build` otomatis mengompilasi ulang bundle produksi ke `assets/app/app.js` dan `assets/app/app.css`.
