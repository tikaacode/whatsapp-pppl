import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Aperture,
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Image as ImageIcon,
  Lock,
  LogOut,
  MessageCircle,
  MessageSquare,
  MessageSquarePlus,
  Moon,
  Palette,
  Pencil,
  Plus,
  Search,
  Send,
  Shield,
  SlidersHorizontal,
  Sun,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import {
  COUNTRY_OPTIONS,
  DEMO_ACCOUNTS,
  STATUS_BACKGROUNDS,
  WALLPAPERS,
  formatLastSeen,
  getAvatarGradient,
  getInitials,
  getStatusGradientByHex,
  mapBackendStatusToTick,
} from './data/mockData';
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
import { WallpaperLayer } from './components/WallpaperLayer';
import { MaterialGlass, StageGlass } from './components/StageGlass';

function TickIcon({ tick }) {
  if (tick === 'read') {
    return <CheckCheck className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 shrink-0" />;
  }
  if (tick === 'delivered') {
    return <CheckCheck className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />;
  }
  return <Check className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />;
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
  const stageRef = useRef(null);
  const chatScrollRef = useRef(null);
  const otpRefs = useRef([]);
  const toastTimerRef = useRef(null);
  const smsTimerRef = useRef(null);
  const profileFileRef = useRef(null);
  const statusMediaFileRef = useRef(null);
  const openTokenRef = useRef(0);
  const lastMessageIdRef = useRef(0);
  const activeChatIdRef = useRef(null);

  const [isDark, setIsDark] = useState(true);
  const [activeWallpaperId, setActiveWallpaperId] = useState('pure-mesh');

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
  const [rightPaneMode, setRightPaneMode] = useState('CHAT'); // 'CHAT' | 'STATUS_CREATE' | 'STATUS_PRIVACY'
  const [mobileRightView, setMobileRightView] = useState(null); // null | 'CHAT' | 'STATUS_CREATE' | 'STATUS_PRIVACY' | 'STORY'
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Chats & Messages State
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatInput, setChatInput] = useState('');
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
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

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

  const selectedCountry = COUNTRY_OPTIONS[countryIndex] || COUNTRY_OPTIONS[0];
  const wallpaper = WALLPAPERS.find((w) => w.id === activeWallpaperId) || WALLPAPERS[4];
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

  useEffect(() => {
    if (rightPaneMode === 'CHAT' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [rightPaneMode, activeContact?.messages?.length]);

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

  const loadMessagesForContact = useCallback(async (contact, markUnreadZero = true) => {
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
  }, [showToast]);

  const loadWorkspaceData = useCallback(
    async ({ autoSelectFirst = false } = {}) => {
      setIsLoadingContacts(true);
      let loadedContacts = [];
      try {
        const contactsRes = await fetchContacts();
        const rows = Array.isArray(contactsRes.data) ? contactsRes.data : [];
        setContacts((prev) => {
          const msgMap = new Map(prev.map((p) => [p.id, p.messages || []]));
          const mapped = rows.map((row) =>
            normalizeBackendContact(row, msgMap.get(String(row.contact_id)) || [])
          );
          loadedContacts = mapped;
          return mapped;
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
        if (rawList.length === 0) return;
        const incoming = rawList.map(mapBackendMessage);
        lastMessageIdRef.current = Math.max(
          lastMessageIdRef.current,
          ...incoming.map((m) => m.id)
        );
        setContacts((prev) =>
          prev.map((c) => {
            if (c.id !== targetContactId) return c;
            const seenIds = new Set(c.messages.map((m) => m.id));
            const fresh = incoming.filter((m) => !seenIds.has(m.id));
            if (fresh.length === 0) return c;
            const lastItem = fresh[fresh.length - 1];
            return {
              ...c,
              time: lastItem.time || c.time,
              lastMessageText: lastItem.text,
              lastMessageIsMine: lastItem.from === 'me',
              lastMessageTick: lastItem.tick,
              messages: [...c.messages, ...fresh],
            };
          })
        );
      } catch {
        // Ignore transient poll error
      }
    }, 3000);

    return () => clearInterval(id);
  }, [isAuthenticated, rightPaneMode, activeContact?.conversationId, activeContact?.id]);

  const handleSelectWallpaper = (wp) => {
    setActiveWallpaperId(wp.id);
    showToast(`Wallpaper diubah ke ${wp.label.split(' (')[0]}`);
  };

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
      for (let i = 0; i < pasted.length && startIdx + i < 6; i++) {
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
        setRightPaneMode('CHAT');
        setMobileRightView(null);
        await loadWorkspaceData({ autoSelectFirst: true });
        showToast(`Selamat datang, ${userData.nama_profil || 'Pengguna'}`);
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
    setRightPaneMode('CHAT');
    setMobileRightView(null);
    showToast('Anda telah keluar dari WhatsApp');
  };

  const openChat = async (contactId) => {
    const target = contacts.find((c) => c.id === contactId);
    if (!target) return;
    setActiveChatId(contactId);
    setContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, unread: 0 } : c)));
    setShowNewChatModal(false);
    setViewingStoryDeck(null);
    setRightPaneMode('CHAT');
    setMobileRightView('CHAT');
    await loadMessagesForContact(target, true);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!activeContact || isSendingMessage) return;
    const text = chatInput.trim();
    if (!text) return;

    setIsSendingMessage(true);
    setChatInput('');
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
    } catch (err) {
      setChatInput(text);
      showToast(err.message || 'Gagal mengirim pesan');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const openStory = async (storyId) => {
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
  };

  const openMyStory = () => {
    if (!myStatuses.length) return;
    setShowViewersDrawer(false);
    setViewingStoryDeck({
      items: myStatuses,
      index: 0,
      isMine: true,
    });
    setMobileRightView('STORY');
  };

  const closeStoryViewer = () => {
    setShowViewersDrawer(false);
    setViewingStoryDeck(null);
    if (mobileRightView === 'STORY') {
      setMobileRightView(null);
    }
  };

  const openStatusComposer = (mode = 'teks') => {
    setStatusMode(mode);
    setViewingStoryDeck(null);
    setRightPaneMode('STATUS_CREATE');
    setMobileRightView('STATUS_CREATE');
  };

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
      setRightPaneMode('CHAT');
      setMobileRightView(null);
      setActiveTab('STATUS');
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

  const filteredContacts = contacts.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
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
  const activeCreateBg = STATUS_BACKGROUNDS[statusBgIndex] || STATUS_BACKGROUNDS[0];
  const otpTimerLabel = `00:${String(otpCountdown).padStart(2, '0')}`;

  return (
    <div
      id="wa-app-stage"
      ref={stageRef}
      data-glass-stage="true"
      className="relative h-[100dvh] max-h-[100dvh] w-full overflow-hidden select-none text-slate-900 dark:text-slate-100"
    >
      <WallpaperLayer wallpaper={wallpaper} isDark={isDark} />

      {/* Incoming SMS Notification Banner */}
      {smsBanner.visible && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md rounded-2xl p-3.5 bg-white/85 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/70 dark:border-white/15 shadow-2xl flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Pesan SMS · Baru Saja
              </span>
              <button
                type="button"
                aria-label="Tutup notifikasi SMS"
                onClick={() => setSmsBanner((prev) => ({ ...prev, visible: false }))}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-100 mt-0.5 leading-snug">
              WhatsApp: Kode verifikasi Anda adalah{' '}
              <strong className="tracking-wider font-bold text-slate-950 dark:text-white">
                {smsBanner.code}
              </strong>
              . Jangan bagikan kode ini kepada siapa pun.
            </p>
            <button
              type="button"
              onClick={() => {
                setOtpDigits(String(smsBanner.code).slice(0, 6).split(''));
                setSmsBanner((prev) => ({ ...prev, visible: false }));
              }}
              className="mt-2 px-3 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-semibold cursor-pointer hover:bg-emerald-600 transition-colors"
            >
              Isi Otomatis
            </button>
          </div>
        </div>
      )}

      {/* Non-Intrusive Toast Notification */}
      <div
        className={`pointer-events-none fixed left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-900/85 backdrop-blur-xl border border-white/60 dark:border-white/15 text-xs font-medium text-slate-900 dark:text-white shadow-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
          smsBanner.visible ? 'top-28' : 'top-4'
        } ${toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'}`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>{toast.message}</span>
      </div>

      {isCheckingSession ? (
        <div className="relative z-10 h-full w-full flex items-center justify-center p-4">
          <StageGlass
            stageRef={stageRef}
            wallpaper={wallpaper}
            isDark={isDark}
            variant="elevated"
            radius={28}
            className="px-7 py-6"
            innerClassName="flex flex-col items-center gap-3"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg">
              <MessageCircle className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              Memuat WhatsApp...
            </span>
          </StageGlass>
        </div>
      ) : !isAuthenticated ? (
        /* Unauthenticated Full-Screen Onboarding Flow */
        <div className="relative z-10 h-full w-full flex flex-col overflow-hidden">
          <div className="px-4 pt-4 flex justify-end items-center gap-2 shrink-0">
            <div
              className="rounded-full p-1 flex items-center gap-1 bg-white/45 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/15 shadow-sm"
              title="Pilih Wallpaper Latar"
            >
              {WALLPAPERS.map((wp) => {
                const active = activeWallpaperId === wp.id;
                return (
                  <button
                    key={wp.id}
                    type="button"
                    onClick={() => handleSelectWallpaper(wp)}
                    title={wp.label}
                    aria-label={`Wallpaper ${wp.label}`}
                    className={`w-5 h-5 rounded-full bg-gradient-to-br ${wp.swatch} transition-all cursor-pointer flex items-center justify-center ${
                      active
                        ? 'ring-2 ring-emerald-500 ring-offset-1 ring-offset-white/70 dark:ring-offset-slate-900 scale-105'
                        : 'opacity-75 hover:opacity-100'
                    }`}
                  >
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-white shadow" />}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsDark((d) => !d)}
              aria-label="Ubah Tema Terang atau Gelap"
              className="rounded-full p-1 flex items-center gap-1 cursor-pointer bg-white/45 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/15 shadow-sm active:scale-95 transition-transform"
            >
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${
                  !isDark ? 'bg-white/90 text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Terang</span>
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${
                  isDark ? 'bg-white/15 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gelap</span>
              </span>
            </button>
          </div>

          <div className="flex-1 w-full flex items-center justify-center p-4 overflow-y-auto no-scrollbar">
            <div className="w-full max-w-[420px] rounded-[32px] p-6 sm:p-7 bg-white/22 dark:bg-black/38 backdrop-blur-xl border border-white/50 dark:border-white/15 shadow-2xl">
              {authStep === 'PHONE' && (
                <div className="space-y-6">
                  <div>
                    <StageGlass
                      stageRef={stageRef}
                      wallpaper={wallpaper}
                      isDark={isDark}
                      variant="emeraldOrb"
                      radius={28}
                      className="w-14 h-14 mb-5"
                      innerClassName="flex items-center justify-center text-white"
                    >
                      <MessageCircle className="w-7 h-7" />
                    </StageGlass>

                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white wallpaper-text-crisp">
                      Masuk ke WhatsApp
                    </h1>
                    <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 mt-2 wallpaper-text-crisp">
                      Verifikasi nomor telepon Anda untuk mulai mengirim pesan terenkripsi end-to-end dan berbagi status.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <StageGlass
                      as="button"
                      type="button"
                      stageRef={stageRef}
                      wallpaper={wallpaper}
                      isDark={isDark}
                      variant="card"
                      radius={16}
                      onClick={() => setShowCountryPicker((prev) => !prev)}
                      className="w-full cursor-pointer"
                      innerClassName="px-4 py-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{selectedCountry.flag}</span>
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                          {selectedCountry.label}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform ${
                          showCountryPicker ? 'rotate-180' : ''
                        }`}
                      />
                    </StageGlass>

                    {showCountryPicker && (
                      <StageGlass
                        stageRef={stageRef}
                        wallpaper={wallpaper}
                        isDark={isDark}
                        variant="elevated"
                        radius={16}
                        className="w-full"
                        innerClassName="p-1.5 flex-col items-stretch space-y-1"
                      >
                        {COUNTRY_OPTIONS.map((c, idx) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                              setCountryIndex(idx);
                              setShowCountryPicker(false);
                            }}
                            className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-xs cursor-pointer ${
                              idx === countryIndex
                                ? 'bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 font-semibold'
                                : 'text-slate-800 dark:text-slate-200 hover:bg-white/30 dark:hover:bg-white/10'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span>{c.flag}</span>
                              <span>{c.label}</span>
                            </span>
                            <span className="text-slate-500 dark:text-slate-400">{c.code}</span>
                          </button>
                        ))}
                      </StageGlass>
                    )}

                    <div className="flex items-center gap-2.5">
                      <StageGlass
                        stageRef={stageRef}
                        wallpaper={wallpaper}
                        isDark={isDark}
                        variant="card"
                        radius={16}
                        className="shrink-0"
                        innerClassName="px-3.5 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-100"
                      >
                        {selectedCountry.code}
                      </StageGlass>

                      <StageGlass
                        stageRef={stageRef}
                        wallpaper={wallpaper}
                        isDark={isDark}
                        variant="card"
                        radius={16}
                        className={`flex-1 ${phoneError ? 'ring-1 ring-rose-500/70' : ''}`}
                        innerClassName="px-4 py-3.5 flex items-center"
                      >
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
                              requestOtpCode(false);
                            }
                          }}
                          placeholder="812-3456-7890"
                          className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none tracking-wide"
                        />
                      </StageGlass>
                    </div>

                    {phoneError ? (
                      <StageGlass
                        stageRef={stageRef}
                        wallpaper={wallpaper}
                        isDark={isDark}
                        variant="card"
                        radius={12}
                        className="w-full"
                        innerClassName="px-3.5 py-2 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-2"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{phoneError}</span>
                      </StageGlass>
                    ) : (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 px-1 wallpaper-text-crisp">
                        Tarif SMS standar operator mungkin berlaku.
                      </p>
                    )}
                  </div>

                  <StageGlass
                    as="button"
                    type="button"
                    stageRef={stageRef}
                    wallpaper={wallpaper}
                    isDark={isDark}
                    variant="emeraldPill"
                    radius={999}
                    disabled={isSubmittingAuth}
                    onClick={() => requestOtpCode(false)}
                    className="w-full cursor-pointer active:scale-[0.98] transition-transform disabled:opacity-70"
                    innerClassName="py-3.5 text-white text-sm font-semibold tracking-wide flex items-center justify-center gap-2"
                  >
                    <span>{isSubmittingAuth ? 'MENGIRIM...' : 'LANJUT'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </StageGlass>
                </div>
              )}

              {authStep === 'OTP' && (
                <div className="space-y-6">
                  <div>
                    <StageGlass
                      as="button"
                      type="button"
                      stageRef={stageRef}
                      wallpaper={wallpaper}
                      isDark={isDark}
                      variant="orb"
                      radius={18}
                      onClick={() => setAuthStep('PHONE')}
                      aria-label="Kembali ke input nomor telepon"
                      className="w-9 h-9 mb-5 cursor-pointer active:scale-95 transition-transform"
                      innerClassName="flex items-center justify-center text-slate-900 dark:text-slate-100"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </StageGlass>

                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white wallpaper-text-crisp">
                      Verifikasi Nomor Telepon
                    </h1>
                    <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 mt-2 wallpaper-text-crisp">
                      Masukkan kode 6 digit yang dikirimkan ke{' '}
                      <span className="font-semibold text-slate-900 dark:text-white">{pendingPhone}</span>.{' '}
                      <button
                        type="button"
                        onClick={() => setAuthStep('PHONE')}
                        className="text-emerald-700 dark:text-emerald-300 font-semibold underline underline-offset-2 cursor-pointer"
                      >
                        Ubah nomor
                      </button>
                    </p>
                  </div>

                  <div>
                    <div className="grid grid-cols-6 gap-2">
                      {otpDigits.map((digit, idx) => (
                        <StageGlass
                          key={idx}
                          stageRef={stageRef}
                          wallpaper={wallpaper}
                          isDark={isDark}
                          variant="card"
                          radius={16}
                          className="h-12"
                          innerClassName="flex items-center justify-center"
                        >
                          <input
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
                            onChange={(e) => handleOtpInput(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                            onPaste={(e) => handleOtpPaste(e, idx)}
                            aria-label={`Digit OTP ${idx + 1}`}
                            className="w-full h-full bg-transparent text-center text-base font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60 rounded-2xl"
                          />
                        </StageGlass>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 px-1 wallpaper-text-crisp">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-500" />
                        Kirim ulang kode dalam{' '}
                        <strong className="text-slate-800 dark:text-slate-200">{otpTimerLabel}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => requestOtpCode(true)}
                        className="text-emerald-700 dark:text-emerald-400 font-medium cursor-pointer"
                      >
                        Kirim ulang
                      </button>
                    </div>
                  </div>

                  <StageGlass
                    as="button"
                    type="button"
                    stageRef={stageRef}
                    wallpaper={wallpaper}
                    isDark={isDark}
                    variant="emeraldPill"
                    radius={999}
                    disabled={isSubmittingAuth}
                    onClick={handleVerifyOtp}
                    className="w-full cursor-pointer active:scale-[0.98] transition-transform disabled:opacity-70"
                    innerClassName="py-3.5 text-white text-sm font-semibold tracking-wide flex items-center justify-center"
                  >
                    {isSubmittingAuth ? 'MEMVERIFIKASI...' : 'VERIFIKASI'}
                  </StageGlass>
                </div>
              )}

              {authStep === 'PROFILE' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white wallpaper-text-crisp">
                      Info Profil Anda
                    </h1>
                    <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 mt-2 wallpaper-text-crisp">
                      Masukkan nama tampilan dan foto profil (opsional) untuk akun WhatsApp Anda.
                    </p>
                  </div>

                  <div className="flex flex-col items-center">
                    <input
                      ref={profileFileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoPick}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => profileFileRef.current?.click()}
                      className="relative w-24 h-24 rounded-full group cursor-pointer focus:outline-none"
                    >
                      <StageGlass
                        stageRef={stageRef}
                        wallpaper={wallpaper}
                        isDark={isDark}
                        variant="orb"
                        radius={48}
                        className="w-full h-full"
                        innerClassName="flex items-center justify-center overflow-hidden"
                      >
                        {hasProfilePhoto && profilePhotoPreview ? (
                          <img
                            src={profilePhotoPreview}
                            alt="Pratinjau foto profil"
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <Camera className="w-8 h-8 text-slate-800 dark:text-slate-200 group-hover:scale-105 transition-transform" />
                        )}
                      </StageGlass>
                      <span
                        className="absolute -bottom-0.5 -right-0.5 z-30 w-8 h-8 rounded-full text-white flex items-center justify-center shadow-md ring-2 ring-white/70 dark:ring-black/50"
                        style={{
                          background:
                            'radial-gradient(circle at 32% 22%, rgba(255,255,255,0.42) 0%, transparent 48%), linear-gradient(160deg, rgba(34,139,87,0.85) 0%, rgba(17,94,58,0.95) 100%)',
                        }}
                      >
                        {hasProfilePhoto ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
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
                      className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-300 mt-3 wallpaper-text-crisp cursor-pointer"
                    >
                      {hasProfilePhoto ? 'Hapus foto profil' : '+ Tambah Foto'}
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 mb-1.5 px-1 wallpaper-text-crisp">
                      <label htmlFor="setup-profile-name">Nama Lengkap (Wajib)</label>
                      <span>{profileName.length}/50</span>
                    </div>
                    <StageGlass
                      stageRef={stageRef}
                      wallpaper={wallpaper}
                      isDark={isDark}
                      variant="card"
                      radius={16}
                      className="w-full"
                      innerClassName="px-4 py-3.5"
                    >
                      <input
                        id="setup-profile-name"
                        name="profile_name"
                        type="text"
                        maxLength={50}
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Masukkan nama Anda"
                        className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                      />
                    </StageGlass>
                  </div>

                  <StageGlass
                    as="button"
                    type="button"
                    stageRef={stageRef}
                    wallpaper={wallpaper}
                    isDark={isDark}
                    variant="emeraldPill"
                    radius={999}
                    disabled={isSubmittingAuth}
                    onClick={handleSaveInitialProfile}
                    className="w-full cursor-pointer active:scale-[0.98] transition-transform disabled:opacity-70"
                    innerClassName="py-3.5 text-white text-sm font-semibold tracking-wide flex items-center justify-center"
                  >
                    {isSubmittingAuth ? 'MENYIMPAN...' : 'SIMPAN & MASUK'}
                  </StageGlass>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Authenticated Responsive Split-Pane WhatsApp Web Workspace */
        <div className="relative z-10 w-full h-full max-w-[1440px] mx-auto p-0 md:p-3.5 lg:p-5 flex flex-col md:flex-row gap-0 md:gap-4 overflow-hidden">
          {/* Left Sidebar Pane (Chats / Status List) */}
          <aside
            className={`relative w-full md:w-[350px] lg:w-[390px] xl:w-[410px] shrink-0 h-full flex flex-col md:rounded-[30px] bg-white/20 dark:bg-black/32 backdrop-blur-md border-b md:border border-white/45 dark:border-white/12 shadow-2xl overflow-hidden ${
              mobileRightView ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Sidebar Header */}
            <header className="px-4 pt-3.5 pb-2.5 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSettingsProfileName(displayUserName);
                  setShowSettingsModal(true);
                }}
                className="flex items-center gap-3 min-w-0 cursor-pointer text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm border border-white/40 overflow-hidden">
                  {hasProfilePhoto && profilePhotoPreview ? (
                    <img
                      src={profilePhotoPreview}
                      alt={displayUserName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white leading-tight wallpaper-text-crisp">
                    WhatsApp
                  </div>
                  <div className="text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-[175px] wallpaper-text-crisp">
                    {displayUserName}
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-2 shrink-0">
                <StageGlass
                  as="button"
                  type="button"
                  stageRef={stageRef}
                  wallpaper={wallpaper}
                  isDark={isDark}
                  variant="orb"
                  radius={18}
                  onClick={() => setShowNewChatModal(true)}
                  aria-label="Obrolan baru"
                  title="Obrolan baru"
                  className="w-9 h-9 cursor-pointer active:scale-95 transition-transform"
                  innerClassName="flex items-center justify-center text-slate-900 dark:text-slate-100"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                </StageGlass>

                <StageGlass
                  as="button"
                  type="button"
                  stageRef={stageRef}
                  wallpaper={wallpaper}
                  isDark={isDark}
                  variant="orb"
                  radius={18}
                  onClick={() => {
                    setSettingsProfileName(displayUserName);
                    setShowSettingsModal(true);
                  }}
                  aria-label="Profil dan pengaturan"
                  title="Profil & Pengaturan"
                  className="w-9 h-9 cursor-pointer active:scale-95 transition-transform"
                  innerClassName="flex items-center justify-center text-slate-900 dark:text-slate-100"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </StageGlass>
              </div>
            </header>

            {/* Search Input */}
            <div className="px-4 pb-2.5 shrink-0">
              <StageGlass
                stageRef={stageRef}
                wallpaper={wallpaper}
                isDark={isDark}
                variant="elevated"
                radius={20}
                className="w-full"
                innerClassName="px-3.5 py-2 flex items-center gap-2"
              >
                <Search className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 shrink-0" />
                <input
                  id="chat-search-input"
                  name="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kontak atau percakapan..."
                  className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Hapus pencarian"
                    onClick={() => setSearchQuery('')}
                    className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </StageGlass>
            </div>

            {/* Scrollable List Content */}
            <div
              id="sidebar-scroll-list"
              data-glass-scroll="true"
              className="flex-1 overflow-y-auto no-scrollbar px-3.5 pt-1 pb-24 space-y-2.5"
            >
              {activeTab === 'CHAT' ? (
                <div id="chat-list-container" className="space-y-2.5">
                  {isLoadingContacts && contacts.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-700 dark:text-slate-300 wallpaper-text-crisp">
                      Memuat daftar percakapan...
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-700 dark:text-slate-300 wallpaper-text-crisp">
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
                        <StageGlass
                          key={chat.id}
                          stageRef={stageRef}
                          wallpaper={wallpaper}
                          isDark={isDark}
                          variant="card"
                          radius={24}
                          onClick={() => openChat(chat.id)}
                          className={`w-full cursor-pointer active:scale-[0.988] transition-transform ${
                            isSelected ? 'md:ring-2 md:ring-emerald-500/75' : ''
                          }`}
                          innerClassName="p-3.5 flex items-center gap-3.5"
                        >
                          <div
                            className={`w-12 h-12 rounded-full bg-gradient-to-br ${chat.gradient} flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-sm border border-white/40`}
                          >
                            {chat.initials}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate wallpaper-text-crisp">
                                {chat.name}
                              </h3>
                              <span
                                className={`text-[11px] shrink-0 ${
                                  chat.unread > 0
                                    ? 'text-emerald-800 dark:text-emerald-300 font-bold'
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {chat.time}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 mt-1">
                              <p className="text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1 min-w-0 flex-1">
                                {lastText ? (
                                  <>
                                    {lastIsMine && <TickIcon tick={lastTick} />}
                                    <span className="truncate">{lastText}</span>
                                  </>
                                ) : (
                                  <span className="italic text-slate-600 dark:text-slate-400 truncate">
                                    Belum ada pesan
                                  </span>
                                )}
                              </p>

                              {chat.unread > 0 && (
                                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                                  {chat.unread}
                                </span>
                              )}
                            </div>
                          </div>
                        </StageGlass>
                      );
                    })
                  )}
                </div>
              ) : (
                <div id="status-list-container" className="space-y-4">
                  <StageGlass
                    stageRef={stageRef}
                    wallpaper={wallpaper}
                    isDark={isDark}
                    variant="card"
                    radius={24}
                    onClick={() => {
                      if (myStatusPosted) {
                        openMyStory();
                      } else {
                        openStatusComposer('teks');
                      }
                    }}
                    className="w-full cursor-pointer active:scale-[0.988] transition-transform"
                    innerClassName="p-3.5 flex items-center gap-3.5"
                  >
                    <div className="relative">
                      <div className={`w-[52px] h-[52px] rounded-full ${myStatusPosted ? 'status-ring' : ''}`}>
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-semibold text-sm border border-white/40">
                          {initials}
                        </div>
                      </div>
                      {!myStatusPosted && (
                        <span
                          className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full text-white flex items-center justify-center shadow"
                          style={{
                            background:
                              'linear-gradient(160deg, rgba(34,139,87,0.9) 0%, rgba(17,94,58,0.98) 100%)',
                          }}
                        >
                          <Plus className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white wallpaper-text-crisp">
                        Status Saya
                      </h3>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 truncate">
                        {myStatusPosted && latestMyStatus
                          ? `${latestMyStatus.time} · ${myStatuses.length} status · Dilihat ${latestMyStatus.viewersCount} kontak`
                          : 'Ketuk untuk menambahkan pembaruan status'}
                      </p>
                    </div>

                    {myStatusPosted && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openStatusComposer('teks');
                        }}
                        aria-label="Tambah status baru"
                        className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 flex items-center justify-center shrink-0 cursor-pointer hover:bg-emerald-500/30"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </StageGlass>

                  {recentStories.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200 px-1.5 mb-2 wallpaper-text-crisp">
                        Pembaruan Terbaru
                      </p>
                      <div className="space-y-2.5">
                        {recentStories.map((story) => (
                          <StageGlass
                            key={story.id}
                            stageRef={stageRef}
                            wallpaper={wallpaper}
                            isDark={isDark}
                            variant="card"
                            radius={24}
                            onClick={() => openStory(story.id)}
                            className="w-full cursor-pointer active:scale-[0.988] transition-transform"
                            innerClassName="p-3.5 flex items-center gap-3.5"
                          >
                            <div className="w-[52px] h-[52px] rounded-full status-ring shrink-0">
                              <div className="w-full h-full rounded-full bg-slate-800 dark:bg-slate-900 flex items-center justify-center text-white text-xs font-semibold">
                                {story.initials}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate wallpaper-text-crisp">
                                {story.name}
                              </h4>
                              <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                                {story.time}
                              </p>
                            </div>
                          </StageGlass>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewedStories.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 px-1.5 mb-2 wallpaper-text-crisp">
                        Pembaruan yang Dilihat
                      </p>
                      <div className="space-y-2.5">
                        {viewedStories.map((story) => (
                          <StageGlass
                            key={story.id}
                            stageRef={stageRef}
                            wallpaper={wallpaper}
                            isDark={isDark}
                            variant="card"
                            radius={24}
                            onClick={() => openStory(story.id)}
                            className="w-full cursor-pointer active:scale-[0.988] transition-transform"
                            innerClassName="p-3.5 flex items-center gap-3.5"
                          >
                            <div className="w-[52px] h-[52px] rounded-full status-ring-seen shrink-0">
                              <div className="w-full h-full rounded-full bg-slate-800 dark:bg-slate-900 flex items-center justify-center text-white text-xs font-semibold">
                                {story.initials}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate wallpaper-text-crisp">
                                {story.name}
                              </h4>
                              <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                                {story.time}
                              </p>
                            </div>
                          </StageGlass>
                        ))}
                      </div>
                    </div>
                  )}

                  {stories.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-700 dark:text-slate-300 wallpaper-text-crisp">
                      Belum ada pembaruan status aktif dalam 24 jam terakhir.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Floating Liquid Glass Tab Dock */}
            <div className="absolute bottom-3.5 left-3.5 right-3.5 z-20 flex items-center justify-between gap-2.5 pointer-events-none">
              <StageGlass
                stageRef={stageRef}
                wallpaper={wallpaper}
                isDark={isDark}
                variant="dock"
                radius={999}
                className="pointer-events-auto flex-1 min-w-0 max-w-[244px]"
                innerClassName="p-1.5 flex items-center gap-1"
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('CHAT')}
                  className={`flex-1 min-w-0 py-2 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'CHAT'
                      ? 'bg-slate-900/25 dark:bg-white/20 text-white shadow-sm'
                      : 'text-slate-900/80 dark:text-white/75 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Chat</span>
                  {totalUnread > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500 text-white leading-none shadow-xs">
                      {totalUnread}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('STATUS')}
                  className={`flex-1 min-w-0 py-2 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'STATUS'
                      ? 'bg-slate-900/25 dark:bg-white/20 text-white shadow-sm'
                      : 'text-slate-900/80 dark:text-white/75 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <Aperture className="w-3.5 h-3.5 shrink-0" />
                  <span>Status</span>
                  {hasUnseenStatus && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs shrink-0" />
                  )}
                </button>
              </StageGlass>

              {activeTab === 'CHAT' ? (
                <StageGlass
                  as="button"
                  type="button"
                  stageRef={stageRef}
                  wallpaper={wallpaper}
                  isDark={isDark}
                  variant="emeraldOrb"
                  radius={26}
                  onClick={() => setShowNewChatModal(true)}
                  aria-label="Mulai Obrolan Baru"
                  className="w-12 h-12 cursor-pointer pointer-events-auto shrink-0 active:scale-95 transition-transform"
                  innerClassName="flex items-center justify-center text-white"
                >
                  <MessageSquarePlus className="w-5 h-5" />
                </StageGlass>
              ) : (
                <div className="flex items-center gap-2 pointer-events-auto shrink-0">
                  <StageGlass
                    as="button"
                    type="button"
                    stageRef={stageRef}
                    wallpaper={wallpaper}
                    isDark={isDark}
                    variant="orb"
                    radius={22}
                    onClick={() => openStatusComposer('teks')}
                    aria-label="Buat status teks"
                    className="w-11 h-11 cursor-pointer active:scale-95 transition-transform"
                    innerClassName="flex items-center justify-center text-slate-900 dark:text-white"
                  >
                    <Pencil className="w-4 h-4" />
                  </StageGlass>

                  <StageGlass
                    as="button"
                    type="button"
                    stageRef={stageRef}
                    wallpaper={wallpaper}
                    isDark={isDark}
                    variant="emeraldOrb"
                    radius={26}
                    onClick={() => openStatusComposer('gambar')}
                    aria-label="Buat status media"
                    className="w-12 h-12 cursor-pointer active:scale-95 transition-transform"
                    innerClassName="flex items-center justify-center text-white"
                  >
                    <Camera className="w-5 h-5" />
                  </StageGlass>
                </div>
              )}
            </div>
          </aside>

          {/* Right Workspace Pane (Chat Room / Status Composer / Status Privacy / Story Viewer) */}
          <main
            className={`flex-1 h-full min-w-0 flex flex-col md:rounded-[30px] bg-white/14 dark:bg-black/24 backdrop-blur-sm md:border border-white/40 dark:border-white/12 shadow-2xl overflow-hidden relative ${
              mobileRightView ? 'flex' : 'hidden md:flex'
            }`}
          >
            {rightPaneMode === 'CHAT' && (
              <>
                {activeContact ? (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Chat Room Header */}
                    <div className="px-4 pt-3 pb-2.5 shrink-0">
                      <StageGlass
                        stageRef={stageRef}
                        wallpaper={wallpaper}
                        isDark={isDark}
                        variant="elevated"
                        radius={24}
                        className="w-full"
                        innerClassName="px-3.5 py-2.5 flex items-center gap-3"
                      >
                        <button
                          type="button"
                          onClick={() => setMobileRightView(null)}
                          aria-label="Kembali ke daftar chat"
                          className="md:hidden w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer shrink-0"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>

                        <div
                          className={`w-10 h-10 rounded-full bg-gradient-to-br ${activeContact.gradient} flex items-center justify-center text-white text-xs font-semibold shrink-0 shadow-sm`}
                        >
                          {activeContact.initials}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {activeContact.name}
                          </h2>
                          <p
                            className={`text-[11px] truncate ${
                              activeContact.statusText === 'Online'
                                ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                                : 'text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {activeContact.statusText}
                          </p>
                        </div>

                        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-[10.5px] font-medium shrink-0">
                          <Lock className="w-3 h-3" />
                          <span>E2EE</span>
                        </div>
                      </StageGlass>
                    </div>

                    {/* Messages Flow */}
                    <div
                      ref={chatScrollRef}
                      id="chat-messages-scroll"
                      className="flex-1 overflow-y-auto no-scrollbar px-4 md:px-7 py-3 space-y-2.5"
                    >
                      <div className="flex justify-center my-2">
                        <MaterialGlass
                          isDark={isDark}
                          variant="incoming"
                          radius={16}
                          className="px-3.5 py-2 max-w-[90%] md:max-w-[70%] text-center"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="text-[11px] leading-snug text-slate-700 dark:text-slate-200">
                              Pesan dienkripsi secara <strong>end-to-end</strong>. Hanya Anda dan{' '}
                              {activeContact.name} yang dapat membacanya.
                            </span>
                          </div>
                        </MaterialGlass>
                      </div>

                      {isLoadingMessages ? (
                        <div className="text-center py-8 text-xs text-slate-700 dark:text-slate-300 wallpaper-text-crisp">
                          Memuat pesan terenkripsi...
                        </div>
                      ) : activeContact.messages.length === 0 ? (
                        <div className="text-center py-8 text-xs text-slate-700 dark:text-slate-300 wallpaper-text-crisp">
                          Belum ada pesan. Mulai obrolan terenkripsi sekarang.
                        </div>
                      ) : (
                        <div id="chat-messages-list" className="space-y-2.5">
                          {activeContact.messages.map((msg) => {
                            const isMe = msg.from === 'me';
                            return (
                              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <MaterialGlass
                                  isDark={isDark}
                                  variant={isMe ? 'outgoing' : 'incoming'}
                                  radius={22}
                                  className={`max-w-[80%] md:max-w-[68%] px-3.5 py-2.5 ${
                                    isMe
                                      ? 'rounded-br-md text-slate-900 dark:text-white'
                                      : 'rounded-bl-md text-slate-800 dark:text-slate-100'
                                  }`}
                                >
                                  <p className="text-[13px] leading-relaxed break-words">{msg.text}</p>
                                  <div className="flex items-center justify-end gap-1 mt-1">
                                    <span className="text-[10px] text-slate-600 dark:text-slate-400">
                                      {msg.time}
                                    </span>
                                    {isMe && <TickIcon tick={msg.tick} />}
                                  </div>
                                </MaterialGlass>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Message Input Bar */}
                    <form
                      onSubmit={handleSendMessage}
                      className="px-4 md:px-6 py-3 shrink-0 flex items-center gap-2.5"
                    >
                      <StageGlass
                        stageRef={stageRef}
                        wallpaper={wallpaper}
                        isDark={isDark}
                        variant="elevated"
                        radius={999}
                        className="flex-1"
                        innerClassName="px-4 py-2.5 flex items-center"
                      >
                        <input
                          id="chat-input-field"
                          name="message"
                          type="text"
                          autoComplete="off"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Ketik pesan terenkripsi..."
                          className="w-full bg-transparent text-[13px] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                        />
                      </StageGlass>

                      <StageGlass
                        as="button"
                        type="submit"
                        stageRef={stageRef}
                        wallpaper={wallpaper}
                        isDark={isDark}
                        variant="emeraldOrb"
                        radius={22}
                        disabled={isSendingMessage}
                        aria-label="Kirim pesan"
                        className="w-11 h-11 shrink-0 cursor-pointer active:scale-95 transition-transform disabled:opacity-70"
                        innerClassName="flex items-center justify-center text-white"
                      >
                        <Send className="w-4 h-4 -translate-x-px" />
                      </StageGlass>
                    </form>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-6">
                    <StageGlass
                      stageRef={stageRef}
                      wallpaper={wallpaper}
                      isDark={isDark}
                      variant="elevated"
                      radius={28}
                      className="max-w-sm w-full"
                      innerClassName="p-7 flex-col items-center text-center gap-3"
                    >
                      <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                        <MessageCircle className="w-7 h-7" />
                      </div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        WhatsApp Web
                      </h2>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        Pilih salah satu percakapan di sebelah kiri atau mulai obrolan baru untuk mengirim pesan terenkripsi end-to-end.
                      </p>
                    </StageGlass>
                  </div>
                )}
              </>
            )}

            {rightPaneMode === 'STATUS_CREATE' && (
              <div
                className={`flex-1 flex flex-col justify-between p-5 md:p-6 relative overflow-hidden bg-gradient-to-br ${activeCreateBg.class} text-white`}
              >
                <div className="relative z-20 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRightPaneMode('CHAT');
                      setMobileRightView(null);
                    }}
                    aria-label="Tutup pembuat status"
                    className="w-9 h-9 rounded-full bg-black/25 backdrop-blur-xl border border-white/25 flex items-center justify-center text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    {statusMode === 'teks' && (
                      <button
                        type="button"
                        onClick={() => setStatusBgIndex((i) => (i + 1) % STATUS_BACKGROUNDS.length)}
                        className="px-3.5 py-1.5 rounded-full bg-black/25 backdrop-blur-xl border border-white/25 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                      >
                        <Palette className="w-3.5 h-3.5" />
                        <span>Warna</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setRightPaneMode('STATUS_PRIVACY');
                        setMobileRightView('STATUS_PRIVACY');
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-black/25 backdrop-blur-xl border border-white/25 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>{privacyLabels[statusPrivacy]}</span>
                    </button>
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
                      className="w-full bg-transparent text-center text-xl md:text-2xl font-semibold leading-relaxed text-white placeholder-white/60 focus:outline-none resize-none"
                    />
                  ) : (
                    <div className="rounded-[28px] bg-white/15 backdrop-blur-2xl border border-white/30 p-5 text-center space-y-3 shadow-xl">
                      <input
                        ref={statusMediaFileRef}
                        type="file"
                        accept="image/*"
                        onChange={handleStatusMediaPick}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => statusMediaFileRef.current?.click()}
                        className="w-full h-56 rounded-2xl bg-gradient-to-tr from-white/20 to-white/5 border border-white/20 flex flex-col items-center justify-center gap-2 overflow-hidden cursor-pointer relative"
                      >
                        {statusMediaPreview ? (
                          <img
                            src={statusMediaPreview}
                            alt="Pratinjau gambar status"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <>
                            <ImageIcon className="w-10 h-10 text-white/85" />
                            <span className="text-xs font-medium text-white/90">
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
                        className="w-full bg-black/20 rounded-full px-4 py-2 text-xs text-white placeholder-white/65 focus:outline-none text-center"
                      />
                    </div>
                  )}
                </div>

                <div className="relative z-20 flex items-center justify-between gap-3">
                  <div className="rounded-full bg-black/25 backdrop-blur-xl border border-white/20 p-1 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setStatusMode('teks')}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        statusMode === 'teks' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/80'
                      }`}
                    >
                      Teks
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusMode('gambar')}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        statusMode === 'gambar' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/80'
                      }`}
                    >
                      Gambar
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isPostingStatus}
                    onClick={handlePostStatus}
                    aria-label="Bagikan status"
                    className="w-12 h-12 rounded-full text-white flex items-center justify-center cursor-pointer shadow-lg disabled:opacity-70"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(28, 148, 88, 0.85) 0%, rgba(18, 112, 66, 0.95) 100%)',
                      boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8), 0 10px 22px rgba(0,0,0,0.3)',
                    }}
                  >
                    <Send className="w-5 h-5 -translate-x-px" />
                  </button>
                </div>
              </div>
            )}

            {rightPaneMode === 'STATUS_PRIVACY' && (
              <div className="flex-1 flex flex-col justify-between p-5 md:p-7 overflow-hidden">
                <div className="max-w-xl w-full mx-auto flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center gap-3 mb-5 shrink-0">
                    <StageGlass
                      as="button"
                      type="button"
                      stageRef={stageRef}
                      wallpaper={wallpaper}
                      isDark={isDark}
                      variant="orb"
                      radius={18}
                      onClick={() => {
                        setRightPaneMode('STATUS_CREATE');
                        setMobileRightView('STATUS_CREATE');
                      }}
                      aria-label="Kembali ke pembuat status"
                      className="w-9 h-9 cursor-pointer active:scale-95 transition-transform"
                      innerClassName="flex items-center justify-center text-slate-800 dark:text-slate-200"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </StageGlass>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white wallpaper-text-crisp">
                      Privasi Status
                    </h2>
                  </div>

                  <div className="flex-1 overflow-y-auto no-scrollbar pr-0.5 space-y-3 pb-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 px-1 wallpaper-text-crisp">
                      Siapa yang dapat melihat pembaruan status saya
                    </p>

                    {[
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
                    ].map((opt) => {
                      const selected = statusPrivacy === opt.id;
                      return (
                        <StageGlass
                          key={opt.id}
                          as="button"
                          type="button"
                          stageRef={stageRef}
                          wallpaper={wallpaper}
                          isDark={isDark}
                          variant="card"
                          radius={22}
                          onClick={() => setStatusPrivacy(opt.id)}
                          className={`w-full text-left cursor-pointer active:scale-[0.988] transition-transform ${
                            selected ? 'ring-2 ring-emerald-500/70' : ''
                          }`}
                          innerClassName="p-4 flex items-start gap-3.5"
                        >
                          <div
                            className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              selected ? 'border-emerald-500' : 'border-slate-400/60'
                            }`}
                          >
                            {selected && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">
                              {opt.title}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                              {opt.desc}
                            </div>
                          </div>
                        </StageGlass>
                      );
                    })}

                    {statusPrivacy !== 'semua_kontak' && (
                      <StageGlass
                        stageRef={stageRef}
                        wallpaper={wallpaper}
                        isDark={isDark}
                        variant="elevated"
                        radius={22}
                        className="w-full"
                        innerClassName="p-4 flex-col items-stretch space-y-2"
                      >
                        <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                          <span>
                            {statusPrivacy === 'kecuali_beberapa'
                              ? 'Pilih kontak yang dikecualikan:'
                              : 'Pilih kontak yang dapat melihat:'}
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {selectedAudienceIds.length} dipilih
                          </span>
                        </div>
                        <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
                          {audienceOptionsList.map((contact) => {
                            const checked = selectedAudienceIds.includes(contact.id);
                            return (
                              <button
                                key={contact.id}
                                type="button"
                                onClick={() => toggleAudienceContact(contact.id)}
                                className="w-full px-2.5 py-2 rounded-xl hover:bg-white/35 dark:hover:bg-white/10 flex items-center justify-between text-left text-xs cursor-pointer"
                              >
                                <span className="font-medium text-slate-900 dark:text-white truncate">
                                  {contact.name}
                                </span>
                                <span
                                  className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                                    checked
                                      ? 'bg-emerald-500 border-emerald-500 text-white'
                                      : 'border-slate-400/70'
                                  }`}
                                >
                                  {checked && <Check className="w-3 h-3" />}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </StageGlass>
                    )}
                  </div>

                  <StageGlass
                    as="button"
                    type="button"
                    stageRef={stageRef}
                    wallpaper={wallpaper}
                    isDark={isDark}
                    variant="emeraldPill"
                    radius={999}
                    onClick={() => {
                      showToast('Pengaturan privasi disimpan');
                      setRightPaneMode('STATUS_CREATE');
                      setMobileRightView('STATUS_CREATE');
                    }}
                    className="w-full shrink-0 mt-2 cursor-pointer active:scale-[0.98] transition-transform"
                    innerClassName="py-3.5 text-white text-sm font-semibold tracking-wide flex items-center justify-center"
                  >
                    SELESAI
                  </StageGlass>
                </div>
              </div>
            )}

            {/* Story Viewer Overlay */}
            {currentViewedStory && (
              <div
                onClick={() => {
                  if (showViewersDrawer) {
                    setShowViewersDrawer(false);
                  } else {
                    closeStoryViewer();
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
                  <div className="flex items-center gap-1">
                    {viewingStoryDeck.items.map((st, idx) => (
                      <div key={st.id} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
                        <div
                          className={`h-full bg-white rounded-full transition-all ${
                            idx <= viewingStoryDeck.index ? 'w-full' : 'w-0'
                          }`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-xs font-semibold shrink-0">
                        {currentViewedStory.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate">{currentViewedStory.name}</div>
                        <div className="text-[10px] text-white/75">
                          {currentViewedStory.time} · Aktif 24 jam
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {viewingStoryDeck.isMine && viewingStoryDeck.items.length > 1 && (
                        <>
                          <button
                            type="button"
                            aria-label="Status sebelumnya"
                            onClick={() =>
                              setViewingStoryDeck((d) => ({
                                ...d,
                                index: (d.index - 1 + d.items.length) % d.items.length,
                              }))
                            }
                            className="w-7 h-7 rounded-full bg-black/25 backdrop-blur-md flex items-center justify-center cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Status berikutnya"
                            onClick={() =>
                              setViewingStoryDeck((d) => ({
                                ...d,
                                index: (d.index + 1) % d.items.length,
                              }))
                            }
                            className="w-7 h-7 rounded-full bg-black/25 backdrop-blur-md flex items-center justify-center cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {viewingStoryDeck.isMine && (
                        <button
                          type="button"
                          aria-label="Hapus status"
                          onClick={handleDeleteCurrentMyStatus}
                          className="w-8 h-8 rounded-full bg-rose-500/40 backdrop-blur-md flex items-center justify-center cursor-pointer hover:bg-rose-500/60"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        aria-label="Tutup status"
                        onClick={closeStoryViewer}
                        className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
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
                        className="max-h-72 rounded-2xl object-contain shadow-lg border border-white/25"
                      />
                    </div>
                  )}
                  {currentViewedStory.content && (
                    <p className="text-xl md:text-2xl font-semibold leading-relaxed drop-shadow">
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
                      <div className="w-full rounded-2xl bg-black/45 backdrop-blur-xl border border-white/20 p-3 max-h-40 overflow-y-auto no-scrollbar space-y-1.5">
                        <div className="text-[11px] font-semibold text-white/90">
                          Dilihat oleh ({currentViewedStory.viewersCount})
                        </div>
                        {currentViewedStory.viewers.length === 0 ? (
                          <div className="text-[11px] text-white/70">
                            Belum ada kontak yang melihat status ini.
                          </div>
                        ) : (
                          currentViewedStory.viewers.map((v) => (
                            <div key={v.id_pengguna} className="flex items-center justify-between text-[11px]">
                              <span className="font-medium truncate">{v.nama_profil}</span>
                              <span className="text-white/70 shrink-0">{v.time_ago}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowViewersDrawer((prev) => !prev)}
                      className="px-4 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Dilihat oleh {currentViewedStory.viewersCount}</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-[11px] text-white/75">
                    Ketuk di mana saja untuk menutup
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      )}

      {/* Modal: Mulai Chat Baru */}
      {showNewChatModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNewChatModal(false);
          }}
        >
          <StageGlass
            stageRef={stageRef}
            wallpaper={wallpaper}
            isDark={isDark}
            variant="elevated"
            radius={28}
            className="w-full max-w-md"
            innerClassName="p-5 flex-col items-stretch space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Mulai Chat Baru</h3>
              <button
                type="button"
                aria-label="Tutup daftar kontak"
                onClick={() => setShowNewChatModal(false)}
                className="w-7 h-7 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1.5 max-h-72 overflow-y-auto no-scrollbar">
              {contacts.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-600 dark:text-slate-300">
                  Belum ada kontak tersedia.
                </div>
              ) : (
                contacts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => openChat(c.id)}
                    className="w-full p-2.5 rounded-2xl hover:bg-white/40 dark:hover:bg-white/10 flex items-center gap-3 text-left transition-colors cursor-pointer"
                  >
                    <div
                      className={`w-9 h-9 rounded-full bg-gradient-to-br ${c.gradient} flex items-center justify-center text-white text-xs font-semibold shrink-0`}
                    >
                      {c.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                        {c.phone || c.statusText}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </StageGlass>
        </div>
      )}

      {/* Modal: Profil & Pengaturan */}
      {showSettingsModal && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSettingsModal(false);
          }}
        >
          <StageGlass
            stageRef={stageRef}
            wallpaper={wallpaper}
            isDark={isDark}
            variant="elevated"
            radius={30}
            className="w-full max-w-md"
            innerClassName="p-5 flex-col items-stretch space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    Profil & Pengaturan
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                    {authUser?.no_telepon || pendingPhone}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Tutup pengaturan"
                onClick={() => setShowSettingsModal(false)}
                className="w-7 h-7 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Edit Nama Profil */}
            <form onSubmit={handleUpdateSettingsProfile} className="space-y-2">
              <label
                htmlFor="settings-profile-name"
                className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300"
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
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white/50 dark:bg-black/30 border border-white/60 dark:border-white/15 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                />
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-70"
                >
                  {isSavingProfile ? '...' : 'Simpan'}
                </button>
              </div>
            </form>

            {/* Tema & Wallpaper */}
            <div className="pt-1 border-t border-black/10 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Tema Aplikasi
                </span>
                <button
                  type="button"
                  onClick={() => setIsDark((d) => !d)}
                  className="rounded-full p-1 flex items-center gap-1 cursor-pointer bg-black/10 dark:bg-white/10 border border-white/30 dark:border-white/10"
                >
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1 transition-all ${
                      !isDark ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300'
                    }`}
                  >
                    <Sun className="w-3 h-3" />
                    <span>Terang</span>
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1 transition-all ${
                      isDark ? 'bg-white/20 text-white shadow-sm' : 'text-slate-700'
                    }`}
                  >
                    <Moon className="w-3 h-3" />
                    <span>Gelap</span>
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Wallpaper Latar
                </span>
                <div className="flex items-center gap-1.5">
                  {WALLPAPERS.map((wp) => {
                    const active = activeWallpaperId === wp.id;
                    return (
                      <button
                        key={wp.id}
                        type="button"
                        onClick={() => handleSelectWallpaper(wp)}
                        title={wp.label}
                        aria-label={`Wallpaper ${wp.label}`}
                        className={`w-6 h-6 rounded-full bg-gradient-to-br ${wp.swatch} transition-all cursor-pointer flex items-center justify-center ${
                          active
                            ? 'ring-2 ring-emerald-500 ring-offset-1 ring-offset-white/70 dark:ring-offset-slate-900 scale-105'
                            : 'opacity-75 hover:opacity-100'
                        }`}
                      >
                        {active && <span className="w-1.5 h-1.5 rounded-full bg-white shadow" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Beralih Akun */}
            <div className="pt-1 border-t border-black/10 dark:border-white/10 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Beralih Akun</span>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto no-scrollbar">
                {registeredAccounts.map((u) => {
                  const isCurrent =
                    authUser && Number(authUser.id_pengguna) === Number(u.id_pengguna);
                  return (
                    <button
                      key={u.id_pengguna}
                      type="button"
                      onClick={() => handleSwitchAccount(u)}
                      className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-500/20 text-emerald-950 dark:text-white'
                          : 'hover:bg-white/35 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarGradient(
                            u.id_pengguna
                          )} text-white text-[10px] font-semibold flex items-center justify-center shrink-0`}
                        >
                          {getInitials(u.nama_profil)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium truncate">{u.nama_profil}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {u.no_telepon}
                          </div>
                        </div>
                      </div>
                      {isCurrent && <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar dari WhatsApp</span>
            </button>
          </StageGlass>
        </div>
      )}
    </div>
  );
}
