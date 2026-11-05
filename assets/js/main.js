/**
 * WhatsApp Web Client Interactions
 * Frontend: Clara Uenike Meylan Langi (10241018)
 */

document.addEventListener('DOMContentLoaded', function () {
    const chatForm = document.getElementById('sendMessageForm');
    const messageInput = document.getElementById('messageInput');
    const messagesContainer = document.getElementById('messagesContainer');
    const chatItems = document.querySelectorAll('#chats-pane .wa-chat-item');
    const currentChatName = document.getElementById('currentChatName');
    const currentChatAvatar = document.getElementById('currentChatAvatar');

    // Helper: Escape karakter HTML
    function escapeHtml(text) {
        return text.replace(/[&<>"']/g, function (m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
        });
    }

    // 1. Kirim pesan instan (Enter / Klik Tombol Kirim)
    function handleSendMessage() {
        const text = messageInput.value.trim();
        if (text === '') return;

        const now = new Date();
        const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

        // Buat elemen bubble pesan terkirim
        const bubble = document.createElement('div');
        bubble.className = 'wa-message-bubble wa-bubble-sent';
        bubble.innerHTML = `<div>${escapeHtml(text)}</div><span class="wa-msg-meta">${timeStr} <i class="bi bi-check2 text-secondary ms-1" title="Terkirim"></i></span>`;

        messagesContainer.appendChild(bubble);
        messageInput.value = '';
        messageInput.focus();

        // Auto-scroll ke pesan terbawah
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Perbarui cuplikan pesan terakhir pada kontak aktif di sidebar
        const activeItem = document.querySelector('#chats-pane .wa-chat-item.active');
        if (activeItem) {
            const preview = activeItem.querySelector('.text-secondary.text-truncate');
            if (preview) preview.innerHTML = `<i class="bi bi-check2 text-secondary me-1"></i>${escapeHtml(text)}`;
        }
    }

    if (chatForm) {
        chatForm.addEventListener('submit', function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            handleSendMessage();
        });
    }

    // 2. Interaksi memilih kontak obrolan (Ubah kontak aktif)
    chatItems.forEach(item => {
        item.addEventListener('click', function () {
            chatItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            const contactName = this.getAttribute('data-contact');
            const avatarElem = this.querySelector('.wa-avatar');

            if (currentChatName && contactName) {
                currentChatName.textContent = contactName;
            }
            if (currentChatAvatar && avatarElem) {
                currentChatAvatar.textContent = avatarElem.textContent;
                currentChatAvatar.className = avatarElem.className;
            }

            // Hapus badge pesan belum dibaca saat kontak dibuka
            const badge = this.querySelector('.badge.bg-success');
            if (badge) badge.remove();
        });
    });

    // 3. Navigasi perpindahan tab (Chat dan Status)
    const chatsTab = document.getElementById('chats-tab');
    const statusTab = document.getElementById('status-tab');
    const chatsPane = document.getElementById('chats-pane');
    const statusPane = document.getElementById('status-pane');

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
});
