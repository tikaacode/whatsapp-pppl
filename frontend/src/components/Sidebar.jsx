import React, { memo } from 'react';
import {
  Aperture,
  Camera,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Settings,
  X,
} from 'lucide-react';
import {
  RetroAvatar,
  RetroCircleButton,
  RetroOrbButton,
  RetroWordmark,
  TickIcon,
} from './RetroUI';

export const Sidebar = memo(function Sidebar({
  mobileRightView,
  displayUserName,
  initials,
  hasProfilePhoto,
  profilePhotoPreview,
  activeTab,
  setActiveTab,
  rightPaneMode,
  searchQuery,
  setSearchQuery,
  isLoadingContacts,
  contacts,
  filteredContacts,
  activeChatId,
  totalUnread,
  hasUnseenStatus,
  myStatusPosted,
  myStatuses,
  latestMyStatus,
  recentStories,
  viewedStories,
  stories,
  onOpenChat,
  onOpenNewChat,
  onOpenSettings,
  onOpenMyStory,
  onOpenStory,
  onOpenStatusComposer,
}) {
  return (
    <aside
      className={`relative w-full md:w-[355px] lg:w-[385px] xl:w-[400px] shrink-0 h-full flex-col bg-white md:border-[1.5px] md:border-[#111300] md:shadow-[0_3px_0_#111300] md:rounded-[24px] overflow-hidden ${
        mobileRightView ? 'hidden md:flex' : 'flex'
      }`}
    >
      {/* Sidebar Header (Periwinkle Sky / Theme Header) */}
      <header className="y2k-sidebar-header-bg px-4 pt-3.5 pb-3 border-b-[1.5px] border-[#111300] flex items-center justify-between gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer text-left group"
        >
          <RetroAvatar
            initials={initials}
            seed={displayUserName}
            photoUrl={hasProfilePhoto ? profilePhotoPreview : ''}
            alt={displayUserName}
            size="md"
          />
          <div className="min-w-0">
            <RetroWordmark text="WhatsNew" size="md" />
            <div className="text-[11px] font-bold text-[#111300] truncate max-w-[175px] mt-0.5">
              {displayUserName} · Online
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <RetroCircleButton
            onClick={onOpenSettings}
            aria-label="Profil dan pengaturan"
            title="Profil, Tema & Akun"
          >
            <Settings className="w-4 h-4" strokeWidth={2.2} />
          </RetroCircleButton>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-3.5 py-2.5 border-b-[1.5px] border-[#111300] bg-[var(--y2k-paper-tint)] shrink-0">
        <div className="y2k-input rounded-full px-3.5 py-2 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-[#111300] shrink-0" strokeWidth={2.3} />
          <input
            id="chat-search-input"
            name="search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kontak atau percakapan..."
            className="w-full bg-transparent text-xs font-semibold text-[#111300] placeholder-[#767b70] focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Hapus pencarian"
              onClick={() => setSearchQuery('')}
              className="text-[#4c5146] hover:text-[#111300] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Chat / Status List */}
      <div
        id="sidebar-scroll-list"
        className="flex-1 overflow-y-auto no-scrollbar px-3 pt-2.5 pb-24 space-y-2 bg-white"
      >
        {activeTab === 'CHAT' ? (
          <div id="chat-list-container" className="space-y-2">
            {isLoadingContacts && contacts.length === 0 ? (
              <div className="text-center py-10 text-xs font-semibold text-[#767b70]">
                Memuat daftar percakapan...
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-10 text-xs font-semibold text-[#767b70]">
                {searchQuery ? 'Tidak ada percakapan yang cocok.' : 'Belum ada kontak tersedia.'}
              </div>
            ) : (
              filteredContacts.map((chat) => {
                const lastFromMessages =
                  Array.isArray(chat.messages) && chat.messages.length > 0
                    ? chat.messages[chat.messages.length - 1]
                    : null;
                const lastText = chat.lastMessageText || lastFromMessages?.text || '';
                const lastIsMine =
                  chat.lastMessageText !== undefined && chat.lastMessageText !== ''
                    ? chat.lastMessageIsMine
                    : lastFromMessages?.from === 'me';
                const lastTick =
                  chat.lastMessageText !== undefined && chat.lastMessageText !== ''
                    ? chat.lastMessageTick
                    : lastFromMessages?.tick || 'sent';
                const isSelected = activeChatId === chat.id && rightPaneMode === 'CHAT';

                return (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => onOpenChat(chat.id)}
                    className={`w-full p-3 flex items-center gap-3 text-left cursor-pointer active:scale-[0.99] ${
                      isSelected ? 'y2k-list-row-active' : 'y2k-list-row'
                    }`}
                  >
                    <RetroAvatar
                      initials={chat.initials}
                      seed={chat.contactId || chat.name}
                      size="md"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-[13.5px] font-bold text-[#111300] truncate">
                          {chat.name}
                        </h3>
                        <span
                          className={`text-[11px] shrink-0 ${
                            chat.unread > 0
                              ? 'font-extrabold text-[#111300]'
                              : 'font-semibold text-[#4c5146]'
                          }`}
                        >
                          {chat.time}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-[12px] text-[#4c5146] font-medium flex items-center gap-1 min-w-0 flex-1">
                          {lastText ? (
                            <>
                              {lastIsMine && <TickIcon tick={lastTick} />}
                              <span className="truncate">{lastText}</span>
                            </>
                          ) : (
                            <span className="italic text-[#767b70] truncate">
                              Belum ada pesan
                            </span>
                          )}
                        </p>

                        {chat.unread > 0 && (
                          <span
                            className="min-w-5 h-5 px-1.5 rounded-full border-[1.5px] border-[#111300] text-[#111300] text-[10.5px] font-extrabold flex items-center justify-center shrink-0"
                            style={{ backgroundColor: 'var(--y2k-badge-bg)' }}
                          >
                            {chat.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <div id="status-list-container" className="space-y-3.5">
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                if (myStatusPosted) {
                  onOpenMyStory();
                } else {
                  onOpenStatusComposer('teks');
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (myStatusPosted) onOpenMyStory();
                  else onOpenStatusComposer('teks');
                }
              }}
              className="w-full p-3 flex items-center gap-3 cursor-pointer y2k-list-row-active"
            >
              <div className="relative shrink-0">
                <div className={myStatusPosted ? 'y2k-status-ring' : ''}>
                  <RetroAvatar
                    initials={initials}
                    seed={displayUserName}
                    photoUrl={hasProfilePhoto ? profilePhotoPreview : ''}
                    size="md"
                  />
                </div>
                {!myStatusPosted && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-[1.5px] border-[#111300] text-[#111300] flex items-center justify-center"
                    style={{ backgroundColor: 'var(--y2k-badge-bg)' }}
                  >
                    <Plus className="w-3 h-3" strokeWidth={3} />
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-[13.5px] font-bold text-[#111300]">Status Saya</h3>
                <p className="text-[11.5px] font-medium text-[#4c5146] mt-0.5 truncate">
                  {myStatusPosted && latestMyStatus
                    ? `${latestMyStatus.time} · ${myStatuses.length} status · Dilihat ${latestMyStatus.viewersCount}`
                    : 'Ketuk untuk menambahkan status 24 jam'}
                </p>
              </div>

              {myStatusPosted && (
                <RetroCircleButton
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenStatusComposer('teks');
                  }}
                  aria-label="Tambah status baru"
                  className="w-8 h-8"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                </RetroCircleButton>
              )}
            </div>

            {recentStories.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#4c5146] px-1">
                  Pembaruan Terbaru
                </p>
                {recentStories.map((story) => (
                  <button
                    key={story.id}
                    type="button"
                    onClick={() => onOpenStory(story.id)}
                    className="w-full p-3 flex items-center gap-3 text-left cursor-pointer y2k-list-row"
                  >
                    <div className="y2k-status-ring shrink-0">
                      <RetroAvatar initials={story.initials} seed={story.name} size="md" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13.5px] font-bold text-[#111300] truncate">
                        {story.name}
                      </h4>
                      <p className="text-[11.5px] font-medium text-[#4c5146] mt-0.5">
                        {story.time}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {viewedStories.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#767b70] px-1">
                  Sudah Dilihat
                </p>
                {viewedStories.map((story) => (
                  <button
                    key={story.id}
                    type="button"
                    onClick={() => onOpenStory(story.id)}
                    className="w-full p-3 flex items-center gap-3 text-left cursor-pointer y2k-list-row"
                  >
                    <div className="y2k-status-ring-seen shrink-0">
                      <RetroAvatar initials={story.initials} seed={story.name} size="md" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13.5px] font-bold text-[#111300] truncate">
                        {story.name}
                      </h4>
                      <p className="text-[11.5px] font-medium text-[#767b70] mt-0.5">
                        {story.time}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {stories.length === 0 && (
              <div className="text-center py-8 text-xs font-semibold text-[#767b70]">
                Belum ada pembaruan status aktif dalam 24 jam terakhir.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Floating Y2K Glossy Dock */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between gap-2.5 pointer-events-none">
        <div className="pointer-events-auto flex-1 min-w-0 p-1.5 rounded-full bg-white border-[1.5px] border-[#111300] shadow-[0_3px_0_#111300] flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('CHAT')}
            className={`flex-1 min-w-0 py-2 px-3 rounded-full text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'CHAT'
                ? 'y2k-dock-tab-active'
                : 'text-[#4c5146] hover:text-[#111300] border-[1.5px] border-transparent'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={2.4} />
            <span>Chat</span>
            {totalUnread > 0 && (
              <span
                className="min-w-[18px] h-[18px] px-1 text-[10px] font-extrabold rounded-full border-[1.5px] border-[#111300] text-[#111300] flex items-center justify-center leading-none"
                style={{ backgroundColor: 'var(--y2k-badge-bg)' }}
              >
                {totalUnread}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STATUS')}
            className={`flex-1 min-w-0 py-2 px-3 rounded-full text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'STATUS'
                ? 'y2k-dock-tab-active'
                : 'text-[#4c5146] hover:text-[#111300] border-[1.5px] border-transparent'
            }`}
          >
            <Aperture className="w-3.5 h-3.5 shrink-0" strokeWidth={2.4} />
            <span>Status</span>
            {hasUnseenStatus && (
              <span
                className="w-2.5 h-2.5 rounded-full border-[1.5px] border-[#111300] shrink-0"
                style={{ backgroundColor: 'var(--y2k-gloss-4)' }}
              />
            )}
          </button>
        </div>

        {activeTab === 'CHAT' ? (
          <RetroOrbButton
            onClick={onOpenNewChat}
            aria-label="Mulai Obrolan Baru"
            title="Mulai Obrolan Baru"
            className="pointer-events-auto w-12 h-12"
          >
            <Plus className="w-5 h-5" strokeWidth={2.6} />
          </RetroOrbButton>
        ) : (
          <div className="flex items-center gap-2 pointer-events-auto shrink-0">
            <RetroCircleButton
              onClick={() => onOpenStatusComposer('teks')}
              aria-label="Buat status teks"
              title="Buat status teks"
              className="w-11 h-11 shadow-[0_2.5px_0_#111300]"
            >
              <Pencil className="w-4 h-4" strokeWidth={2.3} />
            </RetroCircleButton>

            <RetroOrbButton
              onClick={() => onOpenStatusComposer('gambar')}
              aria-label="Buat status media"
              title="Buat status gambar"
              className="w-12 h-12"
            >
              <Camera className="w-5 h-5" strokeWidth={2.3} />
            </RetroOrbButton>
          </div>
        )}
      </div>
    </aside>
  );
});
