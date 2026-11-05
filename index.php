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
    <!-- Custom Stylesheet (Dikelola oleh Clara - Frontend) -->
    <link rel="stylesheet" href="assets/css/style.css">
    <style>
        /* Fallback Styling Dasar sebelum custom style.css dimuat */
        :root {
            --wa-primary: #128c7e;
            --wa-primary-dark: #075e54;
            --wa-accent: #25d366;
            --wa-bg-chat: #efeae2;
            --wa-bubble-out: #d9fdd3;
            --wa-bubble-in: #ffffff;
            --wa-gray-header: #f0f2f5;
        }
        body {
            background-color: #d1d7db;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            height: 100vh;
            overflow: hidden;
        }
        .wa-app-container {
            height: 95vh;
            max-width: 1600px;
            background: #ffffff;
            box-shadow: 0 6px 18px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
            margin-top: 2.5vh;
        }
        .wa-sidebar {
            border-right: 1px solid #e9edef;
            display: flex;
            flex-direction: column;
            height: 100%;
            background-color: #ffffff;
        }
        .wa-header {
            background-color: var(--wa-gray-header);
            height: 60px;
            padding: 10px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #e9edef;
        }
        .wa-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;
            background-color: #dfe5e7;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: #54656f;
        }
        .wa-nav-tabs .nav-link {
            color: #54656f;
            font-weight: 500;
            border: none;
            border-bottom: 3px solid transparent;
            padding: 10px;
        }
        .wa-nav-tabs .nav-link.active {
            color: var(--wa-primary-dark);
            border-bottom: 3px solid var(--wa-primary-dark);
            font-weight: 600;
        }
        .wa-chat-list, .wa-status-list {
            overflow-y: auto;
            flex: 1;
        }
        .wa-chat-item {
            padding: 12px 16px;
            cursor: pointer;
            transition: background 0.2s;
            border-bottom: 1px solid #f2f2f2;
        }
        .wa-chat-item:hover, .wa-chat-item.active {
            background-color: #f5f6f6;
        }
        .wa-chat-pane {
            display: flex;
            flex-direction: column;
            height: 100%;
            background-color: var(--wa-bg-chat);
        }
        .wa-messages-area {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .wa-e2ee-badge {
            background-color: #ffeecd;
            color: #54656f;
            border-radius: 8px;
            font-size: 0.78rem;
            max-width: 480px;
            margin: 0 auto 12px auto;
            padding: 8px 14px;
            text-align: center;
            box-shadow: 0 1px 1px rgba(0,0,0,0.06);
        }
        .wa-message-bubble {
            max-width: 65%;
            padding: 8px 12px;
            border-radius: 8px;
            position: relative;
            font-size: 0.92rem;
            box-shadow: 0 1px 1px rgba(0,0,0,0.08);
            word-wrap: break-word;
        }
        .wa-bubble-sent {
            align-self: flex-end;
            background-color: var(--wa-bubble-out);
            border-top-right-radius: 2px;
        }
        .wa-bubble-received {
            align-self: flex-start;
            background-color: var(--wa-bubble-in);
            border-top-left-radius: 2px;
        }
        .wa-msg-meta {
            font-size: 0.7rem;
            color: #667781;
            margin-left: 8px;
            float: right;
            margin-top: 4px;
        }
        .wa-chat-input-bar {
            background-color: var(--wa-gray-header);
            padding: 10px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
    </style>
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
                <div class="wa-header">
                    <div class="d-flex align-items-center gap-2">
                        <div class="wa-avatar bg-success text-white">MR</div>
                        <span class="fw-semibold small text-truncate" style="max-width: 110px;">Muhammad Rifa</span>
                    </div>
                    <div class="d-flex align-items-center gap-3 text-secondary">
                        <!-- Tombol Simulasi Login/OTP (UI-001, UI-002) -->
                        <button class="btn btn-sm btn-outline-secondary py-0 px-2" data-bs-toggle="modal" data-bs-target="#loginModal" title="Simulasi Login / OTP">
                            <i class="bi bi-box-arrow-in-right"></i> Login
                        </button>
                        <i class="bi bi-chat-left-text-fill fs-5" role="button" title="Chat Baru"></i>
                        <i class="bi bi-three-dots-vertical fs-5" role="button" title="Menu"></i>
                    </div>
                </div>

                <!-- Navigasi Tab (Chat / Status) sesuai Bab 5.1 SDD -->
                <ul class="nav nav-tabs wa-nav-tabs nav-fill bg-light px-2 pt-2" id="waTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active w-100" id="chats-tab" data-bs-toggle="tab" data-bs-target="#chats-pane" type="button" role="tab">
                            <i class="bi bi-chat-dots-fill me-1"></i> CHAT <span class="badge bg-success rounded-pill ms-1">1</span>
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link w-100" id="status-tab" data-bs-toggle="tab" data-bs-target="#status-pane" type="button" role="tab">
                            <i class="bi bi-circle-half me-1"></i> STATUS
                        </button>
                    </li>
                </ul>

                <!-- Kotak Pencarian Kontak/Chat -->
                <div class="p-2 bg-light border-bottom">
                    <div class="input-group input-group-sm">
                        <span class="input-group-text bg-white border-end-0 text-secondary"><i class="bi bi-search"></i></span>
                        <input type="text" class="form-control border-start-0" placeholder="Cari atau mulai chat baru" id="chatSearchInput">
                    </div>
                </div>

                <!-- Tab Content: List Chat atau List Status -->
                <div class="tab-content flex-grow-1 overflow-hidden d-flex flex-column" id="waTabsContent">
                    
                    <!-- TAB 1: DAFTAR CHAT (UI-003) -->
                    <div class="tab-pane fade show active wa-chat-list" id="chats-pane" role="tabpanel">
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
                    <div class="tab-pane fade wa-status-list p-3" id="status-pane" role="tabpanel">
                        <!-- Status Saya -->
                        <div class="d-flex align-items-center gap-3 mb-3 p-2 bg-light rounded" role="button" data-bs-toggle="modal" data-bs-target="#createStatusModal">
                            <div class="position-relative">
                                <div class="wa-avatar bg-success text-white">MR</div>
                                <span class="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle p-1 text-white" style="font-size: 0.6rem;">
                                    <i class="bi bi-plus"></i>
                                </span>
                            </div>
                            <div class="flex-grow-1">
                                <span class="fw-semibold d-block">Status Saya</span>
                                <small class="text-secondary">Ketuk untuk menambahkan pembaruan status</small>
                            </div>
                        </div>

                        <div class="text-uppercase text-secondary fw-bold small mb-2" style="font-size: 0.75rem;">Pembaruan Terbaru (24 Jam)</div>
                        
                        <!-- Status Kontak 1: Raihandy Wijaya (sesuai Wireframe SDD Halaman 26) -->
                        <div class="d-flex align-items-center gap-3 mb-2 p-2 rounded wa-chat-item">
                            <div class="wa-avatar border border-2 border-success text-dark">RW</div>
                            <div>
                                <span class="fw-semibold d-block">Raihandy Wijaya</span>
                                <small class="text-secondary">12 menit lalu</small>
                            </div>
                        </div>

                        <!-- Status Kontak 2: Tika Wahyuni (sesuai Wireframe SDD Halaman 26) -->
                        <div class="d-flex align-items-center gap-3 mb-2 p-2 rounded wa-chat-item">
                            <div class="wa-avatar border border-2 border-success text-dark">TW</div>
                            <div>
                                <span class="fw-semibold d-block">Tika Wahyuni</span>
                                <small class="text-secondary">45 menit lalu</small>
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
                    <div class="d-flex align-items-center gap-3">
                        <div class="wa-avatar bg-primary text-white" id="currentChatAvatar">BS</div>
                        <div>
                            <h6 class="mb-0 fw-semibold" id="currentChatName">Budi Santoso</h6>
                            <small class="text-muted" id="currentChatStatus">online</small>
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-3 text-secondary">
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
                    <button class="btn btn-link text-secondary p-0 fs-5 border-0"><i class="bi bi-emoji-smile"></i></button>
                    <button class="btn btn-link text-secondary p-0 fs-5 border-0"><i class="bi bi-paperclip"></i></button>
                    
                    <form class="flex-grow-1 d-flex gap-2" id="sendMessageForm" onsubmit="return false;">
                        <input type="text" class="form-control rounded-pill px-3" placeholder="Ketik pesan" id="messageInput" autocomplete="off">
                        <button type="submit" class="btn btn-success rounded-circle d-flex align-items-center justify-content-center" style="width: 42px; height: 42px;" id="sendBtn" title="Kirim Pesan (E2EE)">
                            <i class="bi bi-send-fill text-white"></i>
                        </button>
                    </form>
                </div>

            </div>

        </div>
    </div>
</div>

<!-- ============================================================== -->
<!-- MODAL SIMULASI LOGIN & VERIFIKASI OTP (SKPL-F-001 / UI-001, UI-002) -->
<!-- ============================================================== -->
<div class="modal fade" id="loginModal" tabindex="-1" aria-labelledby="loginModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header bg-success text-white">
                <h6 class="modal-title" id="loginModalLabel"><i class="bi bi-shield-lock me-1"></i> Masuk WhatsApp (Login OTP)</h6>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <!-- UI-001: Form Input Nomor Telepon -->
                <div id="loginStep1">
                    <p class="small text-secondary mb-3">WhatsApp akan mengirimkan SMS berisi kode verifikasi 6-digit ke nomor telepon Anda.</p>
                    <div class="mb-3">
                        <label class="form-label small fw-semibold">Nomor Telepon</label>
                        <div class="input-group">
                            <span class="input-group-text">+62</span>
                            <input type="tel" class="form-control" id="loginPhoneInput" placeholder="812-3456-7890" value="812-3456-7890">
                        </div>
                    </div>
                    <button type="button" class="btn btn-success w-100" id="btnRequestOtp">Lanjut &amp; Minta OTP</button>
                </div>

                <!-- UI-002: Form Verifikasi 6-Digit OTP (Tersembunyi secara default) -->
                <div id="loginStep2" class="d-none">
                    <p class="small text-secondary mb-3">Masukkan 6 digit kode OTP yang dikirimkan ke nomor Anda:</p>
                    <div class="d-flex justify-content-between mb-3 gap-2">
                        <input type="text" maxlength="1" class="form-control text-center fs-4 fw-bold" value="4">
                        <input type="text" maxlength="1" class="form-control text-center fs-4 fw-bold" value="8">
                        <input type="text" maxlength="1" class="form-control text-center fs-4 fw-bold" value="1">
                        <input type="text" maxlength="1" class="form-control text-center fs-4 fw-bold" value="9">
                        <input type="text" maxlength="1" class="form-control text-center fs-4 fw-bold" value="2">
                        <input type="text" maxlength="1" class="form-control text-center fs-4 fw-bold" value="0">
                    </div>
                    <button type="button" class="btn btn-success w-100" data-bs-dismiss="modal">Verifikasi &amp; Masuk</button>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- ============================================================== -->
<!-- MODAL BUAT STATUS & PENGATURAN PRIVASI (SKPL-F-003 / UI-006, UI-007) -->
<!-- ============================================================== -->
<div class="modal fade" id="createStatusModal" tabindex="-1" aria-labelledby="statusModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header bg-success text-white">
                <h6 class="modal-title" id="statusModalLabel"><i class="bi bi-plus-circle me-1"></i> Buat Pembaruan Status (24 Jam)</h6>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Isi Status (Teks)</label>
                    <textarea class="form-control" rows="3" placeholder="Sedang menyusun dokumen DPPL WhatsApp... 🚀"></textarea>
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Privasi Status (UI-007)</label>
                    <select class="form-select form-select-sm">
                        <option value="semua_kontak" selected>Kontak Saya</option>
                        <option value="kecuali_beberapa">Kontak saya, kecuali...</option>
                        <option value="hanya_terpilih">Hanya bagikan dengan...</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Batal</button>
                <button type="button" class="btn btn-success btn-sm" data-bs-dismiss="modal">Bagikan Status</button>
            </div>
        </div>
    </div>
</div>

<!-- Bootstrap 5 Bundle JS CDN -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<!-- Custom JavaScript Client Interaction (Dikelola oleh Clara - Frontend) -->
<script src="assets/js/main.js"></script>

<!-- Script Interaktivitas Standar Klien Rifa -->
<script>
    // Penanganan simulasi pengiriman pesan langsung di browser
    document.getElementById('sendMessageForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        if (text === '') return;

        const container = document.getElementById('messagesContainer');
        const now = new Date();
        const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

        const bubble = document.createElement('div');
        bubble.className = 'wa-message-bubble wa-bubble-sent';
        bubble.innerHTML = `<div>${escapeHtml(text)}</div><span class="wa-msg-meta">${timeStr} <i class="bi bi-check2 text-secondary ms-1" title="Terkirim"></i></span>`;
        
        container.appendChild(bubble);
        input.value = '';
        container.scrollTop = container.scrollHeight;
    });

    function escapeHtml(string) {
        return String(string).replace(/[&<>"'`=\/]/g, function (s) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;' })[s];
        });
    }

    // Toggle sederhana UI simulasi OTP step 1 -> step 2
    document.getElementById('btnRequestOtp').addEventListener('click', function() {
        document.getElementById('loginStep1').classList.add('d-none');
        document.getElementById('loginStep2').classList.remove('d-none');
    });
</script>

</body>
</html>
