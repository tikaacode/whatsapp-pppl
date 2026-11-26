import React, { memo } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  Clock,
  Plus,
} from 'lucide-react';
import { COUNTRY_OPTIONS } from '../data/mockData';
import { Y2K_THEMES } from '../data/themes';
import {
  RetroCircleButton,
  RetroPillButton,
  RetroWordmark,
} from './RetroUI';

export const AuthFlow = memo(function AuthFlow({
  activeTheme,
  onSelectTheme,
  authStep,
  setAuthStep,
  countryIndex,
  setCountryIndex,
  showCountryPicker,
  setShowCountryPicker,
  selectedCountry,
  phoneNumber,
  setPhoneNumber,
  phoneError,
  setPhoneError,
  pendingPhone,
  otpDigits,
  otpRefs,
  otpTimerLabel,
  isSubmittingAuth,
  onRequestOtp,
  onOtpInput,
  onOtpKeyDown,
  onOtpPaste,
  onVerifyOtp,
  profileFileRef,
  hasProfilePhoto,
  setHasProfilePhoto,
  profilePhotoPreview,
  setProfilePhotoPreview,
  onProfilePhotoPick,
  profileName,
  setProfileName,
  onSaveInitialProfile,
}) {
  return (
    <div className="relative z-10 h-full w-full flex flex-col overflow-hidden">
      {/* Top Bar: Back button (OTP only) + Centered Y2K Theme Picker */}
      <header className="px-4 sm:px-6 pt-4 pb-2 flex items-center justify-between gap-3 shrink-0">
        <div className="w-10 flex items-center">
          {authStep === 'OTP' && (
            <RetroCircleButton
              onClick={() => setAuthStep('PHONE')}
              aria-label="Kembali ke input nomor telepon"
              className="w-9 h-9"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2.2} />
            </RetroCircleButton>
          )}
        </div>

        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white border-[1.5px] border-[#111300] shadow-[0_2.5px_0_#111300]"
          title="Pilih Tema Warna Y2K"
        >
          {Y2K_THEMES.map((t) => {
            const selected = activeTheme.id === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTheme(t)}
                title={`Tema ${t.label}`}
                aria-label={`Tema ${t.label}`}
                className={`w-5 h-5 rounded-full border-[1.5px] border-[#111300] cursor-pointer transition-transform ${
                  selected ? 'scale-115 ring-2 ring-[#111300]/25' : 'opacity-75 hover:opacity-100'
                }`}
                style={{ background: t.swatch }}
              />
            );
          })}
        </div>

        <div className="w-10" aria-hidden="true" />
      </header>

      {/* Main Centered Sky Hub Content */}
      <div className="flex-1 w-full flex flex-col items-center justify-center px-4 py-6 overflow-y-auto no-scrollbar gap-6">
        {/* Hero Wordmark with Orbital Ring */}
        <div className="text-center flex flex-col items-center">
          <RetroWordmark text="WhatsNew" orbit />
          <p className="text-[13px] font-bold text-[#111300] mt-3 max-w-md leading-relaxed">
            Verifikasi nomor telepon Anda untuk mulai chat real-time &amp; berbagi status 24 jam.
          </p>
        </div>

        {/* Interactive Form Card */}
        <div className="w-full max-w-[430px] y2k-modal-card rounded-[28px] p-5 sm:p-6">
          {authStep === 'PHONE' && (
            <div className="space-y-4">
              <div className="space-y-2.5">
                <label className="block text-[11.5px] font-extrabold uppercase tracking-wider text-[#4c5146]">
                  Negara &amp; Nomor Telepon
                </label>

                <button
                  type="button"
                  onClick={() => setShowCountryPicker((prev) => !prev)}
                  className="w-full y2k-input rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{selectedCountry.flag}</span>
                    <span className="text-sm font-bold text-[#111300]">
                      {selectedCountry.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#767b70]">
                    <span>{selectedCountry.code}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#111300] transition-transform ${
                        showCountryPicker ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {showCountryPicker && (
                  <div className="y2k-panel rounded-2xl p-1.5 space-y-1">
                    {COUNTRY_OPTIONS.map((c, idx) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setCountryIndex(idx);
                          setShowCountryPicker(false);
                        }}
                        className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-xs font-bold cursor-pointer ${
                          idx === countryIndex
                            ? 'y2k-list-row-active'
                            : 'text-[#111300] hover:bg-[var(--y2k-row-hover)]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{c.flag}</span>
                          <span>{c.label}</span>
                        </span>
                        <span>{c.code}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className="y2k-input rounded-2xl px-3.5 py-3 text-sm font-extrabold text-[#111300] bg-[var(--y2k-paper-tint)] shrink-0">
                    {selectedCountry.code}
                  </div>

                  <input
                    id="login-phone-input"
                    name="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      setPhoneError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        onRequestOtp(false);
                      }
                    }}
                    placeholder="812-3456-7890"
                    className={`flex-1 y2k-input rounded-2xl px-4 py-3 text-sm font-bold tracking-wide ${
                      phoneError ? '!border-rose-600' : ''
                    }`}
                  />
                </div>

                {phoneError ? (
                  <div className="rounded-xl border-[1.5px] border-rose-600 bg-rose-50 px-3.5 py-2 text-[11px] font-bold text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{phoneError}</span>
                  </div>
                ) : (
                  <p className="text-[11px] font-semibold text-[#767b70] px-1">
                    Kode OTP 6 digit akan dikirimkan untuk memverifikasi akun Anda.
                  </p>
                )}
              </div>

              <RetroPillButton
                serif
                disabled={isSubmittingAuth}
                onClick={() => onRequestOtp(false)}
                className="w-full py-3"
              >
                <span>{isSubmittingAuth ? 'Mengirim...' : 'Lanjut'}</span>
                <ArrowRight className="w-4 h-4" />
              </RetroPillButton>
            </div>
          )}

          {authStep === 'OTP' && (
            <div className="space-y-4">
              <p className="text-xs font-medium leading-relaxed text-[#4c5146] text-center">
                Masukkan kode 6 digit yang dikirimkan ke{' '}
                <strong className="font-extrabold text-[#111300]">{pendingPhone}</strong>.{' '}
                <button
                  type="button"
                  onClick={() => setAuthStep('PHONE')}
                  className="text-[#111300] font-extrabold underline underline-offset-2 cursor-pointer"
                >
                  Ubah nomor
                </button>
              </p>

              <div className="grid grid-cols-6 gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-digit-${idx}`}
                    name={`otp_${idx}`}
                    ref={(el) => {
                      otpRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                    maxLength={1}
                    value={digit}
                    onChange={(e) => onOtpInput(idx, e.target.value)}
                    onKeyDown={(e) => onOtpKeyDown(e, idx)}
                    onPaste={(e) => onOtpPaste(e, idx)}
                    aria-label={`Digit OTP ${idx + 1}`}
                    className="y2k-input h-12 rounded-2xl text-center text-lg font-extrabold bg-[var(--y2k-paper-tint)]"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-[11.5px] font-semibold text-[#767b70] px-1">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#111300]" />
                  Kirim ulang dalam <strong className="text-[#111300]">{otpTimerLabel}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => onRequestOtp(true)}
                  className="text-[#111300] font-extrabold underline underline-offset-2 cursor-pointer"
                >
                  Kirim ulang
                </button>
              </div>

              <RetroPillButton
                serif
                disabled={isSubmittingAuth}
                onClick={onVerifyOtp}
                className="w-full py-3"
              >
                {isSubmittingAuth ? 'Memverifikasi...' : 'Verifikasi'}
              </RetroPillButton>
            </div>
          )}

          {authStep === 'PROFILE' && (
            <div className="space-y-4">
              <p className="text-xs font-medium leading-relaxed text-[#4c5146] text-center">
                Lengkapi nama tampilan dan foto profil (opsional) untuk akun WhatsNew Anda.
              </p>

              <div className="flex flex-col items-center">
                <input
                  ref={profileFileRef}
                  type="file"
                  accept="image/*"
                  onChange={onProfilePhotoPick}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => profileFileRef.current?.click()}
                  className="relative w-24 h-24 rounded-full border-[1.5px] border-[#111300] y2k-bubble-in flex items-center justify-center overflow-hidden cursor-pointer"
                >
                  {hasProfilePhoto && profilePhotoPreview ? (
                    <img
                      src={profilePhotoPreview}
                      alt="Pratinjau foto profil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-8 h-8 text-[#111300]" />
                  )}
                  <span
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full border-[1.5px] border-[#111300] flex items-center justify-center"
                    style={{ backgroundColor: 'var(--y2k-badge-bg)' }}
                  >
                    {hasProfilePhoto ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (hasProfilePhoto) {
                      setHasProfilePhoto(false);
                      setProfilePhotoPreview('');
                    } else {
                      profileFileRef.current?.click();
                    }
                  }}
                  className="text-[11px] font-extrabold text-[#111300] underline mt-2.5 cursor-pointer"
                >
                  {hasProfilePhoto ? 'Hapus foto profil' : '+ Tambah Foto'}
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-[#4c5146] mb-1.5 px-1">
                  <label htmlFor="setup-profile-name">Nama Lengkap (Wajib)</label>
                  <span>{profileName.length}/50</span>
                </div>
                <input
                  id="setup-profile-name"
                  name="profile_name"
                  type="text"
                  maxLength={50}
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Masukkan nama Anda"
                  className="w-full y2k-input rounded-2xl px-4 py-3 text-sm font-bold"
                />
              </div>

              <RetroPillButton
                serif
                disabled={isSubmittingAuth}
                onClick={onSaveInitialProfile}
                className="w-full py-3"
              >
                {isSubmittingAuth ? 'Menyimpan...' : 'Simpan & Masuk'}
              </RetroPillButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
