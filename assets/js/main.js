/**
 * ==============================================================================
 * WhatsApp Web Client Interaction Script
 * Proyek: WhatsApp PPPL (Praktikum Pemrograman Perangkat Lunak)
 * Pengembang: Clara Uenike Meylan Langi (NIM: 10241018)
 * Peran: Frontend Developer (Chat Interface & Client-Side Interactivity - Urutan 2)
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    // --------------------------------------------------------------------------
    // 1. ELEMEN DOM UTAMA
    // --------------------------------------------------------------------------
    const chatForm = document.getElementById('sendMessageForm');
    const messageInput = document.getElementById('messageInput');
    const messagesContainer = document.getElementById('messagesContainer');
    const chatItems = document.querySelectorAll('#chats-pane .wa-chat-item');
    const currentChatName = document.getElementById('currentChatName');
    const currentChatAvatar = document.getElementById('currentChatAvatar');
    const currentChatStatus = document.getElementById('currentChatStatus');

    const chatsTab = document.getElementById('chats-tab');
    const statusTab = document.getElementById('status-tab');
    const chatsPane = document.getElementById('chats-pane');
    const statusPane = document.getElementById('status-pane');

    // --------------------------------------------------------------------------
    // 2. FUNGSI PEMBANTU (HELPERS & SANITASI XSS)
    // --------------------------------------------------------------------------

    /**
     * Membersihkan teks masukan pengguna dari karakter HTML berbahaya (Mencegah XSS)
     * @param {string} text
     * @returns {string}
     */
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, function (m) {
            return map[m];
        });
    }

    /**
     * Mendapatkan waktu saat ini dalam format jam HH:mm (contoh: 14:25)
     * @returns {string}
     */
    function getCurrentTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    /**
     * Menggulir otomatis wadah pesan ke paling bawah
     */
    function scrollToBottom() {
        if (!messagesContainer) return;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // --------------------------------------------------------------------------
    // 3. PEMILIHAN KONTAK OBROLAN (SWITCH ACTIVE CHAT - BAGIAN 4.1)
    // --------------------------------------------------------------------------
    chatItems.forEach(item => {
        item.addEventListener('click', function () {
            // Hapus kelas .active dari kontak obrolan sebelumnya
            chatItems.forEach(i => i.classList.remove('active'));

            // Tambahkan kelas .active pada kontak yang baru diklik
            this.classList.add('active');

            // Ambil data kontak dari atribut elemen
            const contactName = this.getAttribute('data-contact') || 'Kontak';
            const contactPhone = this.getAttribute('data-phone') || '';
            const avatarElem = this.querySelector('.wa-avatar');

            // Perbarui header obrolan aktif secara dinamis
            if (currentChatName) {
                currentChatName.textContent = contactName;
            }

            if (currentChatAvatar && avatarElem) {
                currentChatAvatar.textContent = avatarElem.textContent.trim();
                currentChatAvatar.className = avatarElem.className;
            }

            if (currentChatStatus) {
                // Tentukan status tampilan kontak aktif
                if (contactName === 'Budi Santoso') {
                    currentChatStatus.textContent = 'online';
                } else if (contactName === 'Clara Meylan') {
                    currentChatStatus.textContent = 'terakhir dilihat hari ini pukul 09:40';
                } else if (contactName === 'Zaldy Firaz') {
                    currentChatStatus.textContent = 'terakhir dilihat kemarin pukul 21:15';
                } else {
                    currentChatStatus.textContent = contactPhone ? contactPhone : 'online';
                }
            }

            // Hapus badge notifikasi unread jika ada saat kontak dibuka
            const unreadBadge = this.querySelector('.badge.bg-success');
            if (unreadBadge) {
                unreadBadge.remove();
            }
        });
    });

    // --------------------------------------------------------------------------
    // 4. SIMULASI & PENANGANAN PENGIRIMAN PESAN TEKS (BAGIAN 4.2)
    // --------------------------------------------------------------------------
    function sendMessage() {
        if (!messageInput || !messagesContainer) return;

        // Ambil teks dari #messageInput
        const text = messageInput.value.trim();

        // Jika kosong atau hanya spasi, batalkan pengiriman
        if (text === '') return;

        // Format waktu saat ini (HH:mm)
        const timeStr = getCurrentTime();

        // Buat elemen bubble pesan terkirim baru (.wa-bubble-sent)
        const bubble = document.createElement('div');
        bubble.className = 'wa-message-bubble wa-bubble-sent';
        bubble.innerHTML = `
            <div>${escapeHtml(text)}</div>
            <span class="wa-msg-meta">${timeStr} <i class="bi bi-check2 text-secondary ms-1" title="Terkirim"></i></span>
        `;

        // Masukkan ke wadah pesan
        messagesContainer.appendChild(bubble);

        // Kosongkan kolom input dan fokuskan kembali kursor
        messageInput.value = '';
        messageInput.focus();

        // Perbarui teks cuplikan pesan terakhir pada kontak aktif di sidebar kiri
        const activeItem = document.querySelector('#chats-pane .wa-chat-item.active');
        if (activeItem) {
            const previewText = activeItem.querySelector('.text-secondary.text-truncate');
            const metaTime = activeItem.querySelector('.wa-msg-meta');

            if (previewText) {
                previewText.innerHTML = `<i class="bi bi-check2 text-secondary me-1"></i>${escapeHtml(text)}`;
            }
            if (metaTime) {
                metaTime.textContent = timeStr;
                metaTime.classList.remove('text-success', 'fw-semibold');
            }
        }

        // Gulir otomatis wadah pesan ke paling bawah
        scrollToBottom();
    }

    if (chatForm) {
        chatForm.addEventListener('submit', function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            sendMessage();
        });
    }

    if (messageInput) {
        messageInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // --------------------------------------------------------------------------
    // 5. NAVIGASI TAB CHAT & STATUS DENGAN MODAL HELPER (BAGIAN 4.3)
    // --------------------------------------------------------------------------
    if (chatsTab && statusTab && chatsPane && statusPane) {
        chatsTab.addEventListener('click', function () {
            chatsTab.classList.add('active');
            statusTab.classList.remove('active');
            chatsPane.classList.add('show', 'active');
            statusPane.classList.remove('show', 'active');
        });

        statusTab.addEventListener('click', function () {
            statusTab.classList.add('active');
            chatsTab.classList.remove('active');
            statusPane.classList.add('show', 'active');
            chatsPane.classList.remove('show', 'active');
        });
    }

    /**
     * Helper untuk membuka modal penampil status secara terprogram
     * @param {HTMLElement} statusItem
     */
    window.openStatusModal = function (statusItem) {
        const viewStatusModalEl = document.getElementById('viewStatusModal');
        if (!viewStatusModalEl || !window.bootstrap) return;

        const modalInstance = bootstrap.Modal.getOrCreateInstance(viewStatusModalEl);
        modalInstance.show(statusItem);
    };

    // Gulir otomatis saat pertama kali halaman dimuat
    scrollToBottom();
});

// ------------------------------------------------------------------------------
// 6. PERSIAPAN ARSITEKTUR FETCH API UNTUK BACKEND (BAGIAN 4.4)
// Modul placeholder async siap integrasi ke endpoint API (Tika / Zaldy)
// ------------------------------------------------------------------------------

/**
 * Mengambil daftar kontak obrolan dari endpoint backend
 * Endpoint target: api/contacts.php atau api/conversations.php
 * @returns {Promise<Array>}
 */
async function fetchContacts() {
    try {
        const response = await fetch('api/contacts.php', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.warn('[Fetch API Placeholder] Gagal mengambil kontak dari backend:', error);
        return [];
    }
}

/**
 * Mengambil riwayat pesan untuk percakapan tertentu dari backend
 * Endpoint target: api/messages.php?conversation_id={conversationId}
 * @param {string|number} conversationId
 * @returns {Promise<Array>}
 */
async function fetchMessages(conversationId) {
    try {
        const response = await fetch(`api/messages.php?conversation_id=${encodeURIComponent(conversationId)}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.warn(`[Fetch API Placeholder] Gagal mengambil riwayat pesan untuk ID ${conversationId}:`, error);
        return [];
    }
}

/**
 * Mengirim pesan baru ke endpoint backend untuk disimpan di database
 * Endpoint target: api/messages.php
 * @param {string|number} conversationId
 * @param {string} text
 * @returns {Promise<Object|null>}
 */
async function postMessage(conversationId, text) {
    try {
        const response = await fetch('api/messages.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                conversation_id: conversationId,
                message: text
            })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.warn('[Fetch API Placeholder] Gagal mengirim pesan ke backend:', error);
        return null;
    }
}
