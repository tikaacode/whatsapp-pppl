import React, { memo } from 'react';
import { LogOut, Palette, UserCheck, Users, X } from 'lucide-react';
import { getInitials } from '../data/mockData';
import { Y2K_THEMES } from '../data/themes';
import {
  RetroAvatar,
  RetroCircleButton,
  RetroPillButton,
} from './RetroUI';

export const NewChatModal = memo(function NewChatModal({
  open,
  contacts,
  onClose,
  onSelectContact,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#111300]/35 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="y2k-modal-card rounded-[26px] w-full max-w-md overflow-hidden">
        <div className="y2k-sidebar-header-bg px-5 py-3.5 border-b-[1.5px] border-[#111300] flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-[#111300]">Mulai Chat Baru</h3>
          <RetroCircleButton
            onClick={onClose}
            aria-label="Tutup daftar kontak"
            className="w-8 h-8"
          >
            <X className="w-4 h-4" strokeWidth={2.4} />
          </RetroCircleButton>
        </div>

        <div className="p-4 space-y-2 max-h-80 overflow-y-auto no-scrollbar bg-white">
          {contacts.length === 0 ? (
            <div className="text-center py-6 text-xs font-semibold text-[#767b70]">
              Belum ada kontak tersedia.
            </div>
          ) : (
            contacts.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectContact(c.id)}
                className="w-full p-2.5 y2k-list-row flex items-center gap-3 text-left cursor-pointer"
              >
                <RetroAvatar
                  initials={c.initials}
                  seed={c.contactId || c.name}
                  size="sm"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#111300] truncate">
                    {c.name}
                  </div>
                  <div className="text-[11px] font-medium text-[#767b70] truncate">
                    {c.phone || c.statusText}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
});

export const SettingsModal = memo(function SettingsModal({
  open,
  onClose,
  initials,
  displayUserName,
  hasProfilePhoto,
  profilePhotoPreview,
  phoneDisplay,
  settingsProfileName,
  setSettingsProfileName,
  isSavingProfile,
  onSaveProfile,
  activeThemeId,
  onSelectTheme,
  registeredAccounts,
  authUser,
  onSwitchAccount,
  onLogout,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#111300]/35 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="y2k-modal-card rounded-[26px] w-full max-w-md overflow-hidden max-h-[92dvh] flex flex-col">
        <div className="y2k-sidebar-header-bg px-5 py-3.5 border-b-[1.5px] border-[#111300] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <RetroAvatar
              initials={initials}
              seed={displayUserName}
              photoUrl={hasProfilePhoto ? profilePhotoPreview : ''}
              size="md"
            />
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-[#111300] truncate">
                Profil &amp; Pengaturan
              </h3>
              <p className="text-[11px] font-semibold text-[#111300]/80 truncate">
                {phoneDisplay || 'WhatsNew Account'}
              </p>
            </div>
          </div>

          <RetroCircleButton
            onClick={onClose}
            aria-label="Tutup pengaturan"
            className="w-8 h-8"
          >
            <X className="w-4 h-4" strokeWidth={2.4} />
          </RetroCircleButton>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto no-scrollbar bg-white">
          {/* Edit Nama Profil */}
          <form onSubmit={onSaveProfile} className="space-y-1.5">
            <label
              htmlFor="settings-profile-name"
              className="block text-[11px] font-extrabold uppercase tracking-wider text-[#4c5146]"
            >
              Nama Profil
            </label>
            <div className="flex items-center gap-2">
              <input
                id="settings-profile-name"
                name="settings_profile_name"
                type="text"
                maxLength={50}
                value={settingsProfileName}
                onChange={(e) => setSettingsProfileName(e.target.value)}
                placeholder="Nama tampilan Anda"
                className="flex-1 y2k-input px-3.5 py-2 rounded-2xl text-xs font-semibold"
              />
              <RetroPillButton
                type="submit"
                disabled={isSavingProfile}
                className="px-4 py-2 text-xs"
              >
                {isSavingProfile ? '...' : 'Simpan'}
              </RetroPillButton>
            </div>
          </form>

          {/* Tema Warna Y2K */}
          <div className="pt-3 border-t-[1.5px] border-dashed border-[#111300]/25 space-y-2.5">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#4c5146] flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[#111300]" />
              <span>Tema Warna Y2K</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {Y2K_THEMES.map((theme) => {
                const selected = activeThemeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onSelectTheme(theme)}
                    className={`p-2.5 rounded-2xl flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                      selected ? 'y2k-list-row-active' : 'y2k-list-row'
                    }`}
                  >
                    <span
                      className="w-8 h-8 rounded-full border-[1.5px] border-[#111300] block"
                      style={{ background: theme.swatch }}
                    />
                    <span className="text-[11px] font-extrabold text-[#111300] leading-tight">
                      {theme.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Beralih Akun Demo */}
          <div className="pt-3 border-t-[1.5px] border-dashed border-[#111300]/25 space-y-2">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#4c5146] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#111300]" />
              <span>Beralih Akun</span>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
              {registeredAccounts.map((u) => {
                const isCurrent =
                  authUser && Number(authUser.id_pengguna) === Number(u.id_pengguna);
                return (
                  <button
                    key={u.id_pengguna}
                    type="button"
                    onClick={() => onSwitchAccount(u)}
                    className={`w-full p-2 rounded-2xl flex items-center justify-between text-left cursor-pointer ${
                      isCurrent ? 'y2k-list-row-active' : 'y2k-list-row'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <RetroAvatar
                        initials={getInitials(u.nama_profil)}
                        seed={u.id_pengguna}
                        size="xs"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#111300] truncate">
                          {u.nama_profil}
                        </div>
                        <div className="text-[10px] font-semibold text-[#767b70]">
                          {u.no_telepon}
                        </div>
                      </div>
                    </div>
                    {isCurrent && (
                      <UserCheck
                        className="w-4 h-4 shrink-0"
                        style={{ color: 'var(--y2k-tick)' }}
                        strokeWidth={2.5}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Logout */}
          <RetroPillButton
            variant="danger"
            onClick={onLogout}
            className="w-full py-2.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar dari WhatsNew</span>
          </RetroPillButton>
        </div>
      </div>
    </div>
  );
});
