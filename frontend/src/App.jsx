import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Aperture,
  ArrowLeft,
  ArrowRight,
  BatteryFull,
  Camera,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Droplets,
  Eye,
  Image as ImageIcon,
  Lock,
  LogOut,
  MessageCircle,
  MessageSquarePlus,
  Moon,
  Palette,
  Pencil,
  Plus,
  Search,
  Send,
  Shield,
  Sun,
  Trash2,
  UserCheck,
  Users,
  Wifi,
  X,
} from 'lucide-react';
import {
  COUNTRY_OPTIONS,
  DEMO_ACCOUNTS,
  INITIAL_CONTACTS,
  INITIAL_STORIES,
  SCREEN_META,
  SCREEN_NAV_ITEMS,
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
    conversationId: c.conversation_id !== null && c.conversation_id !== undefined ? Number(c.conversation_id) : null,
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
  const navChipRefs = useRef({});
  const toastTimerRef = useRef(null);
  const profileFileRef = useRef(null);
  const statusMediaFileRef = useRef(null);
  const openTokenRef = useRef(0);
  const lastMessageIdRef = useRef(0);
  const activeChatIdRef = useRef('1');

  const [isDark, setIsDark] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('UI-003');
  const [activeWallpaperId, setActiveWallpaperId] = useState('pure-mesh');

  // Auth & Backend Session State
  const [authUser, setAuthUser] = useState(null);
  const [isBackendMode, setIsBackendMode] = useState(false);
  const [demoUsers, setDemoUsers] = useState(DEMO_ACCOUNTS);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  // UI-001 / UI-002 / UI-008 State
  const [countryIndex, setCountryIndex] = useState(0);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('812-3456-7890');
  const [phoneError, setPhoneError] = useState(false);
  const [pendingPhone, setPendingPhone] = useState('+62 812-3456-7890');

  const [otpDigits, setOtpDigits] = useState(['4', '8', '1', '9', '', '']);
  const [otpDebugCode, setOtpDebugCode] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(45);
  const [isNewUser, setIsNewUser] = useState(true);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  const [profileName, setProfileName] = useState('Muhammad Rifa');
  const [hasProfilePhoto, setHasProfilePhoto] = useState(false);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');

  // UI-003 / UI-004 Chat State
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  const [contacts, setContacts] = useState(INITIAL_CONTACTS);
  const [activeChatId, setActiveChatId] = useState(INITIAL_CONTACTS[0].id);
  const [chatInput, setChatInput] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // UI-005 / UI-006 / UI-007 Status State
  const [stories, setStories] = useState(INITIAL_STORIES);
  const [myStatuses, setMyStatuses] = useState([]);
  const [viewingStoryDeck, setViewingStoryDeck] = useState(null); // { items: [], index: 0, isMine: false }
  const [showViewersDrawer, setShowViewersDrawer] = useState(false);

  const [statusMode, setStatusMode] = useState('teks');
  const [statusBgIndex, setStatusBgIndex] = useState(0);
  const [statusText, setStatusText] = useState('Sedang menyusun dokumen DPPL WhatsApp... 🚀');
  const [statusCaption, setStatusCaption] = useState('Suasana kerja kelompok hari ini');
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

  const showToast = useCallback((message) => {
    setToast({ visible: true, message });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2600);
  }, []);

  const selectedCountry = COUNTRY_OPTIONS[countryIndex] || COUNTRY_OPTIONS[0];
  const wallpaper = WALLPAPERS.find((w) => w.id === activeWallpaperId) || WALLPAPERS[4];
  const activeContact = contacts.find((c) => c.id === activeChatId) || contacts[0] || null;
  const totalUnread = contacts.reduce((sum, c) => sum + (c.unread || 0), 0);
  const hasUnseenStatus = stories.some((s) => !s.seen);
  const myStatusPosted = myStatuses.length > 0;
  const latestMyStatus = myStatuses[0] || null;
  const displayUserName = (authUser && authUser.nama_profil) || profileName;
  const initials = getInitials(displayUserName);

  const privacyLabels = {
    semua_kontak: 'Kontak saya',
    kecuali_beberapa: 'Kontak kecuali...',
    hanya_terpilih: 'Kontak terpilih',
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    const activeBtn = navChipRefs.current[currentScreen];
    if (activeBtn) {
      activeBtn.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }
  }, [currentScreen]);

  useEffect(() => {
    if (currentScreen === 'UI-004' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [currentScreen, activeContact?.messages?.length]);

  // Countdown timer when viewing OTP screen UI-002
  useEffect(() => {
    if (currentScreen !== 'UI-002' || otpCountdown <= 0) return undefined;
    const id = setInterval(() => {
      setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [currentScreen, otpCountdown]);

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
      // Keep existing stories state if status endpoint fails
    }
  }, []);

  const loadBackendData = useCallback(async () => {
    try {
      const contactsRes = await fetchContacts();
      const rows = Array.isArray(contactsRes.data) ? contactsRes.data : [];
      setContacts((prev) => {
        const msgMap = new Map(prev.map((p) => [p.id, p.messages || []]));
        const mapped = rows.map((row) =>
          normalizeBackendContact(row, msgMap.get(String(row.contact_id)) || [])
        );
        if (mapped.length > 0 && !mapped.some((c) => c.id === activeChatIdRef.current)) {
          setActiveChatId(mapped[0].id);
        }
        return mapped;
      });
    } catch {
      // Keep existing contacts
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
  }, [loadBackendStatusFeed]);

  // Initial check for existing PHP session & optional demo user list
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await checkSession();
        if (!cancelled && me.authenticated && me.data) {
          setAuthUser(me.data);
          setIsBackendMode(true);
          if (me.data.nama_profil) {
            setProfileName(me.data.nama_profil);
          }
          await loadBackendData();
        }
      } catch {
        // Offline / simulation mode fallback
      }

      try {
        const usersRes = await fetchDemoUsers();
        if (!cancelled && Array.isArray(usersRes.data) && usersRes.data.length > 0) {
          setDemoUsers(usersRes.data);
        }
      } catch {
        // Fallback keeps DEMO_ACCOUNTS
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadBackendData]);

  // Refresh contacts periodically in backend mode
  useEffect(() => {
    if (!isBackendMode) return undefined;
    const id = setInterval(() => {
      if (!document.hidden) {
        loadBackendData();
      }
    }, 10000);
    return () => clearInterval(id);
  }, [isBackendMode, loadBackendData]);

  // Refresh status feed when navigating to UI-005
  useEffect(() => {
    if (isBackendMode && currentScreen === 'UI-005') {
      loadBackendStatusFeed();
    }
  }, [isBackendMode, currentScreen, loadBackendStatusFeed]);

  // Poll new messages while viewing UI-004 in backend mode
  useEffect(() => {
    if (!isBackendMode || currentScreen !== 'UI-004' || !activeContact?.conversationId) {
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
        // Silent polling error
      }
    }, 3000);

    return () => clearInterval(id);
  }, [isBackendMode, currentScreen, activeContact?.conversationId, activeContact?.id]);

  const handleSelectWallpaper = (wp) => {
    setActiveWallpaperId(wp.id);
    showToast(`Wallpaper: ${wp.label}`);
  };

  const handleSwitchAccount = async (user) => {
    setShowAccountMenu(false);
    try {
      const res = await switchDemoUser(user.id_pengguna);
      if (res.success && res.data) {
        setAuthUser(res.data);
        setIsBackendMode(true);
        setProfileName(res.data.nama_profil);
        await loadBackendData();
        showToast(`Akun aktif: ${res.data.nama_profil} (Live DB)`);
        setCurrentScreen('UI-003');
        return;
      }
    } catch {
      // Backend offline -> simulation switch fallback
    }
    setAuthUser(null);
    setIsBackendMode(false);
    setProfileName(user.nama_profil);
    showToast(`Akun aktif: ${user.nama_profil} (Mode Simulasi)`);
  };

  const handleLogout = async () => {
    setShowAccountMenu(false);
    try {
      await logoutUser();
    } catch {
      // Clear local state regardless
    }
    setAuthUser(null);
    setIsBackendMode(false);
    setContacts(INITIAL_CONTACTS);
    setActiveChatId(INITIAL_CONTACTS[0].id);
    setStories(INITIAL_STORIES);
    setMyStatuses([]);
    setProfileName('Muhammad Rifa');
    showToast('Keluar dari sesi · Mode Simulasi');
  };

  const requestOtpCode = async (isResend = false) => {
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    if (digitsOnly.length < 8) {
      setPhoneError(true);
      showToast('Masukkan nomor telepon minimal 8 digit');
      return;
    }

    const formattedFullPhone = `${selectedCountry.code} ${phoneNumber.trim()}`;
    const rawApiPhone = `${selectedCountry.code}${digitsOnly}`;
    setPendingPhone(formattedFullPhone);
    setIsSubmittingAuth(true);

    try {
      const res = await sendOtp(rawApiPhone);
      const data = res.data || {};
      const debugCode = String(data.otp_debug || '481920');
      setOtpDebugCode(debugCode);
      setOtpDigits(debugCode.slice(0, 6).split(''));
      setIsNewUser(!data.is_registered);
      setOtpCountdown(45);
      showToast(isResend ? 'Kode OTP baru dikirim (Backend)' : 'Kode OTP dikirim ke sesi pengujian');
      setCurrentScreen('UI-002');
    } catch (err) {
      if (err.status === 400) {
        setPhoneError(true);
        showToast(err.message);
      } else {
        // Fallback when PHP DB is offline
        const fallbackCode = '481920';
        setOtpDebugCode(fallbackCode);
        setOtpDigits(fallbackCode.split(''));
        setOtpCountdown(45);
        showToast('Mode Simulasi · OTP contoh: 481920');
        setCurrentScreen('UI-002');
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
      setAuthUser(userData);
      setIsBackendMode(true);
      if (userData.nama_profil) {
        setProfileName(userData.nama_profil);
      }

      if (userData.is_new_user || isNewUser) {
        await loadBackendData();
        showToast('OTP Valid · Lengkapi nama profil Anda');
        setCurrentScreen('UI-008');
      } else {
        await loadBackendData();
        showToast(`Selamat datang kembali, ${userData.nama_profil || 'Pengguna'}`);
        setCurrentScreen('UI-003');
      }
    } catch (err) {
      if (err.status === 400) {
        showToast(err.message);
      } else {
        if (isNewUser) {
          showToast('OTP Valid (Simulasi) · Lengkapi profil baru');
          setCurrentScreen('UI-008');
        } else {
          showToast('OTP Valid (Simulasi) · Selamat datang kembali');
          setCurrentScreen('UI-003');
        }
      }
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

  const handleSaveProfile = async () => {
    const trimmed = profileName.trim();
    if (!trimmed) {
      showToast('Nama profil wajib diisi');
      return;
    }

    if (isBackendMode) {
      setIsSubmittingAuth(true);
      try {
        const res = await updateProfile(trimmed);
        if (res.data) {
          setAuthUser(res.data);
          setProfileName(res.data.nama_profil || trimmed);
        }
        await loadBackendData();
        showToast('Profil disimpan ke database');
        setCurrentScreen('UI-003');
      } catch (err) {
        if (err.status === 400) {
          showToast(err.message);
        } else {
          showToast('Profil disimpan (Simulasi)');
          setCurrentScreen('UI-003');
        }
      } finally {
        setIsSubmittingAuth(false);
      }
      return;
    }

    setProfileName(trimmed);
    showToast('Profil disimpan');
    setCurrentScreen('UI-003');
  };

  const openChat = async (contactId) => {
    setActiveChatId(contactId);
    setContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, unread: 0 } : c)));
    setShowNewChatModal(false);
    setCurrentScreen('UI-004');

    if (!isBackendMode) return;

    const target = contacts.find((c) => c.id === contactId);
    if (!target) return;

    const token = ++openTokenRef.current;
    setIsLoadingMessages(true);
    try {
      let convId = target.conversationId;
      if (!convId) {
        const startRes = await startConversation(target.contactId);
        convId = Number(startRes.data?.conversation_id || startRes.data?.id_percakapan || 0) || null;
      }
      if (!convId || token !== openTokenRef.current) return;

      const msgRes = await fetchMessages(convId);
      if (token !== openTokenRef.current) return;

      const mapped = (Array.isArray(msgRes.data) ? msgRes.data : []).map(mapBackendMessage);
      lastMessageIdRef.current = mapped.length ? Math.max(...mapped.map((m) => m.id)) : 0;

      const lastMsg = mapped.length ? mapped[mapped.length - 1] : null;
      setContacts((prev) =>
        prev.map((c) =>
          c.id === contactId
            ? {
                ...c,
                conversationId: convId,
                unread: 0,
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
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!activeContact || isSendingMessage) return;
    const text = chatInput.trim();
    if (!text) return;

    if (isBackendMode) {
      setIsSendingMessage(true);
      setChatInput('');
      const targetId = activeContact.id;
      try {
        let convId = activeContact.conversationId;
        if (!convId) {
          const startRes = await startConversation(activeContact.contactId);
          convId = Number(startRes.data?.conversation_id || 0);
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
      return;
    }

    // Simulation mode fallback
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const msgId = Date.now();
    const targetId = activeContact.id;

    setContacts((prev) =>
      prev.map((c) =>
        c.id === targetId
          ? {
              ...c,
              time: timeStr,
              lastMessageText: text,
              lastMessageIsMine: true,
              lastMessageTick: 'sent',
              messages: [...c.messages, { id: msgId, from: 'me', text, time: timeStr, tick: 'sent' }],
            }
          : c
      )
    );
    setChatInput('');

    setTimeout(() => {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === targetId
            ? {
                ...c,
                lastMessageTick: 'delivered',
                messages: c.messages.map((m) => (m.id === msgId ? { ...m, tick: 'delivered' } : m)),
              }
            : c
        )
      );
    }, 650);

    setTimeout(() => {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === targetId
            ? {
                ...c,
                lastMessageTick: 'read',
                messages: c.messages.map((m) => (m.id === msgId ? { ...m, tick: 'read' } : m)),
              }
            : c
        )
      );
    }, 1400);
  };

  const openStory = async (storyId) => {
    const idx = stories.findIndex((s) => s.id === storyId);
    if (idx === -1) return;

    const target = stories[idx];
    setShowViewersDrawer(false);
    setViewingStoryDeck({
      items: [{ ...target, seen: true }],
      index: 0,
      isMine: false,
    });

    setStories((prev) => prev.map((s) => (s.id === storyId ? { ...s, seen: true } : s)));

    if (isBackendMode && target.id_status) {
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
  };

  const handleDeleteCurrentMyStatus = async () => {
    if (!viewingStoryDeck || !viewingStoryDeck.isMine) return;
    const currentItem = viewingStoryDeck.items[viewingStoryDeck.index];
    if (!currentItem) return;

    if (isBackendMode && currentItem.id_status) {
      try {
        await deleteStatusApi(currentItem.id_status);
        showToast('Status dihapus');
      } catch (err) {
        showToast(err.message || 'Gagal menghapus status');
        return;
      }
    } else {
      showToast('Status dihapus');
    }

    const remaining = myStatuses.filter((s) => s.id !== currentItem.id);
    setMyStatuses(remaining);
    setShowViewersDrawer(false);
    if (remaining.length === 0) {
      setViewingStoryDeck(null);
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

    if (isBackendMode) {
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
        setStatusMediaFile(null);
        setStatusMediaPreview('');
        showToast('Status dibagikan (aktif 24 jam)');
        setCurrentScreen('UI-005');
      } catch (err) {
        showToast(err.message || 'Gagal membagikan status');
      } finally {
        setIsPostingStatus(false);
      }
      return;
    }

    // Simulation mode local status
    const localItem = {
      id: `local-my-${Date.now()}`,
      id_status: null,
      name: 'Status Saya',
      initials,
      time: 'Baru saja',
      seen: true,
      jenis_status: isMedia ? 'media' : 'teks',
      path_media: isMedia && statusMediaPreview ? statusMediaPreview : null,
      warna_latar: activeBg.hex,
      gradient: activeBg.class,
      hasKnownGradient: true,
      content: contentText,
      viewersCount: 0,
      viewers: [],
    };
    setMyStatuses((prev) => [localItem, ...prev]);
    setStatusMediaFile(null);
    setStatusMediaPreview('');
    showToast('Status dibagikan (Simulasi 24 jam)');
    setCurrentScreen('UI-005');
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
      : DEMO_ACCOUNTS.filter((u) => !authUser || Number(u.id_pengguna) !== Number(authUser.id_pengguna)).map(
          (u) => ({
            id: Number(u.id_pengguna),
            name: u.nama_profil,
            phone: u.no_telepon,
          })
        );

  const renderMainTopHeader = () => (
    <div className="px-5 pt-2 pb-2.5 space-y-2.5 shrink-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white wallpaper-text-crisp">
            WhatsApp
          </h1>
          <p className="text-[10.5px] font-medium text-slate-700 dark:text-slate-300/90 wallpaper-text-crisp flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isBackendMode ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
            />
            <span className="truncate max-w-[200px]">
              {displayUserName} · {isBackendMode ? 'Terhubung DB' : 'Mode Simulasi'}
            </span>
          </p>
        </div>

        <StageGlass
          as="button"
          type="button"
          stageRef={stageRef}
          wallpaper={wallpaper}
          isDark={isDark}
          variant="orb"
          radius={18}
          onClick={() => {
            setSearchOpen((prev) => !prev);
            setSearchQuery('');
          }}
          aria-label="Cari percakapan"
          className="w-9 h-9 cursor-pointer active:scale-95 transition-transform"
          innerClassName="flex items-center justify-center text-slate-900 dark:text-slate-100"
        >
          {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
        </StageGlass>
      </div>

      {searchOpen && (
        <StageGlass
          stageRef={stageRef}
          wallpaper={wallpaper}
          isDark={isDark}
          variant="elevated"
          radius={20}
          className="w-full"
          innerClassName="px-4 py-2 flex items-center gap-2"
        >
          <Search className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 shrink-0" />
          <input
            id="chat-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kontak atau pesan..."
            autoFocus
            className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none"
          />
        </StageGlass>
      )}
    </div>
  );

  const renderBottomLiquidDock = (activeTab) => (
    <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-4 z-20 flex items-center justify-between gap-2 sm:gap-2.5 pointer-events-none">
      <StageGlass
        stageRef={stageRef}
        wallpaper={wallpaper}
        isDark={isDark}
        variant="dock"
        radius={999}
        className="pointer-events-auto flex-1 min-w-0 max-w-[238px]"
        innerClassName="p-1 sm:p-1.5 flex items-center gap-1"
      >
        <button
          type="button"
          onClick={() => setCurrentScreen('UI-003')}
          className={`flex-1 min-w-0 py-2 px-2 sm:py-2.5 sm:px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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
          onClick={() => setCurrentScreen('UI-005')}
          className={`flex-1 min-w-0 py-2 px-2 sm:py-2.5 sm:px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'STATUS'
              ? 'bg-slate-900/25 dark:bg-white/20 text-white shadow-sm'
              : 'text-slate-900/80 dark:text-white/75 hover:text-slate-950 dark:hover:text-white'
          }`}
        >
          <Aperture className="w-3.5 h-3.5 shrink-0" />
          <span>Status</span>
          {hasUnseenStatus && <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs shrink-0" />}
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
          className="w-12 h-12 sm:w-[52px] sm:h-[52px] cursor-pointer pointer-events-auto shrink-0 active:scale-95 transition-transform"
          innerClassName="flex items-center justify-center text-white"
        >
          <MessageSquarePlus className="w-5 h-5" />
        </StageGlass>
      ) : (
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
          <StageGlass
            as="button"
            type="button"
            stageRef={stageRef}
            wallpaper={wallpaper}
            isDark={isDark}
            variant="orb"
            radius={22}
            onClick={() => {
              setStatusMode('teks');
              setCurrentScreen('UI-006');
            }}
            aria-label="Buat status teks"
            className="w-10 h-10 sm:w-11 sm:h-11 cursor-pointer active:scale-95 transition-transform"
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
            onClick={() => {
              setStatusMode('gambar');
              setCurrentScreen('UI-006');
            }}
            aria-label="Buat status media"
            className="w-11 h-11 sm:w-[52px] sm:h-[52px] cursor-pointer active:scale-95 transition-transform"
            innerClassName="flex items-center justify-center text-white"
          >
            <Camera className="w-5 h-5" />
          </StageGlass>
        </div>
      )}
    </div>
  );

  const recentStories = stories.filter((s) => !s.seen);
  const viewedStories = stories.filter((s) => s.seen);
  const currentViewedStory = viewingStoryDeck
    ? viewingStoryDeck.items[viewingStoryDeck.index] || null
    : null;
  const activeCreateBg = STATUS_BACKGROUNDS[statusBgIndex] || STATUS_BACKGROUNDS[0];
  const otpTimerLabel = `00:${String(otpCountdown).padStart(2, '0')}`;

  return (
    <div className="h-full w-full flex flex-col items-center justify-between py-2 px-2.5 sm:py-4 sm:px-4">
      {/* Studio Top Bar */}
      <header className="w-full max-w-3xl flex items-center justify-between gap-1.5 sm:gap-2 mb-1.5 sm:mb-2.5 px-1 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white shadow-sm shrink-0"
            style={{
              background:
                'radial-gradient(circle at 32% 22%, rgba(255,255,255,0.42) 0%, transparent 48%), linear-gradient(160deg, rgba(34,139,87,0.8) 0%, rgba(17,94,58,0.92) 100%)',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8), 0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            <Droplets className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-semibold tracking-tight text-slate-900 dark:text-white leading-none truncate">
                WhatsApp <span className="font-normal text-slate-500 dark:text-slate-400">PPPL</span>
              </h1>
              <span className="hidden md:inline-flex whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-black/10 dark:border-white/15">
                @samasante/liquid-glass
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 truncate">
              {SCREEN_META[currentScreen] || ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Account & Session Switcher */}
          <button
            type="button"
            onClick={() => setShowAccountMenu((prev) => !prev)}
            aria-label="Menu akun & sesi"
            title={`${displayUserName} (${isBackendMode ? 'Terhubung DB' : 'Mode Simulasi'})`}
            className="rounded-full p-1 pr-1.5 sm:px-2.5 sm:py-1 flex items-center gap-1.5 cursor-pointer bg-white/45 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/15 shadow-sm active:scale-95 transition-transform"
          >
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center relative shrink-0">
              {initials}
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-white dark:ring-slate-900 ${
                  isBackendMode ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            </span>
            <span className="hidden sm:inline text-[11px] font-medium text-slate-700 dark:text-slate-200 max-w-[84px] truncate">
              {displayUserName.split(' ')[0]}
            </span>
          </button>

          {/* Wallpaper Switcher */}
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
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br ${wp.swatch} transition-all cursor-pointer flex items-center justify-center ${
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

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => setIsDark((d) => !d)}
            aria-label="Ubah Tema Terang atau Gelap"
            className="rounded-full p-1 flex items-center gap-0.5 sm:gap-1 cursor-pointer bg-white/45 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/15 shadow-sm active:scale-95 transition-transform"
          >
            <span
              className={`px-1.5 py-1 sm:px-2 sm:py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${
                !isDark
                  ? 'bg-white/90 text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Light</span>
            </span>
            <span
              className={`px-1.5 py-1 sm:px-2 sm:py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${
                isDark
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dark</span>
            </span>
          </button>
        </div>
      </header>

      {/* Main Smartphone Viewport Shell */}
      <main
        id="phone-stage"
        ref={stageRef}
        className="relative w-full max-w-[388px] flex-1 min-h-0 max-h-[756px] rounded-[34px] sm:rounded-[46px] device-shell overflow-hidden flex flex-col select-none"
      >
        <WallpaperLayer wallpaper={wallpaper} isDark={isDark} />

        {/* Android Status Bar Minimalis */}
        <div className="relative z-20 px-7 pt-3.5 pb-1.5 flex items-center justify-between text-[11px] font-semibold tracking-tight text-slate-900 dark:text-white/95 wallpaper-text-crisp shrink-0">
          <span>09:41</span>
          <div className="w-20 h-4 rounded-full bg-black/15 dark:bg-white/10 backdrop-blur-md border border-white/25" />
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5" />
            <BatteryFull className="w-4 h-4" />
          </div>
        </div>

        {/* Non-Intrusive Toast */}
        <div
          className={`pointer-events-none absolute top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-white/75 dark:bg-slate-900/80 backdrop-blur-xl border border-white/60 dark:border-white/15 text-xs font-medium text-slate-900 dark:text-white shadow-lg transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
            toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{toast.message}</span>
        </div>

        {/* Floating Account & Session Drawer inside Phone Stage */}
        {showAccountMenu && (
          <div
            className="absolute inset-0 z-40 bg-black/35 backdrop-blur-xs flex items-start justify-center p-3 pt-12"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAccountMenu(false);
            }}
          >
            <StageGlass
              stageRef={stageRef}
              wallpaper={wallpaper}
              isDark={isDark}
              variant="elevated"
              radius={28}
              className="w-full"
              innerClassName="p-4 flex-col items-stretch space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {displayUserName}
                    </div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isBackendMode ? 'bg-emerald-500' : 'bg-amber-400'
                        }`}
                      />
                      <span>{isBackendMode ? 'Sesi PHP & MySQL Aktif' : 'Mode Simulasi Offline'}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAccountMenu(false)}
                  aria-label="Tutup menu akun"
                  className="w-7 h-7 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300 cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAccountMenu(false);
                    setCurrentScreen('UI-001');
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Login OTP (UI-001)
                </button>
                {isBackendMode && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar</span>
                  </button>
                )}
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 px-1 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>Ganti Akun Praktikum</span>
                </p>
                <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
                  {demoUsers.map((u) => {
                    const isCurrent =
                      (authUser && Number(authUser.id_pengguna) === Number(u.id_pengguna)) ||
                      (!authUser && displayUserName === u.nama_profil);
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
            </StageGlass>
          </div>
        )}

        {/* Dynamic Screen Container */}
        <div id="app-viewport" className="relative z-10 flex-1 flex flex-col overflow-hidden">
          {currentScreen === 'UI-001' && (
            <div className="flex-1 flex flex-col justify-between px-6 pt-8 pb-6">
              <div>
                <StageGlass
                  stageRef={stageRef}
                  wallpaper={wallpaper}
                  isDark={isDark}
                  variant="emeraldOrb"
                  radius={28}
                  className="w-14 h-14 mb-6"
                  innerClassName="flex items-center justify-center text-white"
                >
                  <MessageCircle className="w-7 h-7" />
                </StageGlass>

                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white wallpaper-text-crisp">
                  Masukkan nomor telepon
                </h2>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 mt-2 wallpaper-text-crisp">
                  WhatsApp akan mengirimkan kode verifikasi OTP 6 digit melalui SMS ke nomor Anda.
                </p>

                <div className="mt-7 space-y-3 relative">
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
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => {
                          setPhoneNumber(e.target.value);
                          setPhoneError(false);
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
                      <span>Format nomor telepon tidak valid. Masukkan minimal 8 digit.</span>
                    </StageGlass>
                  ) : (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 px-1 wallpaper-text-crisp">
                      Tarif SMS standar operator mungkin berlaku. Akun uji: 812-3456-7801 s/d 7806.
                    </p>
                  )}
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
                onClick={() => requestOtpCode(false)}
                className="w-full cursor-pointer active:scale-[0.98] transition-transform disabled:opacity-70"
                innerClassName="py-3.5 text-white text-sm font-semibold tracking-wide flex items-center justify-center gap-2"
              >
                <span>{isSubmittingAuth ? 'MENGIRIM...' : 'LANJUT'}</span>
                <ArrowRight className="w-4 h-4" />
              </StageGlass>
            </div>
          )}

          {currentScreen === 'UI-002' && (
            <div className="flex-1 flex flex-col justify-between px-6 pt-4 pb-6">
              <div>
                <StageGlass
                  as="button"
                  type="button"
                  stageRef={stageRef}
                  wallpaper={wallpaper}
                  isDark={isDark}
                  variant="orb"
                  radius={18}
                  onClick={() => setCurrentScreen('UI-001')}
                  className="w-9 h-9 mb-5 cursor-pointer active:scale-95 transition-transform"
                  innerClassName="flex items-center justify-center text-slate-900 dark:text-slate-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                </StageGlass>

                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white wallpaper-text-crisp">
                  Verifikasi kode OTP
                </h2>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 mt-2 wallpaper-text-crisp">
                  Masukkan 6 digit kode yang dikirim ke{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">{pendingPhone}</span>.{' '}
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('UI-001')}
                    className="text-emerald-700 dark:text-emerald-300 font-semibold underline underline-offset-2 cursor-pointer"
                  >
                    Salah nomor?
                  </button>
                </p>

                <div className="mt-6 grid grid-cols-6 gap-2">
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
                        className="w-full h-full bg-transparent text-center text-base font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60 rounded-2xl"
                      />
                    </StageGlass>
                  ))}
                </div>

                {otpDebugCode && (
                  <p className="mt-3 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium px-1 wallpaper-text-crisp">
                    Kode OTP Localhost: <span className="font-bold tracking-wider">{otpDebugCode}</span>
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 px-1 wallpaper-text-crisp">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                    Kirim ulang SMS dalam{' '}
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

                <StageGlass
                  stageRef={stageRef}
                  wallpaper={wallpaper}
                  isDark={isDark}
                  variant="card"
                  radius={16}
                  className="mt-6 w-full"
                  innerClassName="p-1.5 flex items-center justify-between"
                >
                  <button
                    type="button"
                    onClick={() => setIsNewUser(true)}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-medium transition-all cursor-pointer ${
                      isNewUser
                        ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Pengguna Baru (→ UI-008)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewUser(false)}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-medium transition-all cursor-pointer ${
                      !isNewUser
                        ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Pengguna Lama (→ UI-003)
                  </button>
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
                onClick={handleVerifyOtp}
                className="w-full cursor-pointer active:scale-[0.98] transition-transform disabled:opacity-70"
                innerClassName="py-3.5 text-white text-sm font-semibold tracking-wide flex items-center justify-center"
              >
                {isSubmittingAuth ? 'MEMVERIFIKASI...' : 'VERIFIKASI'}
              </StageGlass>
            </div>
          )}

          {currentScreen === 'UI-008' && (
            <div className="flex-1 flex flex-col justify-between px-6 pt-6 pb-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white wallpaper-text-crisp">
                  Info Profil Anda
                </h2>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 mt-2 wallpaper-text-crisp">
                  Masukkan nama profil yang akan ditampilkan kepada kontak Anda. Foto profil bersifat opsional.
                </p>

                <div className="mt-8 flex flex-col items-center">
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
                      ) : hasProfilePhoto ? (
                        <div className="w-full h-full rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-2xl font-semibold">
                          {initials}
                        </div>
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
                        showToast('Foto profil dihapus');
                      } else {
                        profileFileRef.current?.click();
                      }
                    }}
                    className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-300 mt-3 wallpaper-text-crisp cursor-pointer"
                  >
                    {hasProfilePhoto ? 'Hapus foto profil' : '+ Tambah Foto'}
                  </button>
                </div>

                <div className="mt-7">
                  <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 mb-1.5 px-1 wallpaper-text-crisp">
                    <span>Nama Lengkap (Wajib)</span>
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
                      type="text"
                      maxLength={50}
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Contoh: Muhammad Rifa"
                      className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                    />
                  </StageGlass>
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
                onClick={handleSaveProfile}
                className="w-full cursor-pointer active:scale-[0.98] transition-transform disabled:opacity-70"
                innerClassName="py-3.5 text-white text-sm font-semibold tracking-wide flex items-center justify-center"
              >
                {isSubmittingAuth ? 'MENYIMPAN...' : 'SIMPAN'}
              </StageGlass>
            </div>
          )}

          {currentScreen === 'UI-003' && (
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {renderMainTopHeader()}

              <div id="chat-list-container" className="flex-1 overflow-y-auto no-scrollbar px-4 pb-24 space-y-2.5">
                {filteredContacts.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-700 dark:text-slate-300 wallpaper-text-crisp">
                    Tidak ada obrolan yang cocok.
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

                    return (
                      <StageGlass
                        key={chat.id}
                        stageRef={stageRef}
                        wallpaper={wallpaper}
                        isDark={isDark}
                        variant="card"
                        radius={26}
                        onClick={() => openChat(chat.id)}
                        className="w-full cursor-pointer active:scale-[0.988] transition-transform"
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

              {renderBottomLiquidDock('CHAT')}

              {showNewChatModal && (
                <div
                  className="absolute inset-0 z-30 bg-black/30 backdrop-blur-xs flex items-end p-3"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) setShowNewChatModal(false);
                  }}
                >
                  <StageGlass
                    stageRef={stageRef}
                    wallpaper={wallpaper}
                    isDark={isDark}
                    variant="elevated"
                    radius={30}
                    className="w-full"
                    innerClassName="p-5 flex-col items-stretch space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Pilih Kontak</h4>
                      <button
                        type="button"
                        onClick={() => setShowNewChatModal(false)}
                        className="w-7 h-7 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-60 overflow-y-auto no-scrollbar">
                      {contacts.map((c) => (
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
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {c.statusText}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </StageGlass>
                </div>
              )}
            </div>
          )}

          {currentScreen === 'UI-004' && activeContact && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 pt-1 pb-2.5 shrink-0">
                <StageGlass
                  stageRef={stageRef}
                  wallpaper={wallpaper}
                  isDark={isDark}
                  variant="elevated"
                  radius={26}
                  className="w-full"
                  innerClassName="px-3 py-2.5 flex items-center gap-3"
                >
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('UI-003')}
                    aria-label="Kembali ke daftar chat"
                    className="w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${activeContact.gradient} flex items-center justify-center text-white text-xs font-semibold shrink-0`}
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
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {activeContact.statusText}
                    </p>
                  </div>
                </StageGlass>
              </div>

              <div
                ref={chatScrollRef}
                id="chat-messages-scroll"
                className="flex-1 overflow-y-auto no-scrollbar px-4 py-2 space-y-2.5"
              >
                <div className="flex justify-center my-2">
                  <MaterialGlass
                    isDark={isDark}
                    variant="incoming"
                    radius={16}
                    className="px-3.5 py-2 max-w-[88%] text-center"
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="text-[10.5px] leading-snug text-slate-700 dark:text-slate-200">
                        Pesan dienkripsi secara <strong>end-to-end</strong>. Hanya Anda dan {activeContact.name} yang
                        dapat membacanya.
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
                            className={`max-w-[80%] px-3.5 py-2.5 ${
                              isMe
                                ? 'rounded-br-md text-slate-900 dark:text-white'
                                : 'rounded-bl-md text-slate-800 dark:text-slate-100'
                            }`}
                          >
                            <p className="text-[13px] leading-relaxed break-words">{msg.text}</p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span className="text-[10px] text-slate-600 dark:text-slate-400">{msg.time}</span>
                              {isMe && <TickIcon tick={msg.tick} />}
                            </div>
                          </MaterialGlass>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="px-4 pt-2 pb-2 shrink-0 flex items-center gap-2">
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
          )}

          {currentScreen === 'UI-005' && (
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {renderMainTopHeader()}

              <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-24 space-y-4">
                <StageGlass
                  stageRef={stageRef}
                  wallpaper={wallpaper}
                  isDark={isDark}
                  variant="card"
                  radius={26}
                  onClick={() => {
                    if (myStatusPosted) {
                      openMyStory();
                    } else {
                      setStatusMode('teks');
                      setCurrentScreen('UI-006');
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
                        setStatusMode('teks');
                        setCurrentScreen('UI-006');
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
                          radius={26}
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
                            <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">{story.time}</p>
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
                          radius={26}
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
                            <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">{story.time}</p>
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

              {renderBottomLiquidDock('STATUS')}

              {currentViewedStory && (
                <div
                  onClick={() => {
                    if (showViewersDrawer) {
                      setShowViewersDrawer(false);
                    } else {
                      setViewingStoryDeck(null);
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
                  } flex flex-col justify-between p-5 text-white cursor-pointer`}
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
                            {currentViewedStory.time} · Hilang dalam 24 jam
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
                          onClick={() => setViewingStoryDeck(null)}
                          className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="my-auto text-center px-3 space-y-4">
                    {currentViewedStory.jenis_status === 'media' && currentViewedStory.path_media && (
                      <div className="flex justify-center">
                        <img
                          src={currentViewedStory.path_media}
                          alt="Media status"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                          className="max-h-60 rounded-2xl object-contain shadow-lg border border-white/25"
                        />
                      </div>
                    )}
                    {currentViewedStory.content && (
                      <p className="text-xl font-semibold leading-relaxed drop-shadow">
                        {currentViewedStory.content}
                      </p>
                    )}
                  </div>

                  {viewingStoryDeck.isMine ? (
                    <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-center gap-2">
                      {showViewersDrawer && (
                        <div className="w-full rounded-2xl bg-black/45 backdrop-blur-xl border border-white/20 p-3 max-h-40 overflow-y-auto no-scrollbar space-y-1.5">
                          <div className="text-[11px] font-semibold text-white/90">
                            Dilihat oleh ({currentViewedStory.viewersCount})
                          </div>
                          {currentViewedStory.viewers.length === 0 ? (
                            <div className="text-[11px] text-white/70">Belum ada kontak yang melihat status ini.</div>
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
                    <div className="text-center text-[11px] text-white/75">Ketuk di mana saja untuk menutup</div>
                  )}
                </div>
              )}
            </div>
          )}

          {currentScreen === 'UI-006' && (
            <div
              className={`flex-1 flex flex-col justify-between p-4 relative overflow-hidden rounded-t-[32px] bg-gradient-to-br ${activeCreateBg.class} text-white`}
            >
              <div className="relative z-20 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentScreen('UI-005')}
                  aria-label="Batal buat status"
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
                    onClick={() => setCurrentScreen('UI-007')}
                    className="px-3.5 py-1.5 rounded-full bg-black/25 backdrop-blur-xl border border-white/25 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>{privacyLabels[statusPrivacy]}</span>
                  </button>
                </div>
              </div>

              <div className="relative z-20 my-auto px-3">
                {statusMode === 'teks' ? (
                  <textarea
                    rows={4}
                    value={statusText}
                    onChange={(e) => setStatusText(e.target.value)}
                    placeholder="Ketik status Anda..."
                    className="w-full bg-transparent text-center text-xl font-semibold leading-relaxed text-white placeholder-white/60 focus:outline-none resize-none"
                  />
                ) : (
                  <div className="rounded-[28px] bg-white/15 backdrop-blur-2xl border border-white/30 p-4 text-center space-y-3 shadow-xl">
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
                      className="w-full h-44 rounded-2xl bg-gradient-to-tr from-white/20 to-white/5 border border-white/20 flex flex-col items-center justify-center gap-2 overflow-hidden cursor-pointer relative"
                    >
                      {statusMediaPreview ? (
                        <img
                          src={statusMediaPreview}
                          alt="Pratinjau gambar status"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <>
                          <ImageIcon className="w-9 h-9 text-white/85" />
                          <span className="text-xs font-medium text-white/90">
                            Ketuk untuk pilih gambar (JPG/PNG/WEBP)
                          </span>
                        </>
                      )}
                    </button>
                    <input
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

          {currentScreen === 'UI-007' && (
            <div className="flex-1 flex flex-col justify-between px-5 pt-3 pb-5 overflow-hidden">
              <div className="flex items-center gap-3 mb-4 shrink-0">
                <StageGlass
                  as="button"
                  type="button"
                  stageRef={stageRef}
                  wallpaper={wallpaper}
                  isDark={isDark}
                  variant="orb"
                  radius={18}
                  onClick={() => setCurrentScreen('UI-006')}
                  className="w-9 h-9 cursor-pointer active:scale-95 transition-transform"
                  innerClassName="flex items-center justify-center text-slate-800 dark:text-slate-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                </StageGlass>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white wallpaper-text-crisp">
                  Privasi Status
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar pr-0.5 space-y-2.5 pb-3">
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
                      innerClassName="p-3.5 flex items-start gap-3"
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
                    innerClassName="p-3.5 flex-col items-stretch space-y-2"
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
                    <div className="space-y-1 max-h-32 overflow-y-auto no-scrollbar">
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
                  setCurrentScreen('UI-006');
                }}
                className="w-full shrink-0 mt-2 cursor-pointer active:scale-[0.98] transition-transform"
                innerClassName="py-3.5 text-white text-sm font-semibold tracking-wide flex items-center justify-center"
              >
                SELESAI
              </StageGlass>
            </div>
          )}
        </div>

        {/* Gesture Home Indicator Bar */}
        <div className="relative z-20 py-2 flex justify-center shrink-0">
          <div className="w-32 h-1 rounded-full bg-slate-900/25 dark:bg-white/30" />
        </div>
      </main>

      {/* Bottom Quick Screen Switcher */}
      <footer className="w-full max-w-5xl mt-1.5 sm:mt-2.5 px-1 shrink-0 flex justify-center">
        <div className="rounded-full p-1 sm:p-1.5 flex items-center gap-1 max-w-full overflow-x-auto no-scrollbar bg-white/45 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/15 shadow-sm">
          {SCREEN_NAV_ITEMS.map((item) => {
            const isCurrent = item.id === currentScreen;
            return (
              <button
                key={item.id}
                ref={(el) => {
                  navChipRefs.current[item.id] = el;
                }}
                type="button"
                onClick={() => setCurrentScreen(item.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                  isCurrent
                    ? 'font-semibold bg-emerald-500 text-white shadow-sm'
                    : 'font-medium text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/10'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </footer>
    </div>
  );
}
