<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Web - PPPL</title>
    <!-- Bootstrap 5 CSS CDN -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap Icons CDN -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    <!-- Custom Stylesheet WhatsApp Web -->
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

<div class="container-fluid h-100 p-0">
    <div class="container-xxl wa-app-container p-0">
        <div class="row g-0 h-100">

            <!-- ============================================== -->
            <!-- SIDEBAR KIRI: PROFIL, TAB CHAT & STATUS (UI-003 / UI-005) -->
            <!-- ============================================== -->
            <div class="col-12 col-md-4 col-xl-3 wa-sidebar">

                <!-- Header Profil Pengguna Aktif -->
                <div class="wa-header wa-sidebar-header">
                    <div class="d-flex align-items-center gap-2 min-width-0">
                        <div class="wa-avatar bg-success text-white border border-white border-opacity-50">MR</div>
                        <div class="min-width-0">
                            <div class="fw-bold lh-sm" style="font-size: 0.98rem;">WhatsApp</div>
                            <div class="text-white-50 text-truncate" style="font-size: 0.72rem; max-width: 120px;">Muhammad Rifa</div>
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-3 flex-shrink-0">
                        <!-- Tombol Simulasi Login/OTP (UI-001, UI-002, UI-008) -->
                        <button class="btn btn-sm wa-btn-login py-0 px-2" data-bs-toggle="modal" data-bs-target="#loginModal" title="Simulasi Login / OTP">
                            <i class="bi bi-box-arrow-in-right me-1"></i>Login
                        </button>
                        <i class="bi bi-chat-left-text-fill fs-5 wa-header-action" role="button" title="Chat Baru"></i>
                        <i class="bi bi-three-dots-vertical fs-5 wa-header-action" role="button" title="Menu"></i>
                    </div>
                </div>

                <!-- Navigasi Tab (Chat / Status) sesuai Bab 5.1 SDD -->
                <ul class="nav nav-tabs wa-nav-tabs nav-fill px-2 pt-1" id="waTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active w-100" id="chats-tab" data-bs-toggle="tab" data-bs-target="#chats-pane" type="button" role="tab" aria-controls="chats-pane" aria-selected="true">
                            <i class="bi bi-chat-dots-fill me-1"></i> CHAT <span class="badge bg-success rounded-pill ms-1">1</span>
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link w-100" id="status-tab" data-bs-toggle="tab" data-bs-target="#status-pane" type="button" role="tab" aria-controls="status-pane" aria-selected="false">
                            <i class="bi bi-circle-half me-1"></i> STATUS
                        </button>
                    </li>
                </ul>

                <!-- Kotak Pencarian Kontak/Chat -->
                <div class="p-2 wa-search-bar">
                    <div class="input-group input-group-sm rounded-3 overflow-hidden">
                        <span class="input-group-text text-secondary"><i class="bi bi-search"></i></span>
                        <input type="text" class="form-control" placeholder="Cari atau mulai chat baru" id="chatSearchInput">
                    </div>
                </div>

                <!-- Tab Content: List Chat atau List Status -->
                <div class="tab-content flex-grow-1 overflow-hidden d-flex flex-column" id="waTabsContent">

                    <!-- TAB 1: DAFTAR CHAT (UI-003) -->
                    <div class="tab-pane fade show active wa-chat-list" id="chats-pane" role="tabpanel" aria-labelledby="chats-tab">
                        <!-- Chat Item 1: Budi Santoso (Aktif - sesuai Wireframe SDD Halaman 26) -->
                        <div class="wa-chat-item active d-flex align-items-center gap-3" data-contact="Budi Santoso" data-phone="+62 812-3456-7890">
                            <div class="wa-avatar bg-primary text-white">BS</div>
                            <div class="flex-grow-1 overflow-hidden">
                                <div class="d-flex justify-content-between align-items-baseline">
                                    <span class="fw-semibold text-truncate">Budi Santoso</span>
                                    <span class="wa-msg-meta text-success fw-semibold">10:15</span>
                                </div>
                                <div class="d-flex justify-content-between align-items-center">
                                    <small class="text-secondary text-truncate">Jadi, pukul 13.00 di Lab RPL ya</small>
                                    <span class="badge bg-success rounded-pill">1</span>
                                </div>
                            </div>
                        </div>

                        <!-- Chat Item 2: Clara Meylan (sesuai Wireframe SDD Halaman 26) -->
                        <div class="wa-chat-item d-flex align-items-center gap-3" data-contact="Clara Meylan" data-phone="+62 812-1111-2222">
                            <div class="wa-avatar bg-warning text-dark">CM</div>
                            <div class="flex-grow-1 overflow-hidden">
                                <div class="d-flex justify-content-between align-items-baseline">
                                    <span class="fw-semibold text-truncate">Clara Meylan</span>
                                    <span class="wa-msg-meta">09:40</span>
                                </div>
                                <div class="d-flex justify-content-between align-items-center">
                                    <small class="text-secondary text-truncate"><i class="bi bi-check2-all text-primary me-1"></i>Siap, terima kasih!</small>
                                </div>
                            </div>
                        </div>

                        <!-- Chat Item 3: Zaldy Firaz (sesuai Wireframe SDD Halaman 26) -->
                        <div class="wa-chat-item d-flex align-items-center gap-3" data-contact="Zaldy Firaz" data-phone="+62 812-3333-4444">
                            <div class="wa-avatar bg-info text-dark">ZF</div>
                            <div class="flex-grow-1 overflow-hidden">
                                <div class="d-flex justify-content-between align-items-baseline">
                                    <span class="fw-semibold text-truncate">Zaldy Firaz</span>
                                    <span class="wa-msg-meta">Kemarin</span>
                                </div>
                                <div class="d-flex justify-content-between align-items-center">
                                    <small class="text-secondary text-truncate"><i class="bi bi-check2 text-secondary me-1"></i>Oke, sampai ketemu besok</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- TAB 2: DAFTAR STATUS (UI-005) -->
                    <div class="tab-pane fade wa-status-list p-2" id="status-pane" role="tabpanel" aria-labelledby="status-tab">
                        <!-- Bagian Atas: Status Saya -->
                        <div class="wa-status-item justify-content-between mb-1">
                            <div class="d-flex align-items-center gap-3 overflow-hidden flex-grow-1" role="button" data-bs-toggle="modal" data-bs-target="#createStatusModal" data-status-mode="teks">
                                <div class="position-relative flex-shrink-0">
                                    <div class="wa-avatar bg-success text-white">MR</div>
                                    <span class="position-absolute bottom-0 end-0 wa-status-add-badge" title="Tambah Status">
                                        <i class="bi bi-plus"></i>
                                    </span>
                                </div>
                                <div class="overflow-hidden">
                                    <span class="fw-semibold d-block text-truncate">Status Saya</span>
                                    <small class="text-secondary d-block text-truncate">Ketuk untuk menambahkan pembaruan status</small>
                                </div>
                            </div>
                            <div class="d-flex align-items-center gap-1 flex-shrink-0">
                                <button type="button" class="btn btn-sm btn-light rounded-circle text-secondary" data-bs-toggle="modal" data-bs-target="#createStatusModal" data-status-mode="teks" title="Buat Status Teks">
                                    <i class="bi bi-pencil-fill"></i>
                                </button>
                                <button type="button" class="btn btn-sm btn-success rounded-circle text-white" style="background-color: var(--wa-primary); border-color: var(--wa-primary);" data-bs-toggle="modal" data-bs-target="#createStatusModal" data-status-mode="media" title="Buat Status Gambar">
                                    <i class="bi bi-camera-fill"></i>
                                </button>
                            </div>
                        </div>

                        <hr class="my-2 border-light-subtle">

                        <!-- Bagian Tengah: Pembaruan Terkini (Belum Dilihat) -->
                        <div class="wa-status-section-title">Pembaruan Terkini</div>

                        <div class="wa-status-item"
                             role="button"
                             data-bs-toggle="modal"
                             data-bs-target="#viewStatusModal"
                             data-status-author="Raihandy Wijaya"
                             data-status-avatar="RW"
                             data-status-time="12 menit lalu"
                             data-status-text="Semangat ngerjain sprint backend Status 24 Jam! 🚀"
                             data-status-color="#075e54">
                            <div class="wa-status-ring-unread">
                                <div class="wa-avatar bg-success-subtle text-success">RW</div>
                            </div>
                            <div class="overflow-hidden">
                                <span class="fw-semibold d-block text-truncate">Raihandy Wijaya</span>
                                <small class="text-secondary d-block">12 menit lalu</small>
                            </div>
                        </div>

                        <div class="wa-status-item"
                             role="button"
                             data-bs-toggle="modal"
                             data-bs-target="#viewStatusModal"
                             data-status-author="Tika Wahyuni"
                             data-status-avatar="TW"
                             data-status-time="45 menit lalu"
                             data-status-text="Jangan lupa sinkronisasi repo sebelum coding ya tim 💻✨"
                             data-status-color="#3d0c5a">
                            <div class="wa-status-ring-unread">
                                <div class="wa-avatar bg-primary-subtle text-primary">TW</div>
                            </div>
                            <div class="overflow-hidden">
                                <span class="fw-semibold d-block text-truncate">Tika Wahyuni</span>
                                <small class="text-secondary d-block">45 menit lalu</small>
                            </div>
                        </div>

                        <!-- Bagian Bawah: Pembaruan yang Dilihat -->
                        <div class="wa-status-section-title">Pembaruan yang Dilihat</div>

                        <div class="wa-status-item"
                             role="button"
                             data-bs-toggle="modal"
                             data-bs-target="#viewStatusModal"
                             data-status-author="Clara Meylan"
                             data-status-avatar="CM"
                             data-status-time="Hari ini, 08:15"
                             data-status-text="Siap lanjut slicing interaktivitas chat di main.js!"
                             data-status-color="#1b3a4b">
                            <div class="wa-status-ring-read">
                                <div class="wa-avatar bg-warning-subtle text-dark">CM</div>
                            </div>
                            <div class="overflow-hidden">
                                <span class="fw-semibold d-block text-truncate">Clara Meylan</span>
                                <small class="text-secondary d-block">Hari ini, 08:15</small>
                            </div>
                        </div>

                        <div class="wa-status-item"
                             role="button"
                             data-bs-toggle="modal"
                             data-bs-target="#viewStatusModal"
                             data-status-author="Zaldy Firaz"
                             data-status-avatar="ZF"
                             data-status-time="Kemarin, 21:30"
                             data-status-text="Testing API endpoint chat dan pesan terenkripsi."
                             data-status-color="#5c1d24">
                            <div class="wa-status-ring-read">
                                <div class="wa-avatar bg-info-subtle text-dark">ZF</div>
                            </div>
                            <div class="overflow-hidden">
                                <span class="fw-semibold d-block text-truncate">Zaldy Firaz</span>
                                <small class="text-secondary d-block">Kemarin, 21:30</small>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <!-- ============================================== -->
            <!-- PANEL KANAN: RUANG CHAT / PERCAKAPAN (UI-004)   -->
            <!-- ============================================== -->
            <div class="col-12 col-md-8 col-xl-9 wa-chat-pane">

                <!-- Chat Header Aktif -->
                <div class="wa-header">
                    <div class="d-flex align-items-center gap-3 min-width-0">
                        <div class="wa-avatar bg-primary text-white" id="currentChatAvatar">BS</div>
                        <div class="min-width-0">
                            <h6 class="mb-0 fw-semibold text-truncate" id="currentChatName">Budi Santoso</h6>
                            <small class="text-muted" id="currentChatStatus">online</small>
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-3 text-secondary flex-shrink-0">
                        <i class="bi bi-telephone-fill" role="button" title="Panggilan Suara"></i>
                        <i class="bi bi-camera-video-fill" role="button" title="Panggilan Video"></i>
                        <i class="bi bi-search" role="button" title="Cari Pesan"></i>
                        <i class="bi bi-three-dots-vertical" role="button" title="Lainnya"></i>
                    </div>
                </div>

                <!-- Area Gelembung Pesan (Messages Flow) -->
                <div class="wa-messages-area" id="messagesContainer">

                    <!-- Banner Enkripsi E2EE sesuai FR4 & Wireframe SDD UI-004 -->
                    <div class="wa-e2ee-badge">
                        <i class="bi bi-lock-fill text-warning me-1"></i>
                        Pesan dan panggilan dienkripsi secara end-to-end (E2EE). Tidak seorang pun di luar chat ini, termasuk WhatsApp, yang dapat membaca atau mendengarkannya.
                    </div>

                    <!-- Pesan Masuk dari Budi Santoso -->
                    <div class="wa-message-bubble wa-bubble-received">
                        <div>Halo, jadi rapat hari ini?</div>
                        <span class="wa-msg-meta">09:45</span>
                    </div>

                    <!-- Pesan Keluar dari Pengguna Aktif (Rifa) -->
                    <div class="wa-message-bubble wa-bubble-sent">
                        <div>Jadi, pukul 13.00 di Lab RPL ya.</div>
                        <span class="wa-msg-meta">
                            10:15 <i class="bi bi-check2-all text-primary ms-1" title="Dibaca"></i>
                        </span>
                    </div>

                </div>

                <!-- Bar Input Pengiriman Pesan (ACT-002 / UI-004) -->
                <div class="wa-chat-input-bar">
                    <button type="button" class="btn btn-link text-secondary p-0 fs-5 border-0" title="Emoji"><i class="bi bi-emoji-smile"></i></button>
                    <button type="button" class="btn btn-link text-secondary p-0 fs-5 border-0" title="Lampirkan"><i class="bi bi-paperclip"></i></button>

                    <form class="flex-grow-1 d-flex gap-2" id="sendMessageForm" onsubmit="return false;">
                        <input type="text" class="form-control rounded-pill px-3" placeholder="Ketik pesan" id="messageInput" autocomplete="off">
                        <button type="submit" class="btn btn-success rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 42px; height: 42px;" id="sendBtn" title="Kirim Pesan (E2EE)">
                            <i class="bi bi-send-fill text-white"></i>
                        </button>
                    </form>
                </div>

            </div>

        </div>
    </div>
</div>

<!-- ============================================================== -->
<!-- MODAL SIMULASI LOGIN, VERIFIKASI OTP & PROFIL BARU (SKPL-F-001 / UI-001, UI-002, UI-008) -->
<!-- ============================================================== -->
<div class="modal fade" id="loginModal" tabindex="-1" aria-labelledby="loginModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
            <div class="modal-header wa-modal-header">
                <h6 class="modal-title" id="loginModalLabel"><i class="bi bi-shield-lock me-2"></i>Masuk WhatsApp (Login OTP)</h6>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Tutup"></button>
            </div>
            <div class="modal-body p-4">
                <!-- Step 1 (UI-001): Form Input Nomor Telepon -->
                <div id="loginStep1">
                    <h6 class="fw-semibold text-center mb-1" style="color: var(--wa-primary-dark);">Masukkan nomor telepon Anda</h6>
                    <p class="small text-secondary text-center mb-3">WhatsApp perlu memverifikasi nomor telepon Anda melalui SMS berisi kode 6 digit.</p>
                    <div class="mb-2">
                        <label for="loginCountrySelect" class="form-label small fw-semibold">Negara</label>
                        <select class="form-select form-select-sm" id="loginCountrySelect">
                            <option value="+62" selected>Indonesia (+62)</option>
                            <option value="+60">Malaysia (+60)</option>
                            <option value="+65">Singapura (+65)</option>
                        </select>
                    </div>
                    <div class="mb-2">
                        <label for="loginPhoneInput" class="form-label small fw-semibold">Nomor Telepon</label>
                        <div class="input-group">
                            <span class="input-group-text fw-semibold" id="loginCountryCode">+62</span>
                            <input type="tel" class="form-control" id="loginPhoneInput" placeholder="812-3456-7890" value="812-3456-7890" autocomplete="tel">
                        </div>
                    </div>
                    <p class="text-muted text-center mb-3" style="font-size: 0.72rem;">Tarif SMS operator mungkin berlaku</p>
                    <button type="button" class="btn btn-success wa-btn-primary w-100 fw-semibold" id="btnRequestOtp">Kirim Kode OTP</button>
                </div>

                <!-- Step 2 (UI-002): Form Verifikasi 6-Digit OTP -->
                <div id="loginStep2" class="d-none">
                    <h6 class="fw-semibold text-center mb-1" style="color: var(--wa-primary-dark);">Verifikasi <span id="otpTargetPhone">+62 812-3456-7890</span></h6>
                    <p class="small text-secondary text-center mb-3">
                        Masukkan kode 6 digit dari SMS yang telah dikirimkan:
                    </p>
                    <div class="wa-otp-group mb-4" id="otpInputsContainer">
                        <input type="text" inputmode="numeric" maxlength="1" class="form-control wa-otp-box" aria-label="Digit OTP 1" placeholder="•">
                        <input type="text" inputmode="numeric" maxlength="1" class="form-control wa-otp-box" aria-label="Digit OTP 2" placeholder="•">
                        <input type="text" inputmode="numeric" maxlength="1" class="form-control wa-otp-box" aria-label="Digit OTP 3" placeholder="•">
                        <input type="text" inputmode="numeric" maxlength="1" class="form-control wa-otp-box" aria-label="Digit OTP 4" placeholder="•">
                        <input type="text" inputmode="numeric" maxlength="1" class="form-control wa-otp-box" aria-label="Digit OTP 5" placeholder="•">
                        <input type="text" inputmode="numeric" maxlength="1" class="form-control wa-otp-box" aria-label="Digit OTP 6" placeholder="•">
                    </div>
                    <button type="button" class="btn btn-success wa-btn-primary w-100 fw-semibold mb-2" id="btnVerifyOtp" data-bs-dismiss="modal">Verifikasi &amp; Masuk</button>
                    <div class="text-center mb-3">
                        <a href="#" id="btnPreviewNewUserProfile" class="small text-secondary text-decoration-none">Simulasi Pengguna Baru (Isi Profil UI-008) <i class="bi bi-arrow-right"></i></a>
                    </div>
                    <div class="d-flex justify-content-between align-items-center small pt-2 border-top">
                        <a href="#" id="btnBackToPhone" class="text-secondary text-decoration-none"><i class="bi bi-arrow-left me-1"></i>Salah nomor?</a>
                        <a href="#" id="btnResendOtp" class="wa-link-primary">Kirim ulang OTP <span id="otpResendTimer" class="text-muted fw-normal">(00:45)</span></a>
                    </div>
                </div>

                <!-- Step 3 (UI-008): Isi Nama Profil Pengguna Baru -->
                <div id="loginStep3" class="d-none">
                    <h6 class="fw-semibold text-center mb-1" style="color: var(--wa-primary-dark);">Info Profil Anda</h6>
                    <p class="small text-secondary text-center mb-3">Mohon berikan nama Anda dan foto profil (opsional).</p>

                    <div class="text-center mb-3">
                        <div class="wa-profile-setup-avatar" id="profileAvatarPreview">
                            <i class="bi bi-person-fill" id="profileAvatarIcon"></i>
                            <label for="profilePhotoInput" class="wa-profile-photo-btn" title="Tambah Foto">
                                <i class="bi bi-plus"></i>
                            </label>
                        </div>
                        <input type="file" id="profilePhotoInput" accept="image/*" class="d-none">
                        <label for="profilePhotoInput" class="small wa-link-primary d-inline-block mt-2" role="button">+ Tambah Foto</label>
                    </div>

                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <label for="profileNameInput" class="form-label small fw-semibold mb-0">Nama Lengkap (Wajib)</label>
                            <small class="text-muted" id="profileNameCounter">0/50</small>
                        </div>
                        <input type="text" class="form-control" id="profileNameInput" maxlength="50" placeholder="Muhammad Rifa">
                    </div>

                    <button type="button" class="btn btn-success wa-btn-primary w-100 fw-semibold mb-2" id="btnSaveProfile" data-bs-dismiss="modal">Simpan &amp; Lanjut</button>
                    <div class="text-center">
                        <a href="#" id="btnBackToOtp" class="small text-secondary text-decoration-none"><i class="bi bi-arrow-left me-1"></i>Kembali ke Verifikasi OTP</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- ============================================================== -->
<!-- MODAL BUAT STATUS 24 JAM & PENGATURAN PRIVASI (SKPL-F-003 / UI-006, UI-007) -->
<!-- ============================================================== -->
<div class="modal fade" id="createStatusModal" tabindex="-1" aria-labelledby="statusModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
            <div class="modal-header wa-modal-header">
                <h6 class="modal-title" id="statusModalLabel"><i class="bi bi-plus-circle me-2"></i>Buat Pembaruan Status (24 Jam)</h6>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Tutup"></button>
            </div>
            <div class="modal-body p-4">
                <!-- Toggle Jenis Status: Teks / Gambar (UI-006) -->
                <input type="hidden" id="statusTypeInput" value="teks">
                <ul class="nav nav-pills wa-status-mode-pills gap-2 mb-3" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button type="button" class="nav-link active" id="statusTypeTextBtn">
                            <i class="bi bi-fonts me-1"></i>Teks
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button type="button" class="nav-link" id="statusTypeMediaBtn">
                            <i class="bi bi-image me-1"></i>Gambar
                        </button>
                    </li>
                </ul>

                <!-- Komposer Status Teks (UI-006) -->
                <div id="statusTextComposer">
                    <div class="mb-3">
                        <label for="statusTextInput" class="form-label small fw-semibold">Isi Status (Teks)</label>
                        <textarea class="form-control wa-status-textarea has-preview-bg" id="statusTextInput" rows="4" placeholder="Sedang menyusun dokumen DPPL WhatsApp... 🚀" style="background-color: #075e54;"></textarea>
                    </div>

                    <!-- Pilihan Warna Latar Belakang Status (5 Palet Warna) -->
                    <div class="mb-3">
                        <span class="form-label small fw-semibold d-block mb-2">Warna Latar Belakang</span>
                        <div class="wa-color-palette" role="radiogroup" aria-label="Pilih warna latar status">
                            <div>
                                <input class="wa-color-radio" type="radio" name="status_bg_color" id="statusColor1" value="#075e54" checked>
                                <label class="wa-color-swatch" for="statusColor1" style="background-color: #075e54;" title="Hijau Botol (#075e54)"></label>
                            </div>
                            <div>
                                <input class="wa-color-radio" type="radio" name="status_bg_color" id="statusColor2" value="#128c7e">
                                <label class="wa-color-swatch" for="statusColor2" style="background-color: #128c7e;" title="Teal (#128c7e)"></label>
                            </div>
                            <div>
                                <input class="wa-color-radio" type="radio" name="status_bg_color" id="statusColor3" value="#3d0c5a">
                                <label class="wa-color-swatch" for="statusColor3" style="background-color: #3d0c5a;" title="Ungu Gelap (#3d0c5a)"></label>
                            </div>
                            <div>
                                <input class="wa-color-radio" type="radio" name="status_bg_color" id="statusColor4" value="#1b3a4b">
                                <label class="wa-color-swatch" for="statusColor4" style="background-color: #1b3a4b;" title="Navy (#1b3a4b)"></label>
                            </div>
                            <div>
                                <input class="wa-color-radio" type="radio" name="status_bg_color" id="statusColor5" value="#5c1d24">
                                <label class="wa-color-swatch" for="statusColor5" style="background-color: #5c1d24;" title="Merah Marun (#5c1d24)"></label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Komposer Status Gambar/Media (UI-006) -->
                <div id="statusMediaComposer" class="d-none mb-3">
                    <div class="wa-status-media-dropzone mb-2">
                        <i class="bi bi-cloud-arrow-up fs-2 text-secondary d-block mb-1"></i>
                        <label for="statusMediaInput" class="small fw-semibold wa-link-primary d-block mb-1" role="button">Pilih gambar status</label>
                        <small class="text-muted d-block">Format JPG, PNG, atau WEBP</small>
                        <input type="file" class="form-control form-control-sm mt-2" id="statusMediaInput" accept="image/*">
                        <img id="statusMediaPreviewImg" class="wa-status-media-preview img-fluid mt-2 d-none" alt="Pratinjau gambar status">
                    </div>
                    <input type="text" class="form-control form-control-sm" id="statusMediaCaption" placeholder="Tambahkan keterangan (opsional)...">
                </div>

                <!-- Pilihan Privasi Status (UI-007) -->
                <div class="mb-2">
                    <label for="statusPrivacySelect" class="form-label small fw-semibold">Privasi Status (Siapa yang dapat melihat)</label>
                    <select class="form-select form-select-sm" id="statusPrivacySelect">
                        <option value="semua_kontak" selected>Semua Kontak</option>
                        <option value="kecuali_beberapa">Kontak saya, kecuali...</option>
                        <option value="hanya_terpilih">Hanya bagikan dengan...</option>
                    </select>
                </div>

                <!-- Daftar Pilih Kontak untuk Privasi Audiens (UI-007) -->
                <div id="statusAudienceBox" class="wa-audience-box d-none mt-2">
                    <div class="small fw-semibold text-secondary mb-2" id="statusAudienceLabel">Pilih kontak yang dikecualikan:</div>
                    <div class="form-check small mb-1">
                        <input class="form-check-input" type="checkbox" value="Budi Santoso" id="audBudi">
                        <label class="form-check-label" for="audBudi">Budi Santoso</label>
                    </div>
                    <div class="form-check small mb-1">
                        <input class="form-check-input" type="checkbox" value="Clara Meylan" id="audClara">
                        <label class="form-check-label" for="audClara">Clara Meylan</label>
                    </div>
                    <div class="form-check small mb-1">
                        <input class="form-check-input" type="checkbox" value="Raihandy Wijaya" id="audRaihandy">
                        <label class="form-check-label" for="audRaihandy">Raihandy Wijaya</label>
                    </div>
                    <div class="form-check small mb-1">
                        <input class="form-check-input" type="checkbox" value="Tika Wahyuni" id="audTika">
                        <label class="form-check-label" for="audTika">Tika Wahyuni</label>
                    </div>
                    <div class="form-check small">
                        <input class="form-check-input" type="checkbox" value="Zaldy Firaz" id="audZaldy">
                        <label class="form-check-label" for="audZaldy">Zaldy Firaz</label>
                    </div>
                </div>
            </div>
            <div class="modal-footer bg-light">
                <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Batal</button>
                <button type="button" class="btn btn-success wa-btn-primary btn-sm px-3" id="btnShareStatus" data-bs-dismiss="modal">
                    <i class="bi bi-send-fill me-1"></i>Bagikan Status
                </button>
            </div>
        </div>
    </div>
</div>

<!-- ============================================================== -->
<!-- MODAL PENAMPIL STATUS 24 JAM (STATUS VIEWER MODAL) -->
<!-- ============================================================== -->
<div class="modal fade" id="viewStatusModal" tabindex="-1" aria-labelledby="viewStatusAuthor" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content wa-status-viewer-content shadow-lg">
            <div class="px-3 pt-3 pb-2">
                <!-- Progress Bar Durasi Status -->
                <div class="wa-status-progress mb-3">
                    <div class="wa-status-progress-bar"></div>
                </div>
                <!-- Info Pembuat Status -->
                <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center gap-2">
                        <div class="wa-avatar bg-light text-dark" id="viewStatusAvatar">RW</div>
                        <div>
                            <div class="fw-semibold small" id="viewStatusAuthor">Raihandy Wijaya</div>
                            <div class="text-white-50" style="font-size: 0.75rem;" id="viewStatusTime">12 menit lalu</div>
                        </div>
                    </div>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Tutup"></button>
                </div>
            </div>
            <!-- Area Konten Status Berwarna Dinamis -->
            <div class="wa-status-viewer-canvas" id="viewStatusCanvas" style="background-color: #075e54;">
                <p class="mb-0" id="viewStatusText">Semangat ngerjain sprint backend Status 24 Jam! 🚀</p>
            </div>
        </div>
    </div>
</div>

<!-- Bootstrap 5 Bundle JS CDN -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<!-- Custom JavaScript Client Interaction (Dikelola oleh Clara - Frontend) -->
<script src="assets/js/main.js"></script>

<!-- Script Pratinjau UI Komponen Modal (Login OTP, Profil UI-008 & Status) -->
<script>
    (function () {
        // 1. Toggle UI Simulasi Login OTP Step 1 <-> Step 2 <-> Step 3 (UI-008)
        const loginStep1 = document.getElementById('loginStep1');
        const loginStep2 = document.getElementById('loginStep2');
        const loginStep3 = document.getElementById('loginStep3');
        const btnRequestOtp = document.getElementById('btnRequestOtp');
        const btnBackToPhone = document.getElementById('btnBackToPhone');
        const btnPreviewNewUserProfile = document.getElementById('btnPreviewNewUserProfile');
        const btnBackToOtp = document.getElementById('btnBackToOtp');
        const loginCountrySelect = document.getElementById('loginCountrySelect');
        const loginCountryCode = document.getElementById('loginCountryCode');
        const loginPhoneInput = document.getElementById('loginPhoneInput');
        const otpTargetPhone = document.getElementById('otpTargetPhone');
        const otpResendTimer = document.getElementById('otpResendTimer');
        const btnResendOtp = document.getElementById('btnResendOtp');
        const otpBoxes = document.querySelectorAll('#otpInputsContainer .wa-otp-box');
        let countdownInterval = null;

        function startOtpCountdown(seconds) {
            if (!otpResendTimer) return;
            clearInterval(countdownInterval);
            let remaining = seconds;
            const render = function () {
                if (remaining <= 0) {
                    clearInterval(countdownInterval);
                    otpResendTimer.textContent = '';
                    return;
                }
                const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
                const ss = String(remaining % 60).padStart(2, '0');
                otpResendTimer.textContent = '(' + mm + ':' + ss + ')';
            };
            render();
            countdownInterval = setInterval(function () {
                remaining -= 1;
                render();
            }, 1000);
        }

        if (loginCountrySelect && loginCountryCode) {
            loginCountrySelect.addEventListener('change', function () {
                loginCountryCode.textContent = this.value;
            });
        }

        if (btnRequestOtp && loginStep1 && loginStep2) {
            btnRequestOtp.addEventListener('click', function () {
                if (loginPhoneInput && otpTargetPhone) {
                    const code = loginCountryCode ? loginCountryCode.textContent : '+62';
                    const phoneVal = loginPhoneInput.value.trim() || '812-3456-7890';
                    otpTargetPhone.textContent = code + ' ' + phoneVal;
                }
                loginStep1.classList.add('d-none');
                if (loginStep3) loginStep3.classList.add('d-none');
                loginStep2.classList.remove('d-none');
                startOtpCountdown(45);
                if (otpBoxes.length > 0) otpBoxes[0].focus();
            });
        }

        if (btnBackToPhone && loginStep1 && loginStep2) {
            btnBackToPhone.addEventListener('click', function (e) {
                e.preventDefault();
                clearInterval(countdownInterval);
                loginStep2.classList.add('d-none');
                loginStep1.classList.remove('d-none');
            });
        }

        if (btnResendOtp) {
            btnResendOtp.addEventListener('click', function (e) {
                e.preventDefault();
                startOtpCountdown(45);
            });
        }

        if (btnPreviewNewUserProfile && loginStep2 && loginStep3) {
            btnPreviewNewUserProfile.addEventListener('click', function (e) {
                e.preventDefault();
                loginStep2.classList.add('d-none');
                loginStep3.classList.remove('d-none');
            });
        }

        if (btnBackToOtp && loginStep2 && loginStep3) {
            btnBackToOtp.addEventListener('click', function (e) {
                e.preventDefault();
                loginStep3.classList.add('d-none');
                loginStep2.classList.remove('d-none');
            });
        }

        // Auto-pindah fokus antar kotak OTP 6 digit
        otpBoxes.forEach(function (box, idx) {
            box.addEventListener('input', function () {
                this.value = this.value.replace(/\D/g, '').slice(0, 1);
                if (this.value && idx < otpBoxes.length - 1) {
                    otpBoxes[idx + 1].focus();
                }
            });
            box.addEventListener('keydown', function (e) {
                if (e.key === 'Backspace' && !this.value && idx > 0) {
                    otpBoxes[idx - 1].focus();
                }
            });
        });

        // Counter & Pratinjau Foto Profil UI-008
        const profileNameInput = document.getElementById('profileNameInput');
        const profileNameCounter = document.getElementById('profileNameCounter');
        const profilePhotoInput = document.getElementById('profilePhotoInput');
        const profileAvatarPreview = document.getElementById('profileAvatarPreview');
        const profileAvatarIcon = document.getElementById('profileAvatarIcon');

        if (profileNameInput && profileNameCounter) {
            profileNameInput.addEventListener('input', function () {
                profileNameCounter.textContent = this.value.length + '/50';
            });
        }

        if (profilePhotoInput && profileAvatarPreview) {
            profilePhotoInput.addEventListener('change', function () {
                const file = this.files && this.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = function (ev) {
                    profileAvatarPreview.style.backgroundImage = 'url("' + ev.target.result + '")';
                    if (profileAvatarIcon) profileAvatarIcon.classList.add('d-none');
                };
                reader.readAsDataURL(file);
            });
        }

        // 2. Modal Buat Status: Mode Teks/Gambar, Warna Latar, dan Privasi Audiens
        const createStatusModal = document.getElementById('createStatusModal');
        const statusTypeInput = document.getElementById('statusTypeInput');
        const statusTypeTextBtn = document.getElementById('statusTypeTextBtn');
        const statusTypeMediaBtn = document.getElementById('statusTypeMediaBtn');
        const statusTextComposer = document.getElementById('statusTextComposer');
        const statusMediaComposer = document.getElementById('statusMediaComposer');
        const statusMediaInput = document.getElementById('statusMediaInput');
        const statusMediaPreviewImg = document.getElementById('statusMediaPreviewImg');
        const statusTextarea = document.getElementById('statusTextInput');
        const colorRadios = document.querySelectorAll('input[name="status_bg_color"]');
        const statusPrivacySelect = document.getElementById('statusPrivacySelect');
        const statusAudienceBox = document.getElementById('statusAudienceBox');
        const statusAudienceLabel = document.getElementById('statusAudienceLabel');

        function setStatusMode(mode) {
            const isMedia = mode === 'media';
            if (statusTypeInput) statusTypeInput.value = isMedia ? 'media' : 'teks';
            if (statusTypeTextBtn) statusTypeTextBtn.classList.toggle('active', !isMedia);
            if (statusTypeMediaBtn) statusTypeMediaBtn.classList.toggle('active', isMedia);
            if (statusTextComposer) statusTextComposer.classList.toggle('d-none', isMedia);
            if (statusMediaComposer) statusMediaComposer.classList.toggle('d-none', !isMedia);
        }

        if (statusTypeTextBtn) {
            statusTypeTextBtn.addEventListener('click', function () { setStatusMode('teks'); });
        }
        if (statusTypeMediaBtn) {
            statusTypeMediaBtn.addEventListener('click', function () { setStatusMode('media'); });
        }
        if (createStatusModal) {
            createStatusModal.addEventListener('show.bs.modal', function (event) {
                const trigger = event.relatedTarget;
                const mode = trigger ? trigger.getAttribute('data-status-mode') : 'teks';
                setStatusMode(mode === 'media' ? 'media' : 'teks');
            });
        }

        if (statusMediaInput && statusMediaPreviewImg) {
            statusMediaInput.addEventListener('change', function () {
                const file = this.files && this.files[0];
                if (!file) {
                    statusMediaPreviewImg.classList.add('d-none');
                    return;
                }
                const reader = new FileReader();
                reader.onload = function (ev) {
                    statusMediaPreviewImg.src = ev.target.result;
                    statusMediaPreviewImg.classList.remove('d-none');
                };
                reader.readAsDataURL(file);
            });
        }

        colorRadios.forEach(function (radio) {
            radio.addEventListener('change', function () {
                if (statusTextarea && this.checked) {
                    statusTextarea.style.backgroundColor = this.value;
                }
            });
        });

        if (statusPrivacySelect && statusAudienceBox) {
            statusPrivacySelect.addEventListener('change', function () {
                if (this.value === 'kecuali_beberapa') {
                    statusAudienceBox.classList.remove('d-none');
                    if (statusAudienceLabel) statusAudienceLabel.textContent = 'Pilih kontak yang dikecualikan:';
                } else if (this.value === 'hanya_terpilih') {
                    statusAudienceBox.classList.remove('d-none');
                    if (statusAudienceLabel) statusAudienceLabel.textContent = 'Pilih kontak yang dapat melihat:';
                } else {
                    statusAudienceBox.classList.add('d-none');
                }
            });
        }

        // 3. Isi Data Pratinjau Modal Penampil Status saat item status diklik
        const viewStatusModal = document.getElementById('viewStatusModal');
        if (viewStatusModal) {
            viewStatusModal.addEventListener('show.bs.modal', function (event) {
                const trigger = event.relatedTarget;
                if (!trigger) return;

                const author = trigger.getAttribute('data-status-author') || 'Kontak';
                const avatar = trigger.getAttribute('data-status-avatar') || 'WA';
                const time = trigger.getAttribute('data-status-time') || 'Baru saja';
                const text = trigger.getAttribute('data-status-text') || '';
                const color = trigger.getAttribute('data-status-color') || '#075e54';

                const authorEl = document.getElementById('viewStatusAuthor');
                const avatarEl = document.getElementById('viewStatusAvatar');
                const timeEl = document.getElementById('viewStatusTime');
                const textEl = document.getElementById('viewStatusText');
                const canvasEl = document.getElementById('viewStatusCanvas');

                if (authorEl) authorEl.textContent = author;
                if (avatarEl) avatarEl.textContent = avatar;
                if (timeEl) timeEl.textContent = time;
                if (textEl) textEl.textContent = text;
                if (canvasEl) canvasEl.style.backgroundColor = color;
            });
        }
    })();
</script>

</body>
</html>
