import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ChevronLeft,
  Lock,
  MessageCircle,
  MessageSquarePlus,
  MoreVertical,
  Palette,
  Phone,
  User,
  X,
} from 'lucide-react';
import { Y2K_THEMES } from '../data/themes';
import {
  RetroAvatar,
  RetroCircleButton,
  RetroOrbButton,
  RetroPillButton,
  RetroWordmark,
  TickIcon,
} from './RetroUI';

/**
 * Group consecutive incoming messages from the other party so avatars & sender
 * labels match ui-references/new-ui-1.jpg cleanly.
 */
function groupMessages(messages) {
  const groups = [];
  for (let i = 0; i < messages.length; i += 1) {
    const msg = messages[i];
    const prev = groups[groups.length - 1];
    if (msg.from === 'them' && prev && prev.from === 'them') {
      prev.items.push(msg);
    } else if (msg.from === 'them') {
      groups.push({ from: 'them', key: `in-${msg.id}`, items: [msg] });
    } else {
      groups.push({ from: 'me', key: `out-${msg.id}`, items: [msg] });
    }
  }
  return groups;
}

const ChatComposer = memo(function ChatComposer({
  sendFill,
  isSending,
  onSendMessage,
}) {
  const [text, setText] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    setText('');
    const ok = await onSendMessage(trimmed);
    if (!ok) {
      setText(trimmed);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="px-3.5 md:px-5 py-3 shrink-0 border-t-[1.5px] border-[#111300] relative z-10"
      style={{ backgroundColor: 'var(--y2k-composer-bg)' }}
    >
      <div className="w-full rounded-full bg-white border-[1.5px] border-[#111300] pl-4 pr-2 py-1.5 flex items-center gap-2 focus-within:ring-2 focus-within:ring-[#111300]/15">
        <input
          id="chat-input-field"
          name="message"
          type="text"
          autoComplete="off"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ketik pesan terenkripsi..."
          className="w-full bg-transparent text-[14px] font-medium text-[#111300] placeholder-[#8b9085] focus:outline-none py-1"
        />

        <button
          type="submit"
          disabled={isSending || !text.trim()}
          aria-label="Kirim pesan"
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-transform hover:scale-105 active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed"
        >
          <svg
            width="23"
            height="23"
            viewBox="0 0 24 24"
            fill={sendFill}
            stroke="#111300"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        </button>
      </div>
    </form>
  );
});

export const ChatRoom = memo(function ChatRoom({
  activeContact,
  activeTheme,
  onSelectTheme,
  isLoadingMessages,
  isSendingMessage,
  onSendMessage,
  onMobileBack,
  onCloseChat,
  onOpenNewChat,
}) {
  const scrollRef = useRef(null);
  const menuRef = useRef(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);

  const messageGroups = useMemo(
    () => groupMessages(activeContact?.messages || []),
    [activeContact?.messages]
  );

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  useEffect(() => {
    scrollToBottom(false);
    setShowScrollDown(false);
    setShowChatMenu(false);
  }, [activeContact?.id, activeContact?.messages?.length, scrollToBottom]);

  useEffect(() => {
    if (!showChatMenu) return undefined;
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowChatMenu(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setShowChatMenu(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [showChatMenu]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollDown(distanceFromBottom > 120);
  }, []);

  if (!activeContact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white relative overflow-hidden">
        <div className="y2k-chat-header-bg absolute inset-x-0 top-0 h-28 pointer-events-none" />
        <div className="relative z-10 y2k-modal-card rounded-[28px] p-8 max-w-sm w-full text-center flex flex-col items-center gap-4">
          <RetroWordmark text="WhatsNew" orbit />
          <p className="text-xs font-medium leading-relaxed text-[#4c5146]">
            Pilih salah satu percakapan di sebelah kiri atau mulai obrolan baru untuk mengirim pesan terenkripsi end-to-end.
          </p>
          <RetroPillButton
            onClick={onOpenNewChat}
            className="w-full py-3 mt-1"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Mulai Obrolan Baru</span>
          </RetroPillButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white relative">
      {/* Top Smooth Gradient Header (new-ui-1.jpg, no scanlines) */}
      <header className="y2k-chat-header-bg px-3.5 md:px-5 pt-3.5 pb-5 shrink-0 flex items-center justify-between gap-3 relative z-20">
        <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
          <RetroCircleButton
            onClick={onMobileBack}
            aria-label="Kembali ke daftar chat"
            className="md:hidden"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2.2} />
          </RetroCircleButton>

          <RetroAvatar
            initials={activeContact.initials}
            seed={activeContact.contactId || activeContact.name}
            size="md"
          />

          <div className="min-w-0">
            <h2 className="text-[16px] md:text-[17px] font-extrabold tracking-tight text-[#111300] truncate leading-tight">
              {activeContact.name}
            </h2>
            <p
              className="text-[11px] font-semibold truncate mt-0.5"
              style={{
                color:
                  activeContact.statusText === 'Online'
                    ? 'var(--y2k-chat-hdr-sub)'
                    : 'var(--y2k-ink-soft)',
              }}
            >
              {activeContact.statusText}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 relative" ref={menuRef}>
          {/* Quick Y2K Theme Switcher Pill on Desktop */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white border-[1.5px] border-[#111300]"
            title="Ganti Tema Warna Y2K"
          >
            {Y2K_THEMES.map((t) => {
              const selected = t.id === activeTheme.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTheme(t)}
                  title={`Tema ${t.label}`}
                  aria-label={`Tema ${t.label}`}
                  className={`w-4 h-4 rounded-full border-[1.5px] border-[#111300] cursor-pointer transition-transform ${
                    selected ? 'scale-115 ring-2 ring-[#111300]/25' : 'opacity-75 hover:opacity-100'
                  }`}
                  style={{ background: t.swatch }}
                />
              );
            })}
          </div>

          <RetroCircleButton
            onClick={() => setShowChatMenu((prev) => !prev)}
            aria-label="Info kontak dan opsi chat"
            aria-expanded={showChatMenu}
            title="Info Kontak & Opsi Chat"
          >
            <MoreVertical className="w-4 h-4" strokeWidth={2.2} />
          </RetroCircleButton>

          {/* Chat-Specific Dropdown Menu (distinct from Sidebar Settings!) */}
          {showChatMenu && (
            <div className="absolute right-0 top-12 w-64 y2k-modal-card rounded-[22px] p-3.5 z-30 bg-white space-y-3">
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b-[1.5px] border-dashed border-[#111300]/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <RetroAvatar
                    initials={activeContact.initials}
                    seed={activeContact.contactId || activeContact.name}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-[#111300] truncate">
                      {activeContact.name}
                    </div>
                    <div className="text-[10.5px] font-semibold text-[#767b70] truncate">
                      {activeContact.statusText}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowChatMenu(false)}
                  aria-label="Tutup menu chat"
                  className="text-[#4c5146] hover:text-[#111300] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-[#4c5146] font-semibold">
                  <User className="w-3.5 h-3.5 text-[#111300] shrink-0" />
                  <span className="truncate">Info Kontak</span>
                </div>
                <div className="flex items-center gap-2 text-[#111300] font-bold pl-5">
                  <Phone className="w-3 h-3 text-[#4c5146] shrink-0" />
                  <span className="truncate">{activeContact.phone || 'Nomor tidak tersedia'}</span>
                </div>
              </div>

              <div className="pt-2.5 border-t-[1.5px] border-dashed border-[#111300]/20 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#4c5146]">
                  <Palette className="w-3 h-3 text-[#111300]" />
                  <span>Tema Warna</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {Y2K_THEMES.map((t) => {
                    const selected = t.id === activeTheme.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onSelectTheme(t)}
                        className={`p-1.5 rounded-xl flex flex-col items-center gap-1 cursor-pointer ${
                          selected ? 'y2k-list-row-active' : 'y2k-list-row'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full border-[1.5px] border-[#111300] block"
                          style={{ background: t.swatch }}
                        />
                        <span className="text-[9.5px] font-extrabold text-[#111300] leading-none">
                          {t.label.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowChatMenu(false);
                  if (onCloseChat) onCloseChat();
                }}
                className="w-full py-2 rounded-xl border-[1.5px] border-[#111300] bg-[var(--y2k-paper-tint)] hover:bg-[var(--y2k-row-hover)] text-xs font-extrabold text-[#111300] cursor-pointer"
              >
                Tutup Obrolan
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Scrollable Messages Area */}
      <div
        ref={scrollRef}
        id="chat-messages-scroll"
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar px-3.5 md:px-6 pt-1 pb-6 bg-white flex flex-col gap-3"
      >
        <div className="flex justify-center my-1">
          <div className="px-3.5 py-1.5 rounded-full border-[1.5px] border-dashed border-[#111300] bg-[var(--y2k-paper-tint)] max-w-[92%] md:max-w-[78%] text-center flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-[#111300] shrink-0" strokeWidth={2.3} />
            <span className="text-[11px] font-semibold leading-snug text-[#4c5146]">
              Pesan dienkripsi secara <strong className="text-[#111300]">end-to-end</strong>. Hanya Anda dan{' '}
              {activeContact.name} yang dapat membacanya.
            </span>
          </div>
        </div>

        {isLoadingMessages ? (
          <div className="my-auto text-center py-10">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-[1.5px] border-[#111300] bg-[var(--y2k-paper-tint)] text-xs font-bold text-[#111300]">
              Memuat pesan terenkripsi...
            </span>
          </div>
        ) : activeContact.messages.length === 0 ? (
          <div className="my-auto flex flex-col items-center justify-center text-center py-10 gap-2.5">
            <div className="w-12 h-12 rounded-full border-[1.5px] border-[#111300] y2k-bubble-in flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-[#111300]" />
            </div>
            <p className="text-xs font-bold text-[#111300]">
              Belum ada pesan dengan {activeContact.name}
            </p>
            <p className="text-[11.5px] text-[#767b70] max-w-xs">
              Ketik pesan pertama Anda di bawah untuk memulai percakapan terenkripsi.
            </p>
          </div>
        ) : (
          <div id="chat-messages-list" className="flex flex-col gap-3">
            {messageGroups.map((group) => {
              if (group.from === 'them') {
                return (
                  <div key={group.key} className="flex items-start gap-2.5">
                    <div className="pt-5 shrink-0">
                      <RetroAvatar
                        initials={activeContact.initials}
                        seed={activeContact.contactId || activeContact.name}
                        size="sm"
                      />
                    </div>

                    <div className="flex flex-col gap-2 min-w-0 max-w-[78%] md:max-w-[68%]">
                      <span className="text-[12px] font-bold text-[#111300] leading-none">
                        {activeContact.name}
                      </span>

                      {group.items.map((msg, idx) => {
                        const nextMsg = group.items[idx + 1];
                        const showTime = !nextMsg || nextMsg.time !== msg.time;
                        return (
                          <div key={msg.id} className="flex items-end gap-1.5">
                            <div className="y2k-bubble-in px-4 py-2.5 text-[14px] leading-[1.45] font-medium break-words">
                              {msg.text}
                            </div>
                            {showTime && msg.time && (
                              <span className="text-[11px] font-semibold text-[#767b70] shrink-0 pb-0.5">
                                {msg.time}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              const msg = group.items[0];
              return (
                <div key={group.key} className="flex justify-end items-end gap-1.5">
                  <div className="flex items-center gap-1 shrink-0 pb-0.5">
                    <TickIcon tick={msg.tick} />
                    {msg.time && (
                      <span className="text-[11px] font-semibold text-[#767b70]">
                        {msg.time}
                      </span>
                    )}
                  </div>

                  <div className="y2k-bubble-out max-w-[76%] md:max-w-[66%] px-4 py-2.5 text-[14px] leading-[1.45] font-medium break-words">
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Scroll-to-Bottom Glossy Orb (new-ui-1.jpg) */}
      {showScrollDown && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[78px] z-20 flex justify-center">
          <RetroOrbButton
            onClick={() => scrollToBottom(true)}
            aria-label="Gulir ke pesan terbaru"
            title="Ke pesan terbaru"
            className="pointer-events-auto w-10 h-10"
          >
            <ArrowDown className="w-5 h-5" strokeWidth={2.2} />
          </RetroOrbButton>
        </div>
      )}

      {/* Solid Neon Composer Bar (new-ui-1.jpg) */}
      <ChatComposer
        sendFill={activeTheme.sendFill}
        isSending={isSendingMessage}
        onSendMessage={onSendMessage}
      />
    </div>
  );
});
