import React, { useCallback, useDeferredValue, useEffect, useRef, useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import {
  COUNTRY_OPTIONS,
  DEMO_ACCOUNTS,
  STATUS_BACKGROUNDS,
  formatLastSeen,
  getAvatarGradient,
  getInitials,
  getStatusGradientByHex,
  mapBackendStatusToTick,
} from './data/mockData';
import { DEFAULT_Y2K_THEME_ID, Y2K_THEMES, getY2KTheme } from './data/themes';
import {
  checkSession,
  createStatusApi,
  deleteStatusApi,
  fetchContacts,
  fetchDemoUsers,
  fetchMessages,
  fetchStatusContacts,
  fetchStatusFeed,
  logoutUser,
  markStatusViewed,
  sendMessageApi,
  sendOtp,
  startConversation,
  switchDemoUser,
  updateProfile,
  verifyOtp,
} from './services/api';
import { RetroPillButton, RetroWordmark } from './components/RetroUI';
import { AuthFlow } from './components/AuthFlow';
import { Sidebar } from './components/Sidebar';
import { ChatRoom } from './components/ChatRoom';
import {
  StatusComposer,
  StatusGallery,
  StatusPrivacyPane,
  StoryViewerOverlay,
} from './components/StatusPane';
import { NewChatModal, SettingsModal } from './components/Modals';

const THEME_STORAGE_KEY = 'whatsnew_y2k_theme';

function loadSavedThemeId() {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && Y2K_THEMES.some((t) => t.id === saved)) {
      return saved;
    }
  } catch {
    // Ignore storage restriction
  }
  return DEFAULT_Y2K_THEME_ID;
}

function normalizeBackendContact(c, existingMessages = []) {
  const name = c.name || c.profile_name || 'Kontak';
  const last = c.last_message || null;
  return {
    id: String(c.contact_id),
    contactId: Number(c.contact_id),
    conversationId:
      c.conversation_id !== null && c.conversation_id !== undefined
        ? Number(c.conversation_id)
        : null,
    name,
    phone: c.phone || '',
    initials: getInitials(name),
    gradient: getAvatarGradient(c.contact_id || name),
    statusText: formatLastSeen(c.last_seen),
    time: last ? last.time : '',
    lastMessageText: last ? last.text : '',
    lastMessageIsMine: Boolean(last?.is_mine),
    lastMessageTick: last ? mapBackendStatusToTick(last.status) : 'sent',
    unread: Number(c.unread_count || 0),
    messages: existingMessages,
  };
}

function mapBackendMessage(m) {
  return {
    id: Number(m.id),
    from: m.is_mine ? 'me' : 'them',
    text: m.text || '',
    time: m.time || '',
    tick: mapBackendStatusToTick(m.status),
  };
}

function normalizeBackendStatusItem(item, seenOverride) {
  const name = item.nama_pengguna || 'Kontak';
  const hex = item.warna_latar || '#075e54';
  const gradient = getStatusGradientByHex(hex);
  return {
    id: `status-${item.id_status}`,
    id_status: Number(item.id_status),
    name,
    initials: getInitials(name),
    time: item.time_ago || 'Baru saja',
    seen: typeof seenOverride === 'boolean' ? seenOverride : Boolean(item.sudah_dilihat),
    jenis_status: item.jenis_status || 'teks',
    path_media: item.path_media || null,
    warna_latar: hex,
    gradient: gradient || 'from-emerald-700 via-teal-800 to-emerald-950',
    hasKnownGradient: Boolean(gradient),
    content: item.isi_status || '',
    viewersCount: Number(item.viewers_count || 0),
    viewers: Array.isArray(item.viewers) ? item.viewers : [],
  };
}

export default function App() {
  const otpRefs = useRef([]);
  const toastTimerRef = useRef(null);
  const smsTimerRef = useRef(null);
  const profileFileRef = useRef(null);
  const statusMediaFileRef = useRef(null);
  const openTokenRef = useRef(0);
  const lastMessageIdRef = useRef(0);
  const activeChatIdRef = useRef(null);

  // Y2K Light Color Theme State
  const [activeThemeId, setActiveThemeId] = useState(loadSavedThemeId);
  const activeTheme = getY2KTheme(activeThemeId);

  // Session & Auth State
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authStep, setAuthStep] = useState('PHONE'); // 'PHONE' | 'OTP' | 'PROFILE'
  const [authUser, setAuthUser] = useState(null);
  const [registeredAccounts, setRegisteredAccounts] = useState(DEMO_ACCOUNTS);

  // Login Form State
  const [countryIndex, setCountryIndex] = useState(0);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [pendingPhone, setPendingPhone] = useState('');

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpCountdown, setOtpCountdown] = useState(45);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [smsBanner, setSmsBanner] = useState({ visible: false, code: '', phone: '' });

  // Onboarding & Settings Profile State
  const [profileName, setProfileName] = useState('');
  const [settingsProfileName, setSettingsProfileName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [hasProfilePhoto, setHasProfilePhoto] = useState(false);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');

  // Workspace Layout & Navigation State
  const [activeTab, setActiveTab] = useState('CHAT'); // 'CHAT' | 'STATUS'
  const [rightPaneMode, setRightPaneMode] = useState('CHAT'); // 'CHAT' | 'STATUS_GALLERY' | 'STATUS_CREATE' | 'STATUS_PRIVACY'
  const [privacyReturnMode, setPrivacyReturnMode] = useState('STATUS_CREATE');
  const [mobileRightView, setMobileRightView] = useState(null); // null | 'CHAT' | 'STATUS_CREATE' | 'STATUS_PRIVACY' | 'STORY'
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Chats & Messages State
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [contacts, setContacts] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Status 24 Jam State
  const [stories, setStories] = useState([]);
  const [myStatuses, setMyStatuses] = useState([]);
  const [viewingStoryDeck, setViewingStoryDeck] = useState(null);
  const [showViewersDrawer, setShowViewersDrawer] = useState(false);

  const [statusMode, setStatusMode] = useState('teks');
  const [statusBgIndex, setStatusBgIndex] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [statusCaption, setStatusCaption] = useState('');
  const [statusMediaFile, setStatusMediaFile] = useState(null);
  const [statusMediaPreview, setStatusMediaPreview] = useState('');
  const [isPostingStatus, setIsPostingStatus] = useState(false);

  const [statusPrivacy, setStatusPrivacy] = useState('semua_kontak');
  const [statusContacts, setStatusContacts] = useState([]);
  const [selectedAudienceIds, setSelectedAudienceIds] = useState([]);

  const [toast, setToast] = useState({ visible: false, message: '' });

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const showToast = useCallback((message) => {
    setToast({ visible: true, message });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2800);
  }, []);

  const showSmsNotification = useCallback((code, phone) => {
    setSmsBanner({ visible: true, code, phone });
    clearTimeout(smsTimerRef.current);
    smsTimerRef.current = setTimeout(() => {
      setSmsBanner((prev) => ({ ...prev, visible: false }));
    }, 15000);
  }, []);

  const handleSelectTheme = useCallback(
    (theme) => {
      setActiveThemeId(theme.id);
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme.id);
      } catch {
        // Ignore storage error
      }
      showToast(`Tema diubah ke ${theme.label}`);
    },
    [showToast]
  );

  const handleSwitchTab = useCallback((tab) => {
    setActiveTab(tab);
    setViewingStoryDeck(null);
    if (tab === 'STATUS') {
      setRightPaneMode('STATUS_GALLERY');
    } else {
      setRightPaneMode('CHAT');
    }
  }, []);

  const selectedCountry = COUNTRY_OPTIONS[countryIndex] || COUNTRY_OPTIONS[0];
  const activeContact = contacts.find((c) => c.id === activeChatId) || null;
  const totalUnread = contacts.reduce((sum, c) => sum + (c.unread || 0), 0);
  const hasUnseenStatus = stories.some((s) => !s.seen);
  const myStatusPosted = myStatuses.length > 0;
  const latestMyStatus = myStatuses[0] || null;
  const displayUserName = (authUser && authUser.nama_profil) || profileName || 'Pengguna';
  const initials = getInitials(displayUserName);

  const privacyLabels = {
    semua_kontak: 'Kontak saya',
    kecuali_beberapa: 'Kontak kecuali...',
    hanya_terpilih: 'Kontak terpilih',
  };

  useEffect(() => {
    if (authStep !== 'OTP' || isAuthenticated || otpCountdown <= 0) return undefined;
    const id = setInterval(() => {
      setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [authStep, isAuthenticated, otpCountdown]);

  const loadBackendStatusFeed = useCallback(async () => {
    try {
      const feedRes = await fetchStatusFeed();
      const d = feedRes.data || {};
      const myList = Array.isArray(d.my_status)
        ? d.my_status.map((item) => normalizeBackendStatusItem(item, true))
        : [];
      const recentList = Array.isArray(d.recent_updates)
        ? d.recent_updates.map((item) => normalizeBackendStatusItem(item, false))
        : [];
      const viewedList = Array.isArray(d.viewed_updates)
        ? d.viewed_updates.map((item) => normalizeBackendStatusItem(item, true))
        : [];

      setMyStatuses(myList);
      setStories([...recentList, ...viewedList]);
    } catch {
      // Ignore transient refresh failure
    }
  }, []);

  const loadMessagesForContact = useCallback(
    async (contact, markUnreadZero = true) => {
      if (!contact) return;
      const token = ++openTokenRef.current;
      setIsLoadingMessages(true);
      try {
        let convId = contact.conversationId;
        if (!convId) {
          const startRes = await startConversation(contact.contactId);
          convId =
            Number(startRes.data?.conversation_id || startRes.data?.id_percakapan || 0) || null;
        }
        if (!convId || token !== openTokenRef.current) return;

        const msgRes = await fetchMessages(convId);
        if (token !== openTokenRef.current) return;

        const mapped = (Array.isArray(msgRes.data) ? msgRes.data : []).map(mapBackendMessage);
        lastMessageIdRef.current = mapped.length ? Math.max(...mapped.map((m) => m.id)) : 0;
        const lastMsg = mapped.length ? mapped[mapped.length - 1] : null;

        setContacts((prev) =>
          prev.map((c) =>
            c.id === contact.id
              ? {
                  ...c,
                  conversationId: convId,
                  unread: markUnreadZero ? 0 : c.unread,
                  time: lastMsg ? lastMsg.time : c.time,
                  lastMessageText: lastMsg ? lastMsg.text : c.lastMessageText,
                  lastMessageIsMine: lastMsg ? lastMsg.from === 'me' : c.lastMessageIsMine,
                  lastMessageTick: lastMsg ? lastMsg.tick : c.lastMessageTick,
                  messages: mapped,
                }
              : c
          )
        );
      } catch (err) {
        showToast(err.message || 'Gagal memuat riwayat percakapan');
      } finally {
        if (token === openTokenRef.current) {
          setIsLoadingMessages(false);
        }
      }
    },
    [showToast]
  );

  const loadWorkspaceData = useCallback(
    async ({ autoSelectFirst = false } = {}) => {
      setIsLoadingContacts(true);
      let loadedContacts = [];
      try {
        const contactsRes = await fetchContacts();
        const rows = Array.isArray(contactsRes.data) ? contactsRes.data : [];
        loadedContacts = rows.map((row) => normalizeBackendContact(row, []));
        setContacts((prev) => {
          const msgMap = new Map(prev.map((p) => [p.id, p.messages || []]));
          return loadedContacts.map((item) => ({
            ...item,
            messages: msgMap.get(item.id) || [],
          }));
        });
      } catch {
        // Keep current contacts
      } finally {
        setIsLoadingContacts(false);
      }

      if (autoSelectFirst && loadedContacts.length > 0) {
        const target =
          loadedContacts.find((c) => c.id === activeChatIdRef.current) || loadedContacts[0];
        setActiveChatId(target.id);
        loadMessagesForContact(target, false);
      } else if (
        loadedContacts.length > 0 &&
        (!activeChatIdRef.current || !loadedContacts.some((c) => c.id === activeChatIdRef.current))
      ) {
        const first = loadedContacts[0];
        setActiveChatId(first.id);
        loadMessagesForContact(first, false);
      }

      await loadBackendStatusFeed();

      try {
        const statusContactsRes = await fetchStatusContacts();
        if (Array.isArray(statusContactsRes.data)) {
          setStatusContacts(statusContactsRes.data);
        }
      } catch {
        // Optional
      }
    },
    [loadBackendStatusFeed, loadMessagesForContact]
  );

  // Initial session check on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const usersRes = await fetchDemoUsers();
        if (!cancelled && Array.isArray(usersRes.data) && usersRes.data.length > 0) {
          setRegisteredAccounts(usersRes.data);
        }
      } catch {
        // Ignore if unavailable
      }

      try {
        const me = await checkSession();
        if (!cancelled && me.authenticated && me.data) {
          setAuthUser(me.data);
          setProfileName(me.data.nama_profil || '');
          setSettingsProfileName(me.data.nama_profil || '');
          setIsAuthenticated(true);
          await loadWorkspaceData({ autoSelectFirst: true });
        }
      } catch {
        // Unauthenticated stays on login flow
      } finally {
        if (!cancelled) {
          setIsCheckingSession(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadWorkspaceData]);

  // Background refresh for contacts & statuses while authenticated
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const id = setInterval(() => {
      if (!document.hidden) {
        loadWorkspaceData();
      }
    }, 10000);
    return () => clearInterval(id);
  }, [isAuthenticated, loadWorkspaceData]);

  // Refresh status feed whenever switching to Status tab
  useEffect(() => {
    if (isAuthenticated && activeTab === 'STATUS') {
      loadBackendStatusFeed();
    }
  }, [isAuthenticated, activeTab, loadBackendStatusFeed]);

  // Real-time message polling for active conversation
  useEffect(() => {
    if (!isAuthenticated || rightPaneMode !== 'CHAT' || !activeContact?.conversationId) {
      return undefined;
    }
    const convId = activeContact.conversationId;
    const targetContactId = activeContact.id;

    const id = setInterval(async () => {
      if (document.hidden || !convId) return;
      try {
        const res = await fetchMessages(convId, lastMessageIdRef.current);
        const rawList = Array.isArray(res.data) ? res.data : [];
        const readSet = new Set(Array.isArray(res.read_ids) ? res.read_ids.map(Number) : []);
        const deliveredSet = new Set(
          Array.isArray(res.delivered_ids) ? res.delivered_ids.map(Number) : []
        );

        const incoming = rawList.map(mapBackendMessage);
        if (incoming.length > 0) {
          lastMessageIdRef.current = Math.max(
            lastMessageIdRef.current,
            ...incoming.map((m) => m.id)
          );
        }

        if (incoming.length === 0 && readSet.size === 0 && deliveredSet.size === 0) {
          return;
        }

        setContacts((prev) =>
          prev.map((c) => {
            if (c.id !== targetContactId) return c;

            let receiptsChanged = false;
            const updatedExisting = c.messages.map((m) => {
              if (m.from !== 'me') return m;
              const nextTick = readSet.has(m.id)
                ? 'read'
                : deliveredSet.has(m.id) && m.tick === 'sent'
                ? 'delivered'
                : m.tick;
              if (nextTick !== m.tick) {
                receiptsChanged = true;
                return { ...m, tick: nextTick };
              }
              return m;
            });

            const seenIds = new Set(updatedExisting.map((m) => m.id));
            const fresh = incoming.filter((m) => !seenIds.has(m.id));
            if (fresh.length === 0 && !receiptsChanged) return c;

            const merged = [...updatedExisting, ...fresh];
            const lastItem = merged[merged.length - 1];
            return {
              ...c,
              time: lastItem?.time || c.time,
              lastMessageText: lastItem ? lastItem.text : c.lastMessageText,
              lastMessageIsMine: lastItem ? lastItem.from === 'me' : c.lastMessageIsMine,
              lastMessageTick: lastItem ? lastItem.tick : c.lastMessageTick,
              messages: merged,
            };
          })
        );
      } catch {
        // Ignore transient poll error
      }
    }, 3000);

    return () => clearInterval(id);
  }, [isAuthenticated, rightPaneMode, activeContact?.conversationId, activeContact?.id]);

  // Auth handlers
  const requestOtpCode = async (isResend = false) => {
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    if (digitsOnly.length < 8) {
      setPhoneError('Nomor telepon tidak valid. Masukkan minimal 8 digit.');
      return;
    }

    const formattedFullPhone = `${selectedCountry.code} ${phoneNumber.trim()}`;
    const rawApiPhone = `${selectedCountry.code}${digitsOnly}`;
    setPendingPhone(formattedFullPhone);
    setPhoneError('');
    setIsSubmittingAuth(true);

    try {
      const res = await sendOtp(rawApiPhone);
      const data = res.data || {};
      const otpCode = data.otp_debug ? String(data.otp_debug).slice(0, 6) : '';
      if (otpCode) {
        setOtpDigits(otpCode.split(''));
        showSmsNotification(otpCode, formattedFullPhone);
      } else {
        showToast(isResend ? 'Kode OTP baru dikirim' : 'Kode verifikasi dikirim via SMS');
      }
      setOtpCountdown(45);
      setAuthStep('OTP');
    } catch (err) {
      const msg = err.message || 'Gagal mengirim kode verifikasi.';
      if (err.status === 400) {
        setPhoneError(msg);
      } else {
        showToast(msg);
      }
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleOtpInput = (idx, val) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[idx] = clean;
      return next;
    });
    if (clean && otpRefs.current[idx + 1]) {
      otpRefs.current[idx + 1].focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      setOtpDigits((prev) => {
        const next = [...prev];
        next[idx - 1] = '';
        return next;
      });
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e, startIdx) => {
    const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
    if (!pasted) return;
    e.preventDefault();
    setOtpDigits((prev) => {
      const next = [...prev];
      for (let i = 0; i < pasted.length && startIdx + i < 6; i += 1) {
        next[startIdx + i] = pasted[i];
      }
      return next;
    });
    const focusIdx = Math.min(5, startIdx + pasted.length);
    otpRefs.current[focusIdx]?.focus();
  };

  const handleVerifyOtp = async () => {
    const code = otpDigits.join('');
    if (code.length < 6) {
      showToast('Lengkapi 6 digit kode OTP');
      return;
    }

    const digitsOnly = phoneNumber.replace(/\D/g, '');
    const rawApiPhone = `${selectedCountry.code}${digitsOnly}`;
    setIsSubmittingAuth(true);

    try {
      const res = await verifyOtp(rawApiPhone, code);
      const userData = res.data || {};
      setSmsBanner({ visible: false, code: '', phone: '' });
      setAuthUser(userData);

      if (userData.is_new_user) {
        setProfileName('');
        setHasProfilePhoto(false);
        setProfilePhotoPreview('');
        setAuthStep('PROFILE');
      } else {
        setProfileName(userData.nama_profil || '');
        setSettingsProfileName(userData.nama_profil || '');
        setIsAuthenticated(true);
        setActiveTab('CHAT');
        setRightPaneMode('CHAT');
        setMobileRightView(null);
        await loadWorkspaceData({ autoSelectFirst: true });
        showToast(`Selamat datang di WhatsNew, ${userData.nama_profil || 'Pengguna'}`);
      }
    } catch (err) {
      showToast(err.message || 'Kode OTP tidak valid.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleProfilePhotoPick = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProfilePhotoPreview(String(ev.target?.result || ''));
      setHasProfilePhoto(true);
      showToast('Foto profil dipilih');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveInitialProfile = async () => {
    const trimmed = profileName.trim();
    if (!trimmed) {
      showToast('Nama profil wajib diisi');
      return;
    }

    setIsSubmittingAuth(true);
    try {
      const res = await updateProfile(trimmed);
      if (res.data) {
        setAuthUser(res.data);
        setProfileName(res.data.nama_profil || trimmed);
        setSettingsProfileName(res.data.nama_profil || trimmed);
      }
      setIsAuthenticated(true);
      setActiveTab('CHAT');
      setRightPaneMode('CHAT');
      setMobileRightView(null);
      await loadWorkspaceData({ autoSelectFirst: true });
      showToast('Profil berhasil disimpan');
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan profil');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleUpdateSettingsProfile = async (e) => {
    e.preventDefault();
    const trimmed = settingsProfileName.trim();
    if (!trimmed) {
      showToast('Nama profil wajib diisi');
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await updateProfile(trimmed);
      if (res.data) {
        setAuthUser(res.data);
        setProfileName(res.data.nama_profil || trimmed);
        setSettingsProfileName(res.data.nama_profil || trimmed);
        setRegisteredAccounts((prev) =>
          prev.map((acc) =>
            Number(acc.id_pengguna) === Number(res.data.id_pengguna)
              ? { ...acc, nama_profil: res.data.nama_profil || trimmed }
              : acc
          )
        );
      }
      showToast('Nama profil diperbarui');
    } catch (err) {
      showToast(err.message || 'Gagal memperbarui profil');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSwitchAccount = async (user) => {
    setShowSettingsModal(false);
    try {
      const res = await switchDemoUser(user.id_pengguna);
      if (res.success && res.data) {
        setAuthUser(res.data);
        setProfileName(res.data.nama_profil || '');
        setSettingsProfileName(res.data.nama_profil || '');
        setActiveChatId(null);
        setContacts([]);
        setActiveTab('CHAT');
        setRightPaneMode('CHAT');
        setMobileRightView(null);
        await loadWorkspaceData({ autoSelectFirst: true });
        showToast(`Beralih ke ${res.data.nama_profil}`);
      }
    } catch (err) {
      showToast(err.message || 'Gagal beralih akun');
    }
  };

  const handleLogout = async () => {
    setShowSettingsModal(false);
    try {
      await logoutUser();
    } catch {
      // Clear local session regardless
    }
    setIsAuthenticated(false);
    setAuthUser(null);
    setAuthStep('PHONE');
    setOtpDigits(['', '', '', '', '', '']);
    setSmsBanner({ visible: false, code: '', phone: '' });
    setContacts([]);
    setActiveChatId(null);
    setStories([]);
    setMyStatuses([]);
    setViewingStoryDeck(null);
    setActiveTab('CHAT');
    setRightPaneMode('CHAT');
    setMobileRightView(null);
    showToast('Anda telah keluar dari WhatsNew');
  };

  // Chat handlers
  const openChat = useCallback(
    async (contactId) => {
      const target = contacts.find((c) => c.id === contactId);
      if (!target) return;
      setActiveChatId(contactId);
      setContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, unread: 0 } : c)));
      setShowNewChatModal(false);
      setViewingStoryDeck(null);
      setActiveTab('CHAT');
      setRightPaneMode('CHAT');
      setMobileRightView('CHAT');
      await loadMessagesForContact(target, true);
    },
    [contacts, loadMessagesForContact]
  );

  const handleCloseChat = useCallback(() => {
    setActiveChatId(null);
    setMobileRightView(null);
  }, []);

  const handleSendMessage = useCallback(
    async (rawText) => {
      if (!activeContact || isSendingMessage) return false;
      const text = String(rawText || '').trim();
      if (!text) return false;

      setIsSendingMessage(true);
      const targetId = activeContact.id;

      try {
        let convId = activeContact.conversationId;
        if (!convId) {
          const startRes = await startConversation(activeContact.contactId);
          convId = Number(startRes.data?.conversation_id || startRes.data?.id_percakapan || 0);
        }
        const sendRes = await sendMessageApi(convId, text);
        const saved = mapBackendMessage(sendRes.data);
        lastMessageIdRef.current = Math.max(lastMessageIdRef.current, saved.id);

        setContacts((prev) =>
          prev.map((c) => {
            if (c.id !== targetId) return c;
            const exists = c.messages.some((m) => m.id === saved.id);
            return {
              ...c,
              conversationId: convId,
              time: saved.time || c.time,
              lastMessageText: saved.text,
              lastMessageIsMine: true,
              lastMessageTick: saved.tick,
              messages: exists ? c.messages : [...c.messages, saved],
            };
          })
        );
        return true;
      } catch (err) {
        showToast(err.message || 'Gagal mengirim pesan');
        return false;
      } finally {
        setIsSendingMessage(false);
      }
    },
    [activeContact, isSendingMessage, showToast]
  );

  // Status 24h handlers
  const openStory = useCallback(
    async (storyId) => {
      const target = stories.find((s) => s.id === storyId);
      if (!target) return;

      setShowViewersDrawer(false);
      setViewingStoryDeck({
        items: [{ ...target, seen: true }],
        index: 0,
        isMine: false,
      });
      setMobileRightView('STORY');
      setStories((prev) => prev.map((s) => (s.id === storyId ? { ...s, seen: true } : s)));

      if (target.id_status) {
        try {
          await markStatusViewed(target.id_status);
        } catch {
          // Non-blocking
        }
      }
    },
    [stories]
  );

  const openMyStory = useCallback(() => {
    if (!myStatuses.length) return;
    setShowViewersDrawer(false);
    setViewingStoryDeck({
      items: myStatuses,
      index: 0,
      isMine: true,
    });
    setMobileRightView('STORY');
  }, [myStatuses]);

  const closeStoryViewer = useCallback(() => {
    setShowViewersDrawer(false);
    setViewingStoryDeck(null);
    if (mobileRightView === 'STORY') {
      setMobileRightView(null);
    }
  }, [mobileRightView]);

  const openStatusComposer = useCallback((mode = 'teks') => {
    setStatusMode(mode);
    setViewingStoryDeck(null);
    setRightPaneMode('STATUS_CREATE');
    setMobileRightView('STATUS_CREATE');
  }, []);

  const openStatusPrivacy = useCallback((returnTo) => {
    setPrivacyReturnMode(returnTo);
    setRightPaneMode('STATUS_PRIVACY');
    setMobileRightView('STATUS_PRIVACY');
  }, []);

  const handleDeleteCurrentMyStatus = async () => {
    if (!viewingStoryDeck || !viewingStoryDeck.isMine) return;
    const currentItem = viewingStoryDeck.items[viewingStoryDeck.index];
    if (!currentItem || !currentItem.id_status) return;

    try {
      await deleteStatusApi(currentItem.id_status);
      showToast('Status dihapus');
    } catch (err) {
      showToast(err.message || 'Gagal menghapus status');
      return;
    }

    const remaining = myStatuses.filter((s) => s.id !== currentItem.id);
    setMyStatuses(remaining);
    setShowViewersDrawer(false);
    if (remaining.length === 0) {
      closeStoryViewer();
    } else {
      setViewingStoryDeck({
        items: remaining,
        index: Math.min(viewingStoryDeck.index, remaining.length - 1),
        isMine: true,
      });
    }
  };

  const handleStatusMediaPick = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      setStatusMediaFile(null);
      setStatusMediaPreview('');
      return;
    }
    setStatusMediaFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setStatusMediaPreview(String(ev.target?.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const handlePostStatus = async () => {
    const activeBg = STATUS_BACKGROUNDS[statusBgIndex] || STATUS_BACKGROUNDS[0];
    const isMedia = statusMode !== 'teks';
    const contentText = isMedia ? statusCaption.trim() : statusText.trim();

    if (!isMedia && !contentText) {
      showToast('Isi teks status tidak boleh kosong');
      return;
    }
    if (isMedia && !statusMediaFile && !contentText) {
      showToast('Pilih gambar atau tuliskan keterangan status');
      return;
    }

    setIsPostingStatus(true);
    try {
      await createStatusApi({
        jenis_status: isMedia ? 'media' : 'teks',
        isi_status: contentText,
        warna_latar: activeBg.hex,
        privasi: statusPrivacy,
        audiens_ids: selectedAudienceIds,
        mediaFile: isMedia ? statusMediaFile : null,
      });
      await loadBackendStatusFeed();
      setStatusText('');
      setStatusCaption('');
      setStatusMediaFile(null);
      setStatusMediaPreview('');
      setActiveTab('STATUS');
      setRightPaneMode('STATUS_GALLERY');
      setMobileRightView(null);
      showToast('Status dibagikan dan aktif selama 24 jam');
    } catch (err) {
      showToast(err.message || 'Gagal membagikan status');
    } finally {
      setIsPostingStatus(false);
    }
  };

  const toggleAudienceContact = (contactUserId) => {
    const idNum = Number(contactUserId);
    setSelectedAudienceIds((prev) =>
      prev.includes(idNum) ? prev.filter((item) => item !== idNum) : [...prev, idNum]
    );
  };

  const openSettings = useCallback(() => {
    setSettingsProfileName(displayUserName);
    setShowSettingsModal(true);
  }, [displayUserName]);

  const filteredContacts = contacts.filter((c) => {
    const q = deferredSearchQuery.toLowerCase().trim();
    if (!q) return true;
    const lastFromMessages =
      Array.isArray(c.messages) && c.messages.length > 0
        ? c.messages[c.messages.length - 1].text || ''
        : '';
    const lastText = c.lastMessageText || lastFromMessages;
    return c.name.toLowerCase().includes(q) || lastText.toLowerCase().includes(q);
  });

  const audienceOptionsList =
    statusContacts.length > 0
      ? statusContacts.map((sc) => ({
          id: Number(sc.id_pengguna_kontak),
          name: sc.nama_kontak || sc.nama_profil,
          phone: sc.no_telepon || '',
        }))
      : contacts.map((c) => ({
          id: c.contactId,
          name: c.name,
          phone: c.phone,
        }));

  const recentStories = stories.filter((s) => !s.seen);
  const viewedStories = stories.filter((s) => s.seen);
  const currentViewedStory = viewingStoryDeck
    ? viewingStoryDeck.items[viewingStoryDeck.index] || null
    : null;
  const otpTimerLabel = `00:${String(otpCountdown).padStart(2, '0')}`;

  return (
    <div
      id="wa-app-stage"
      data-y2k-theme={activeTheme.id}
      className="y2k-stage-bg relative h-[100dvh] max-h-[100dvh] w-full overflow-hidden select-none text-[#111300]"
    >
      {/* Incoming SMS Notification Banner */}
      {smsBanner.visible && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md y2k-modal-card rounded-2xl p-3.5 flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-full border-[1.5px] border-[#111300] flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--y2k-badge-bg)' }}
          >
            <MessageSquare className="w-4 h-4 text-[#111300]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#111300]">
                Pesan SMS · Baru Saja
              </span>
              <button
                type="button"
                aria-label="Tutup notifikasi SMS"
                onClick={() => setSmsBanner((prev) => ({ ...prev, visible: false }))}
                className="text-[#4c5146] hover:text-[#111300] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-[#4c5146] mt-0.5 leading-snug">
              WhatsNew: Kode verifikasi Anda adalah{' '}
              <strong className="tracking-wider font-extrabold text-[#111300]">
                {smsBanner.code}
              </strong>
              . Jangan bagikan kode ini kepada siapa pun.
            </p>
            <RetroPillButton
              onClick={() => {
                setOtpDigits(String(smsBanner.code).slice(0, 6).split(''));
                setSmsBanner((prev) => ({ ...prev, visible: false }));
              }}
              className="mt-2 px-3 py-1 text-[11px]"
            >
              Isi Otomatis
            </RetroPillButton>
          </div>
        </div>
      )}

      {/* Non-Intrusive Y2K Toast */}
      <div
        className={`pointer-events-none fixed left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-white border-[1.5px] border-[#111300] shadow-[0_3px_0_#111300] text-xs font-extrabold text-[#111300] transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
          smsBanner.visible ? 'top-28' : 'top-4'
        } ${toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'}`}
      >
        <span
          className="w-2.5 h-2.5 rounded-full border-[1.5px] border-[#111300]"
          style={{ backgroundColor: 'var(--y2k-gloss-4)' }}
        />
        <span>{toast.message}</span>
      </div>

      {isCheckingSession ? (
        <div className="relative z-10 h-full w-full flex items-center justify-center p-4">
          <div className="y2k-modal-card rounded-[26px] px-8 py-6 flex flex-col items-center gap-3">
            <RetroWordmark text="WhatsNew" orbit />
            <span className="text-xs font-extrabold text-[#4c5146]">
              Memuat WhatsNew...
            </span>
          </div>
        </div>
      ) : !isAuthenticated ? (
        <AuthFlow
          activeTheme={activeTheme}
          onSelectTheme={handleSelectTheme}
          authStep={authStep}
          setAuthStep={setAuthStep}
          countryIndex={countryIndex}
          setCountryIndex={setCountryIndex}
          showCountryPicker={showCountryPicker}
          setShowCountryPicker={setShowCountryPicker}
          selectedCountry={selectedCountry}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          phoneError={phoneError}
          setPhoneError={setPhoneError}
          pendingPhone={pendingPhone}
          otpDigits={otpDigits}
          otpRefs={otpRefs}
          otpTimerLabel={otpTimerLabel}
          isSubmittingAuth={isSubmittingAuth}
          onRequestOtp={requestOtpCode}
          onOtpInput={handleOtpInput}
          onOtpKeyDown={handleOtpKeyDown}
          onOtpPaste={handleOtpPaste}
          onVerifyOtp={handleVerifyOtp}
          profileFileRef={profileFileRef}
          hasProfilePhoto={hasProfilePhoto}
          setHasProfilePhoto={setHasProfilePhoto}
          profilePhotoPreview={profilePhotoPreview}
          setProfilePhotoPreview={setProfilePhotoPreview}
          onProfilePhotoPick={handleProfilePhotoPick}
          profileName={profileName}
          setProfileName={setProfileName}
          onSaveInitialProfile={handleSaveInitialProfile}
        />
      ) : (
        /* Authenticated Responsive Split-Pane WhatsNew Workspace */
        <div className="relative z-10 w-full h-full max-w-[1440px] mx-auto p-0 md:p-3.5 lg:p-5 flex flex-col md:flex-row gap-0 md:gap-4 overflow-hidden">
          <Sidebar
            mobileRightView={mobileRightView}
            displayUserName={displayUserName}
            initials={initials}
            hasProfilePhoto={hasProfilePhoto}
            profilePhotoPreview={profilePhotoPreview}
            activeTab={activeTab}
            setActiveTab={handleSwitchTab}
            rightPaneMode={rightPaneMode}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isLoadingContacts={isLoadingContacts}
            contacts={contacts}
            filteredContacts={filteredContacts}
            activeChatId={activeChatId}
            totalUnread={totalUnread}
            hasUnseenStatus={hasUnseenStatus}
            myStatusPosted={myStatusPosted}
            myStatuses={myStatuses}
            latestMyStatus={latestMyStatus}
            recentStories={recentStories}
            viewedStories={viewedStories}
            stories={stories}
            onOpenChat={openChat}
            onOpenNewChat={() => setShowNewChatModal(true)}
            onOpenSettings={openSettings}
            onOpenMyStory={openMyStory}
            onOpenStory={openStory}
            onOpenStatusComposer={openStatusComposer}
          />

          {/* Right Workspace Pane */}
          <main
            className={`flex-1 h-full min-w-0 flex-col bg-white md:border-[1.5px] md:border-[#111300] md:shadow-[0_3px_0_#111300] md:rounded-[24px] overflow-hidden relative ${
              mobileRightView ? 'flex' : 'hidden md:flex'
            }`}
          >
            {rightPaneMode === 'CHAT' && (
              <ChatRoom
                activeContact={activeContact}
                activeTheme={activeTheme}
                onSelectTheme={handleSelectTheme}
                isLoadingMessages={isLoadingMessages}
                isSendingMessage={isSendingMessage}
                onSendMessage={handleSendMessage}
                onMobileBack={() => setMobileRightView(null)}
                onCloseChat={handleCloseChat}
                onOpenNewChat={() => setShowNewChatModal(true)}
              />
            )}

            {rightPaneMode === 'STATUS_GALLERY' && (
              <StatusGallery
                myStatuses={myStatuses}
                stories={stories}
                statusPrivacyLabel={privacyLabels[statusPrivacy]}
                onOpenMyStory={openMyStory}
                onOpenStory={openStory}
                onOpenComposer={openStatusComposer}
                onOpenPrivacy={() => openStatusPrivacy('STATUS_GALLERY')}
              />
            )}

            {rightPaneMode === 'STATUS_CREATE' && (
              <StatusComposer
                statusMode={statusMode}
                setStatusMode={setStatusMode}
                statusBgIndex={statusBgIndex}
                setStatusBgIndex={setStatusBgIndex}
                statusText={statusText}
                setStatusText={setStatusText}
                statusCaption={statusCaption}
                setStatusCaption={setStatusCaption}
                statusMediaFileRef={statusMediaFileRef}
                statusMediaPreview={statusMediaPreview}
                onMediaPick={handleStatusMediaPick}
                statusPrivacyLabel={privacyLabels[statusPrivacy]}
                isPostingStatus={isPostingStatus}
                onPostStatus={handlePostStatus}
                onOpenPrivacy={() => openStatusPrivacy('STATUS_CREATE')}
                onClose={() => {
                  setRightPaneMode(activeTab === 'STATUS' ? 'STATUS_GALLERY' : 'CHAT');
                  setMobileRightView(null);
                }}
              />
            )}

            {rightPaneMode === 'STATUS_PRIVACY' && (
              <StatusPrivacyPane
                statusPrivacy={statusPrivacy}
                setStatusPrivacy={setStatusPrivacy}
                audienceOptionsList={audienceOptionsList}
                selectedAudienceIds={selectedAudienceIds}
                onToggleAudienceContact={toggleAudienceContact}
                onBack={() => {
                  setRightPaneMode(privacyReturnMode);
                  setMobileRightView(privacyReturnMode === 'STATUS_CREATE' ? 'STATUS_CREATE' : null);
                }}
                onSave={() => {
                  showToast('Pengaturan privasi disimpan');
                  setRightPaneMode(privacyReturnMode);
                  setMobileRightView(privacyReturnMode === 'STATUS_CREATE' ? 'STATUS_CREATE' : null);
                }}
              />
            )}

            <StoryViewerOverlay
              viewingStoryDeck={viewingStoryDeck}
              currentViewedStory={currentViewedStory}
              showViewersDrawer={showViewersDrawer}
              setShowViewersDrawer={setShowViewersDrawer}
              onPrev={() =>
                setViewingStoryDeck((d) => ({
                  ...d,
                  index: (d.index - 1 + d.items.length) % d.items.length,
                }))
              }
              onNext={() =>
                setViewingStoryDeck((d) => ({
                  ...d,
                  index: (d.index + 1) % d.items.length,
                }))
              }
              onDelete={handleDeleteCurrentMyStatus}
              onClose={closeStoryViewer}
            />
          </main>
        </div>
      )}

      <NewChatModal
        open={showNewChatModal}
        contacts={contacts}
        onClose={() => setShowNewChatModal(false)}
        onSelectContact={openChat}
      />

      <SettingsModal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        initials={initials}
        displayUserName={displayUserName}
        hasProfilePhoto={hasProfilePhoto}
        profilePhotoPreview={profilePhotoPreview}
        phoneDisplay={authUser?.no_telepon || pendingPhone}
        settingsProfileName={settingsProfileName}
        setSettingsProfileName={setSettingsProfileName}
        isSavingProfile={isSavingProfile}
        onSaveProfile={handleUpdateSettingsProfile}
        activeThemeId={activeTheme.id}
        onSelectTheme={handleSelectTheme}
        registeredAccounts={registeredAccounts}
        authUser={authUser}
        onSwitchAccount={handleSwitchAccount}
        onLogout={handleLogout}
      />
    </div>
  );
}
