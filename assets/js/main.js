/**
 * ==============================================================================
 * WhatsApp Web Client Interaction Script
 * Proyek: WhatsApp PPPL (Praktikum Pemrograman Perangkat Lunak)
 * Pengembang: Clara Uenike Meylan Langi (NIM: 10241018)
 * Peran: Frontend Developer (Chat Interface & Client-Side Interactivity - Urutan 2)
 * ==============================================================================
 */

// ------------------------------------------------------------------------------
// API CLIENT (FETCH) KE BACKEND
// ------------------------------------------------------------------------------

/**
 * Wrapper fetch: selalu kirim cookie sesi, parse JSON, lempar Error jika gagal.
 */
async function apiRequest(url, options = {}) {
    const headers = Object.assign({ 'Accept': 'application/json' }, options.headers || {});
    const response = await fetch(url, Object.assign({}, options, {
        credentials: 'same-origin',
        headers: headers
    }));

    let payload = null;
    try {
        payload = await response.json();
    } catch (e) {
        // respons bukan JSON
    }

    if (!response.ok || !payload || payload.success === false) {
        const message = payload && payload.message ? payload.message : `HTTP error! status: ${response.status}`;
        const error = new Error(message);
        error.status = response.status;
        throw error;
    }
    return payload;
}

/**
 * Mengambil daftar kontak + pesan terakhir.
 * @returns {Promise<Array|null>} array kontak, atau null jika gagal (mis. belum login)
 */
async function fetchContacts() {
    try {
        const payload = await apiRequest('api/contacts.php?action=list');
        return payload.data || [];
    } catch (error) {
        console.warn('[API] Gagal mengambil kontak dari backend:', error.message);
        return null;
    }
}

/**
 * Memulai (atau mengambil) percakapan dengan seorang kontak.
 * @param {number} contactId id_pengguna kontak
 * @returns {Promise<number>} id_percakapan
 */
async function startConversation(contactId) {
    const payload = await apiRequest('api/contacts.php?action=start_conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: contactId })
    });
    return payload.data.conversation_id;
}

/**
 * Mengambil riwayat pesan. Jika sinceId > 0 hanya pesan baru (untuk polling).
 * @returns {Promise<Array>}
 */
async function fetchMessages(conversationId, sinceId = 0) {
    let url = `api/messages.php?conversation_id=${encodeURIComponent(conversationId)}`;
    if (sinceId > 0) {
        url += `&since_id=${encodeURIComponent(sinceId)}`;
    }
    const payload = await apiRequest(url);
    return payload.data || [];
}

/**
 * Mengirim pesan baru. Mengembalikan objek pesan yang tersimpan di database.
 * @returns {Promise<Object>}
 */
async function postMessage(conversationId, text) {
    const payload = await apiRequest('api/messages.php?action=send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            conversation_id: conversationId,
            message_text: text
        })
    });
    return payload.data;
}

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    // --------------------------------------------------------------------------
    // 1. ELEMEN DOM UTAMA & STATE
    // --------------------------------------------------------------------------
    const chatForm = document.getElementById('sendMessageForm');
    const messageInput = document.getElementById('messageInput');
    const messagesContainer = document.getElementById('messagesContainer');
    const currentChatName = document.getElementById('currentChatName');
    const currentChatAvatar = document.getElementById('currentChatAvatar');
    const currentChatStatus = document.getElementById('currentChatStatus');

    const chatsTab = document.getElementById('chats-tab');
    const statusTab = document.getElementById('status-tab');
    const chatsPane = document.getElementById('chats-pane');
    const statusPane = document.getElementById('status-pane');

    // Wadah daftar kontak = induk dari item chat statis pertama (atau chats-pane)
    const firstStaticItem = chatsPane ? chatsPane.querySelector('.wa-chat-item') : null;
    const chatListEl = firstStaticItem ? firstStaticItem.parentElement : chatsPane;

    const POLL_MESSAGES_MS = 3000;
    const REFRESH_CONTACTS_MS = 10000;

    let activeContactId = null;       // id_pengguna lawan bicara yang sedang dibuka
    let currentConversationId = null; // id_percakapan aktif
    let lastMessageId = 0;            // id_pesan terbesar yang sudah tampil
    const renderedMessageIds = new Set();
    let openToken = 0;                // mencegah balapan saat pindah chat cepat
    let pollTimer = null;
    let isSending = false;

    // --------------------------------------------------------------------------
    // 2. FUNGSI PEMBANTU (HELPERS & SANITASI XSS)
    // --------------------------------------------------------------------------

    function escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return String(text).replace(/[&<>"']/g, function (m) { return map[m]; });
    }

    function getCurrentTime() {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }

    function scrollToBottom() {
        if (!messagesContainer) return;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function getInitials(name) {
        const parts = String(name || '?').trim().split(/\s+/);
        const initials = parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
        return initials.toUpperCase();
    }

    /** "YYYY-MM-DD HH:MM:SS" -> teks status "terakhir dilihat ..." */
    function formatLastSeen(timestamp) {
        if (!timestamp) return 'online';
        const date = new Date(String(timestamp).replace(' ', 'T'));
        if (isNaN(date.getTime())) return 'online';

        const hhmm = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return `terakhir dilihat hari ini pukul ${hhmm}`;
        if (date.toDateString() === yesterday.toDateString()) return `terakhir dilihat kemarin pukul ${hhmm}`;
        return `terakhir dilihat ${date.toLocaleDateString('id-ID')} pukul ${hhmm}`;
    }

    function statusIconHtml(status, extraClass) {
        const cls = extraClass || '';
        if (status === 'dibaca') return `<i class="bi bi-check2-all text-primary ${cls}" title="Dibaca"></i>`;
        if (status === 'diterima') return `<i class="bi bi-check2-all text-secondary ${cls}" title="Diterima"></i>`;
        return `<i class="bi bi-check2 text-secondary ${cls}" title="Terkirim"></i>`;
    }

    // --------------------------------------------------------------------------
    // 3. DAFTAR KONTAK DARI DATABASE (api/contacts.php?action=list)
    // --------------------------------------------------------------------------

    function renderContacts(contacts) {
        if (!chatListEl) return;
        chatListEl.innerHTML = '';

        if (!contacts.length) {
            chatListEl.innerHTML = '<div class="p-4 text-center text-secondary">Belum ada kontak.</div>';
            return;
        }

        contacts.forEach(function (c) {
            const item = document.createElement('div');
            item.className = 'wa-chat-item d-flex align-items-center p-3' +
                (c.contact_id === activeContactId ? ' active' : '');
            item.dataset.contact = c.name;
            item.dataset.phone = c.phone || '';
            item.dataset.contactId = c.contact_id;
            item.dataset.conversationId = c.conversation_id || '';
            item.dataset.lastSeen = c.last_seen || '';

            const last = c.last_message;
            const previewText = last
                ? (last.is_mine ? statusIconHtml(last.status, 'me-1') : '') + escapeHtml(last.text)
                : '<span class="fst-italic">Belum ada pesan</span>';
            const timeText = last ? escapeHtml(last.time) : '';
            const unreadBadge = c.unread_count > 0 && c.contact_id !== activeContactId
                ? `<span class="badge bg-success rounded-pill ms-2">${c.unread_count}</span>`
                : '';
            const timeClass = c.unread_count > 0 && c.contact_id !== activeContactId
                ? 'text-success fw-semibold' : 'text-secondary';

            item.innerHTML = `
                <div class="wa-avatar">${escapeHtml(getInitials(c.name))}</div>
                <div class="flex-grow-1 ms-3 overflow-hidden">
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="fw-semibold text-truncate">${escapeHtml(c.name)}</span>
                        <small class="wa-msg-meta ${timeClass}">${timeText}</small>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="text-secondary text-truncate">${previewText}</span>
                        ${unreadBadge}
                    </div>
                </div>
            `;
            chatListEl.appendChild(item);
        });
    }

    async function loadContacts() {
        const contacts = await fetchContacts();
        // null = gagal (mis. belum login) -> biarkan tampilan statis simulasi Clara
        if (contacts !== null) {
            renderContacts(contacts);
        }
        return contacts;
    }

    // --------------------------------------------------------------------------
    // 4. BUBBLE PESAN & RIWAYAT OBROLAN (api/messages.php)
    // --------------------------------------------------------------------------

    function appendBubble(msg) {
        if (!messagesContainer || renderedMessageIds.has(msg.id)) return;
        renderedMessageIds.add(msg.id);
        lastMessageId = Math.max(lastMessageId, msg.id);

        const bubble = document.createElement('div');
        bubble.className = 'wa-message-bubble ' + (msg.is_mine ? 'wa-bubble-sent' : 'wa-bubble-received');
        bubble.dataset.messageId = msg.id;
        bubble.innerHTML = `
            <div>${escapeHtml(msg.text)}</div>
            <span class="wa-msg-meta">${escapeHtml(msg.time)} ${msg.is_mine ? statusIconHtml(msg.status, 'ms-1') : ''}</span>
        `;
        messagesContainer.appendChild(bubble);
    }

    function resetMessageState() {
        renderedMessageIds.clear();
        lastMessageId = 0;
        if (messagesContainer) messagesContainer.innerHTML = '';
    }

    function stopMessagePolling() {
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
    }

    function startMessagePolling() {
        stopMessagePolling();
        pollTimer = setInterval(async function () {
            if (document.hidden || !currentConversationId) return;
            const convId = currentConversationId;
            try {
                const newMessages = await fetchMessages(convId, lastMessageId);
                if (convId !== currentConversationId || !newMessages.length) return;
                newMessages.forEach(appendBubble);
                scrollToBottom();
            } catch (error) {
                console.warn('[Polling] Gagal mengambil pesan baru:', error.message);
            }
        }, POLL_MESSAGES_MS);
    }

    // --------------------------------------------------------------------------
    // 5. PEMILIHAN KONTAK OBROLAN (SWITCH ACTIVE CHAT)
    // --------------------------------------------------------------------------

    async function openChat(item) {
        const token = ++openToken;
        stopMessagePolling();

        chatListEl.querySelectorAll('.wa-chat-item').forEach(function (i) { i.classList.remove('active'); });
        item.classList.add('active');

        const contactName = item.getAttribute('data-contact') || 'Kontak';
        const contactPhone = item.getAttribute('data-phone') || '';
        const avatarElem = item.querySelector('.wa-avatar');

        if (currentChatName) currentChatName.textContent = contactName;
        if (currentChatAvatar && avatarElem) {
            currentChatAvatar.textContent = avatarElem.textContent.trim();
            currentChatAvatar.className = avatarElem.className;
        }

        const unreadBadge = item.querySelector('.badge.bg-success');
        if (unreadBadge) unreadBadge.remove();

        const contactId = Number(item.dataset.contactId) || null;

        // Item statis simulasi (bukan dari database): perilaku lama Clara
        if (!contactId) {
            activeContactId = null;
            currentConversationId = null;
            if (currentChatStatus) {
                if (contactName === 'Budi Santoso') currentChatStatus.textContent = 'online';
                else if (contactName === 'Clara Meylan') currentChatStatus.textContent = 'terakhir dilihat hari ini pukul 09:40';
                else if (contactName === 'Zaldy Firaz') currentChatStatus.textContent = 'terakhir dilihat kemarin pukul 21:15';
                else currentChatStatus.textContent = contactPhone || 'online';
            }
            return;
        }

        // Item dari database
        activeContactId = contactId;
        if (currentChatStatus) currentChatStatus.textContent = formatLastSeen(item.dataset.lastSeen);
        resetMessageState();
        currentConversationId = null;

        try {
            let conversationId = Number(item.dataset.conversationId) || null;
            if (!conversationId) {
                conversationId = await startConversation(contactId);
                item.dataset.conversationId = conversationId;
            }
            if (token !== openToken) return; // user sudah pindah chat

            const messages = await fetchMessages(conversationId);
            if (token !== openToken) return;

            currentConversationId = conversationId;
            messages.forEach(appendBubble);
            scrollToBottom();
            startMessagePolling();
        } catch (error) {
            console.warn('[Chat] Gagal membuka percakapan:', error.message);
        }
    }

    if (chatsPane) {
        chatsPane.addEventListener('click', function (e) {
            const item = e.target.closest('.wa-chat-item');
            if (item && chatsPane.contains(item)) {
                openChat(item);
            }
        });
    }

    // --------------------------------------------------------------------------
    // 6. PENGIRIMAN PESAN TEKS
    // --------------------------------------------------------------------------

    function updateSidebarPreview(text, timeStr, status) {
        const activeItem = document.querySelector('#chats-pane .wa-chat-item.active');
        if (!activeItem) return;

        const previewText = activeItem.querySelector('.text-secondary.text-truncate');
        const metaTime = activeItem.querySelector('.wa-msg-meta');

        if (previewText) {
            previewText.innerHTML = `${statusIconHtml(status || 'terkirim', 'me-1')}${escapeHtml(text)}`;
        }
        if (metaTime) {
            metaTime.textContent = timeStr;
            metaTime.classList.remove('text-success', 'fw-semibold');
        }
    }

    async function sendMessage() {
        if (!messageInput || !messagesContainer || isSending) return;

        const text = messageInput.value.trim();
        if (text === '') return;

        // Mode backend: percakapan dari database sedang terbuka
        if (currentConversationId) {
            isSending = true;
            messageInput.value = '';
            try {
                const saved = await postMessage(currentConversationId, text);
                appendBubble(saved);
                updateSidebarPreview(saved.text, saved.time, saved.status);
                scrollToBottom();
            } catch (error) {
                console.warn('[Chat] Gagal mengirim pesan:', error.message);
                messageInput.value = text; // kembalikan agar tidak hilang
            } finally {
                isSending = false;
                messageInput.focus();
            }
            return;
        }

        // Mode simulasi lokal (kontak statis / belum login)
        const timeStr = getCurrentTime();
        const bubble = document.createElement('div');
        bubble.className = 'wa-message-bubble wa-bubble-sent';
        bubble.innerHTML = `
            <div>${escapeHtml(text)}</div>
            <span class="wa-msg-meta">${timeStr} <i class="bi bi-check2 text-secondary ms-1" title="Terkirim"></i></span>
        `;
        messagesContainer.appendChild(bubble);

        messageInput.value = '';
        messageInput.focus();
        updateSidebarPreview(text, timeStr, 'terkirim');
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
    // 7. NAVIGASI TAB CHAT & STATUS DENGAN MODAL HELPER
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

    window.openStatusModal = function (statusItem) {
        const viewStatusModalEl = document.getElementById('viewStatusModal');
        if (!viewStatusModalEl || !window.bootstrap) return;

        const modalInstance = bootstrap.Modal.getOrCreateInstance(viewStatusModalEl);
        modalInstance.show(statusItem);
    };

    // --------------------------------------------------------------------------
    // 8. INISIALISASI: MUAT KONTAK & REFRESH BERKALA
    // --------------------------------------------------------------------------
    scrollToBottom();
    loadContacts();
    setInterval(function () {
        if (!document.hidden) loadContacts();
    }, REFRESH_CONTACTS_MS);
});