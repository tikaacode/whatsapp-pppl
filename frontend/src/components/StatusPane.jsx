import React, { memo } from 'react';
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Image as ImageIcon,
  Palette,
  Pencil,
  Plus,
  Send,
  Shield,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { STATUS_BACKGROUNDS } from '../data/mockData';
import {
  RetroAvatar,
  RetroCircleButton,
  RetroOrbButton,
  RetroPillButton,
} from './RetroUI';

const GALLERY_CARD_BG = [
  'linear-gradient(180deg, #ffff66 0%, #c7f778 100%)',
  'linear-gradient(180deg, #7ea3fa 0%, #dce7ff 100%)',
  'linear-gradient(180deg, #ffd6ec 0%, #fff2fa 100%)',
  'linear-gradient(180deg, #c6f7f2 0%, #eafdf9 100%)',
];

function getGalleryCardBackground(index, item) {
  if (item.jenis_status === 'media' && item.path_media) {
    return '#ffffff';
  }
  return GALLERY_CARD_BG[index % GALLERY_CARD_BG.length];
}

export const StatusGallery = memo(function StatusGallery({
  myStatuses,
  stories,
  statusPrivacyLabel,
  onOpenMyStory,
  onOpenStory,
  onOpenComposer,
  onOpenPrivacy,
}) {
  const allCards = [
    ...(myStatuses.length > 0
      ? [{ ...myStatuses[0], isMineCard: true, count: myStatuses.length }]
      : []),
    ...stories.map((s) => ({ ...s, isMineCard: false })),
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--y2k-paper-tint)]">
      {/* Smooth Theme Header */}
      <header className="y2k-chat-header-bg px-5 pt-4 pb-5 shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-extrabold tracking-tight text-[#111300] flex items-center gap-1.5">
            <span>Galeri Status 24 Jam</span>
            <Sparkles className="w-4 h-4 text-[#111300]" />
          </h2>
          <p className="text-[11.5px] font-semibold text-[#4c5146] mt-0.5">
            Ketuk kartu status untuk melihat atau buat pembaruan baru
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <RetroPillButton
            variant="silver"
            onClick={onOpenPrivacy}
            className="px-3.5 py-2 text-xs"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privasi: {statusPrivacyLabel}</span>
          </RetroPillButton>

          <RetroPillButton
            onClick={() => onOpenComposer('teks')}
            className="px-4 py-2 text-xs"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>+ Status Teks</span>
          </RetroPillButton>
        </div>
      </header>

      {/* Cards Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-6 pt-2">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {allCards.map((card, idx) => (
            <button
              key={card.isMineCard ? 'mine-latest' : card.id}
              type="button"
              onClick={() => (card.isMineCard ? onOpenMyStory() : onOpenStory(card.id))}
              className="y2k-panel rounded-[22px] overflow-hidden text-left cursor-pointer transition-transform hover:-translate-y-0.5 active:translate-y-0 flex flex-col"
            >
              <div
                className="h-40 p-4 border-b-[1.5px] border-[#111300] flex items-center justify-center text-center relative overflow-hidden"
                style={{ background: getGalleryCardBackground(idx, card) }}
              >
                {card.jenis_status === 'media' && card.path_media ? (
                  <img
                    src={card.path_media}
                    alt={card.content || 'Media status'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <p className="text-[15px] font-extrabold leading-snug text-[#111300] line-clamp-4">
                    “{card.content || 'Status media'}”
                  </p>
                )}
              </div>

              <div className="px-3.5 py-2.5 bg-white flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <RetroAvatar
                    initials={card.initials}
                    seed={card.name}
                    size="xs"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-[#111300] truncate">
                      {card.isMineCard ? 'Status Saya' : card.name}
                    </div>
                    <div className="text-[10.5px] font-semibold text-[#767b70] truncate">
                      {card.isMineCard
                        ? `${card.time} · ${card.count} status · ${card.viewersCount} dilihat`
                        : card.time}
                    </div>
                  </div>
                </div>

                {card.isMineCard ? (
                  <span
                    className="px-2.5 py-0.5 rounded-full border-[1.5px] border-[#111300] text-[10px] font-extrabold text-[#111300] shrink-0"
                    style={{ backgroundColor: 'var(--y2k-gloss-3)' }}
                  >
                    Milikku
                  </span>
                ) : !card.seen ? (
                  <span
                    className="px-2.5 py-0.5 rounded-full border-[1.5px] border-[#111300] text-[10px] font-extrabold text-[#111300] shrink-0"
                    style={{ backgroundColor: 'var(--y2k-badge-bg)' }}
                  >
                    Baru
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-[#767b70] shrink-0">
                    Dilihat
                  </span>
                )}
              </div>
            </button>
          ))}

          {/* Add New Status Dashed Card */}
          <div className="rounded-[22px] border-[1.5px] border-dashed border-[#111300] bg-white overflow-hidden flex flex-col">
            <div className="h-40 p-4 border-b-[1.5px] border-dashed border-[#111300] flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-3">
                <RetroOrbButton
                  onClick={() => onOpenComposer('teks')}
                  aria-label="Buat status teks"
                  className="w-12 h-12"
                >
                  <Plus className="w-5 h-5" strokeWidth={2.6} />
                </RetroOrbButton>
                <RetroCircleButton
                  onClick={() => onOpenComposer('gambar')}
                  aria-label="Buat status gambar"
                  className="w-12 h-12 shadow-[0_2.5px_0_#111300]"
                >
                  <Camera className="w-5 h-5" strokeWidth={2.2} />
                </RetroCircleButton>
              </div>
              <span className="text-xs font-extrabold text-[#111300]">
                Tambah Status Teks / Media
              </span>
            </div>
            <div className="px-3.5 py-2.5 text-center text-[11px] font-bold text-[#4c5146]">
              Aktif otomatis selama 24 jam
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export const StatusComposer = memo(function StatusComposer({
  statusMode,
  setStatusMode,
  statusBgIndex,
  setStatusBgIndex,
  statusText,
  setStatusText,
  statusCaption,
  setStatusCaption,
  statusMediaFileRef,
  statusMediaPreview,
  onMediaPick,
  statusPrivacyLabel,
  isPostingStatus,
  onPostStatus,
  onOpenPrivacy,
  onClose,
}) {
  const activeCreateBg = STATUS_BACKGROUNDS[statusBgIndex] || STATUS_BACKGROUNDS[0];

  return (
    <div
      className={`flex-1 flex flex-col justify-between p-5 md:p-6 relative overflow-hidden bg-gradient-to-br ${activeCreateBg.class} text-white`}
    >
      <div className="relative z-20 flex items-center justify-between gap-2">
        <RetroCircleButton onClick={onClose} aria-label="Tutup pembuat status">
          <X className="w-4 h-4" strokeWidth={2.4} />
        </RetroCircleButton>

        <div className="flex items-center gap-2">
          {statusMode === 'teks' && (
            <RetroPillButton
              variant="silver"
              onClick={() => setStatusBgIndex((i) => (i + 1) % STATUS_BACKGROUNDS.length)}
              className="px-3.5 py-1.5 text-xs"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Warna</span>
            </RetroPillButton>
          )}

          <RetroPillButton
            variant="silver"
            onClick={onOpenPrivacy}
            className="px-3.5 py-1.5 text-xs"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{statusPrivacyLabel}</span>
          </RetroPillButton>
        </div>
      </div>

      <div className="relative z-20 my-auto px-3 max-w-xl w-full mx-auto">
        {statusMode === 'teks' ? (
          <textarea
            id="status-text-input"
            name="status_text"
            rows={5}
            value={statusText}
            onChange={(e) => setStatusText(e.target.value)}
            placeholder="Ketik status Anda..."
            className="w-full bg-transparent text-center text-xl md:text-2xl font-bold leading-relaxed text-white placeholder-white/65 focus:outline-none resize-none"
          />
        ) : (
          <div className="y2k-modal-card rounded-[26px] p-5 text-center space-y-3 text-[#111300]">
            <input
              ref={statusMediaFileRef}
              type="file"
              accept="image/*"
              onChange={onMediaPick}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => statusMediaFileRef.current?.click()}
              className="w-full h-56 rounded-2xl border-[1.5px] border-dashed border-[#111300] bg-[var(--y2k-paper-tint)] flex flex-col items-center justify-center gap-2 overflow-hidden cursor-pointer relative"
            >
              {statusMediaPreview ? (
                <img
                  src={statusMediaPreview}
                  alt="Pratinjau gambar status"
                  className="w-full h-full object-contain"
                />
              ) : (
                <>
                  <ImageIcon className="w-10 h-10 text-[#111300]" />
                  <span className="text-xs font-extrabold text-[#111300]">
                    Ketuk untuk pilih gambar (JPG/PNG/WEBP)
                  </span>
                </>
              )}
            </button>
            <input
              id="status-caption-input"
              name="status_caption"
              type="text"
              value={statusCaption}
              onChange={(e) => setStatusCaption(e.target.value)}
              placeholder="Tambahkan keterangan..."
              className="w-full y2k-input rounded-full px-4 py-2 text-xs font-semibold text-center"
            />
          </div>
        )}
      </div>

      <div className="relative z-20 flex items-center justify-between gap-3">
        <div className="rounded-full bg-white border-[1.5px] border-[#111300] shadow-[0_2.5px_0_#111300] p-1 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setStatusMode('teks')}
            className={`px-4 py-1.5 rounded-full text-xs font-extrabold cursor-pointer ${
              statusMode === 'teks' ? 'y2k-dock-tab-active' : 'text-[#4c5146]'
            }`}
          >
            Teks
          </button>
          <button
            type="button"
            onClick={() => setStatusMode('gambar')}
            className={`px-4 py-1.5 rounded-full text-xs font-extrabold cursor-pointer ${
              statusMode === 'gambar' ? 'y2k-dock-tab-active' : 'text-[#4c5146]'
            }`}
          >
            Gambar
          </button>
        </div>

        <RetroOrbButton
          disabled={isPostingStatus}
          onClick={onPostStatus}
          aria-label="Bagikan status"
          className="w-12 h-12"
        >
          <Send className="w-5 h-5 -translate-x-px" />
        </RetroOrbButton>
      </div>
    </div>
  );
});

export const StatusPrivacyPane = memo(function StatusPrivacyPane({
  statusPrivacy,
  setStatusPrivacy,
  audienceOptionsList,
  selectedAudienceIds,
  onToggleAudienceContact,
  onBack,
  onSave,
}) {
  const options = [
    {
      id: 'semua_kontak',
      title: 'Kontak saya',
      desc: 'Bagikan pembaruan status dengan seluruh kontak Anda',
    },
    {
      id: 'kecuali_beberapa',
      title: 'Kontak saya kecuali...',
      desc: 'Sembunyikan status dari kontak tertentu yang dipilih',
    },
    {
      id: 'hanya_terpilih',
      title: 'Hanya bagikan dengan...',
      desc: 'Hanya tampilkan status kepada kontak yang dipilih saja',
    },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden bg-white">
      <header className="y2k-chat-header-bg px-5 pt-4 pb-5 shrink-0 flex items-center gap-3">
        <RetroCircleButton onClick={onBack} aria-label="Kembali">
          <ArrowLeft className="w-4 h-4" strokeWidth={2.4} />
        </RetroCircleButton>
        <div>
          <h2 className="text-[17px] font-extrabold text-[#111300]">Privasi Status</h2>
          <p className="text-[11px] font-semibold text-[#4c5146]">
            Atur siapa saja yang dapat melihat status 24 jam Anda
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-3">
        <div className="max-w-xl w-full mx-auto space-y-2.5 pb-4">
          {options.map((opt) => {
            const selected = statusPrivacy === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setStatusPrivacy(opt.id)}
                className={`w-full p-4 text-left flex items-start gap-3.5 cursor-pointer ${
                  selected ? 'y2k-list-row-active' : 'y2k-list-row'
                }`}
              >
                <div className="mt-0.5 w-5 h-5 rounded-full border-[1.5px] border-[#111300] bg-white flex items-center justify-center shrink-0">
                  {selected && <span className="w-2.5 h-2.5 rounded-full bg-[#111300]" />}
                </div>
                <div>
                  <div className="text-sm font-extrabold text-[#111300]">{opt.title}</div>
                  <div className="text-xs font-medium text-[#4c5146] mt-0.5 leading-relaxed">
                    {opt.desc}
                  </div>
                </div>
              </button>
            );
          })}

          {statusPrivacy !== 'semua_kontak' && (
            <div className="y2k-panel rounded-2xl p-4 space-y-2">
              <div className="text-[11px] font-extrabold text-[#111300] flex items-center justify-between">
                <span>
                  {statusPrivacy === 'kecuali_beberapa'
                    ? 'Pilih kontak yang dikecualikan:'
                    : 'Pilih kontak yang dapat melihat:'}
                </span>
                <span>{selectedAudienceIds.length} dipilih</span>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
                {audienceOptionsList.map((contact) => {
                  const checked = selectedAudienceIds.includes(contact.id);
                  return (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => onToggleAudienceContact(contact.id)}
                      className="w-full px-3 py-2 rounded-xl hover:bg-[var(--y2k-row-hover)] flex items-center justify-between text-left text-xs font-bold cursor-pointer"
                    >
                      <span className="truncate">{contact.name}</span>
                      <span
                        className="w-4 h-4 rounded border-[1.5px] border-[#111300] flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: checked ? 'var(--y2k-gloss-4)' : '#ffffff',
                        }}
                      >
                        {checked && <Check className="w-3 h-3 text-[#111300]" strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-4 border-t-[1.5px] border-[#111300] bg-white shrink-0">
        <div className="max-w-xl w-full mx-auto">
          <RetroPillButton serif onClick={onSave} className="w-full py-3">
            Selesai
          </RetroPillButton>
        </div>
      </div>
    </div>
  );
});

export const StoryViewerOverlay = memo(function StoryViewerOverlay({
  viewingStoryDeck,
  currentViewedStory,
  showViewersDrawer,
  setShowViewersDrawer,
  onPrev,
  onNext,
  onDelete,
  onClose,
}) {
  if (!currentViewedStory || !viewingStoryDeck) return null;

  return (
    <div
      onClick={() => {
        if (showViewersDrawer) {
          setShowViewersDrawer(false);
        } else {
          onClose();
        }
      }}
      style={
        currentViewedStory.hasKnownGradient === false && currentViewedStory.warna_latar
          ? { backgroundColor: currentViewedStory.warna_latar }
          : undefined
      }
      className={`absolute inset-0 z-40 ${
        currentViewedStory.hasKnownGradient !== false
          ? `bg-gradient-to-br ${currentViewedStory.gradient}`
          : ''
      } flex flex-col justify-between p-5 md:p-7 text-white cursor-pointer`}
    >
      <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5">
          {viewingStoryDeck.items.map((st, idx) => (
            <div key={st.id} className="flex-1 h-1.5 rounded-full bg-white/30 overflow-hidden">
              <div
                className={`h-full bg-[#FEFE00] rounded-full transition-all ${
                  idx <= viewingStoryDeck.index ? 'w-full' : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <RetroAvatar initials={currentViewedStory.initials} seed={currentViewedStory.name} size="sm" />
            <div className="min-w-0">
              <div className="text-xs font-extrabold truncate">{currentViewedStory.name}</div>
              <div className="text-[10.5px] text-white/85 font-semibold">
                {currentViewedStory.time} · Aktif 24 jam
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {viewingStoryDeck.isMine && viewingStoryDeck.items.length > 1 && (
              <>
                <RetroCircleButton aria-label="Status sebelumnya" onClick={onPrev} className="w-8 h-8">
                  <ChevronLeft className="w-4 h-4" />
                </RetroCircleButton>
                <RetroCircleButton aria-label="Status berikutnya" onClick={onNext} className="w-8 h-8">
                  <ChevronRight className="w-4 h-4" />
                </RetroCircleButton>
              </>
            )}

            {viewingStoryDeck.isMine && (
              <RetroCircleButton
                aria-label="Hapus status"
                onClick={onDelete}
                className="w-8 h-8 !bg-rose-200"
              >
                <Trash2 className="w-4 h-4" />
              </RetroCircleButton>
            )}

            <RetroCircleButton aria-label="Tutup status" onClick={onClose} className="w-8 h-8">
              <X className="w-4 h-4" />
            </RetroCircleButton>
          </div>
        </div>
      </div>

      <div className="my-auto text-center px-3 space-y-4 max-w-xl mx-auto w-full">
        {currentViewedStory.jenis_status === 'media' && currentViewedStory.path_media && (
          <div className="flex justify-center">
            <img
              src={currentViewedStory.path_media}
              alt="Media status"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
              className="max-h-72 rounded-2xl object-contain shadow-lg border-2 border-[#111300]"
            />
          </div>
        )}
        {currentViewedStory.content && (
          <p className="text-xl md:text-2xl font-bold leading-relaxed drop-shadow">
            {currentViewedStory.content}
          </p>
        )}
      </div>

      {viewingStoryDeck.isMine ? (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col items-center gap-2 max-w-md mx-auto w-full"
        >
          {showViewersDrawer && (
            <div className="w-full y2k-modal-card rounded-2xl p-3.5 max-h-40 overflow-y-auto no-scrollbar space-y-1.5 text-[#111300]">
              <div className="text-[11px] font-extrabold">
                Dilihat oleh ({currentViewedStory.viewersCount})
              </div>
              {currentViewedStory.viewers.length === 0 ? (
                <div className="text-[11px] text-[#767b70]">
                  Belum ada kontak yang melihat status ini.
                </div>
              ) : (
                currentViewedStory.viewers.map((v) => (
                  <div key={v.id_pengguna} className="flex items-center justify-between text-[11px]">
                    <span className="font-bold truncate">{v.nama_profil}</span>
                    <span className="text-[#767b70] shrink-0">{v.time_ago}</span>
                  </div>
                ))
              )}
            </div>
          )}
          <RetroPillButton
            variant="silver"
            onClick={() => setShowViewersDrawer((prev) => !prev)}
            className="px-4 py-1.5 text-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Dilihat oleh {currentViewedStory.viewersCount}</span>
          </RetroPillButton>
        </div>
      ) : (
        <div className="text-center text-[11px] font-semibold text-white/85">
          Ketuk di mana saja untuk menutup
        </div>
      )}
    </div>
  );
});
