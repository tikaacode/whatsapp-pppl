export const WALLPAPERS = [
  {
    id: 'bliss-hills',
    label: 'Bliss Hills (Bukit Hijau & Langit Cerah)',
    swatch: 'from-sky-400 via-emerald-400 to-green-600',
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80',
    fallbackGradient: 'linear-gradient(180deg, #7dd3fc 0%, #bae6fd 38%, #4ade80 65%, #15803d 100%)',
    behindLight: '#66b888',
    behindDark: '#142e22',
  },
  {
    id: 'meadow-stream',
    label: 'Meadow Stream (Aliran Sungai & Padang Rumput)',
    swatch: 'from-blue-400 via-teal-400 to-emerald-700',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
    fallbackGradient: 'linear-gradient(180deg, #60a5fa 0%, #93c5fd 35%, #34d399 68%, #065f46 100%)',
    behindLight: '#5aa698',
    behindDark: '#102a27',
  },
  {
    id: 'sunlit-bokeh',
    label: 'Sunlit Flora Bokeh (Taman Bunga & Dedaunan)',
    swatch: 'from-lime-400 via-emerald-500 to-teal-700',
    url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1000&q=80',
    fallbackGradient: 'radial-gradient(circle at 30% 25%, #bef264 0%, #4ade80 42%, #15803d 100%)',
    behindLight: '#5da65a',
    behindDark: '#142d1a',
  },
  {
    id: 'emerald-mist',
    label: 'Emerald Mist (Pegunungan & Kabut Senja)',
    swatch: 'from-emerald-700 via-teal-800 to-slate-900',
    url: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1000&q=80',
    fallbackGradient: 'linear-gradient(180deg, #134e4a 0%, #064e3b 50%, #022c22 100%)',
    behindLight: '#2c5b4f',
    behindDark: '#091f1a',
  },
  {
    id: 'pure-mesh',
    label: 'Botanical Studio Mesh (Sage & Forest Canopy)',
    swatch: 'from-[#8DA896] via-[#5E7E68] to-[#1F4B2C]',
    url: null,
    fallbackGradient: '',
    behindLight: '#738A7B',
    behindDark: '#122B14',
  },
];

export const COUNTRY_OPTIONS = [
  { code: '+62', label: 'Indonesia', flag: '🇮🇩' },
  { code: '+60', label: 'Malaysia', flag: '🇲🇾' },
  { code: '+65', label: 'Singapura', flag: '🇸🇬' },
];

export const DEMO_ACCOUNTS = [
  { id_pengguna: 1, no_telepon: '081234567801', nama_profil: 'Budi Santoso', foto_profil: null },
  { id_pengguna: 2, no_telepon: '081234567802', nama_profil: 'Clara Meylan', foto_profil: null },
  { id_pengguna: 3, no_telepon: '081234567803', nama_profil: 'Zaldy Firaz', foto_profil: null },
  { id_pengguna: 4, no_telepon: '081234567804', nama_profil: 'Tika Wahyuni', foto_profil: null },
  { id_pengguna: 5, no_telepon: '081234567805', nama_profil: 'Raihandy Wijaya', foto_profil: null },
  { id_pengguna: 6, no_telepon: '081234567806', nama_profil: 'Muhammad Rifa', foto_profil: null },
];

export const STATUS_BACKGROUNDS = [
  { name: 'Emerald Forest', hex: '#075e54', class: 'from-emerald-700 via-teal-800 to-emerald-950' },
  { name: 'Teal Meadow', hex: '#128c7e', class: 'from-teal-600 via-emerald-700 to-cyan-900' },
  { name: 'Violet Dusk', hex: '#3d0c5a', class: 'from-purple-800 via-fuchsia-800 to-indigo-950' },
  { name: 'Ocean Aurora', hex: '#1b3a4b', class: 'from-sky-800 via-blue-900 to-slate-950' },
  { name: 'Crimson Velvet', hex: '#5c1d24', class: 'from-rose-800 via-red-900 to-slate-950' },
];

const AVATAR_GRADIENTS = [
  'from-emerald-500 to-teal-600',
  'from-sky-500 to-indigo-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-violet-500 to-purple-700',
  'from-cyan-500 to-blue-600',
];

export function getInitials(name) {
  const parts = String(name || '?').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'WA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function getAvatarGradient(seed) {
  const str = String(seed ?? '0');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

export function getStatusGradientByHex(hex) {
  if (!hex) return null;
  const normalized = String(hex).trim().toLowerCase();
  const match = STATUS_BACKGROUNDS.find((bg) => bg.hex.toLowerCase() === normalized);
  return match ? match.class : null;
}

export function mapBackendStatusToTick(status) {
  if (status === 'dibaca') return 'read';
  if (status === 'diterima') return 'delivered';
  return 'sent';
}

export function formatLastSeen(timestamp) {
  if (!timestamp) return 'Online';
  const date = new Date(String(timestamp).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return 'Online';

  const hhmm = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return `Terakhir dilihat hari ini pukul ${hhmm}`;
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return `Terakhir dilihat kemarin pukul ${hhmm}`;
  }
  return `Terakhir dilihat ${date.toLocaleDateString('id-ID')} pukul ${hhmm}`;
}

export const INITIAL_CONTACTS = [
  {
    id: '1',
    contactId: 1,
    conversationId: null,
    name: 'Budi Santoso',
    phone: '081234567801',
    initials: 'BS',
    gradient: 'from-emerald-500 to-teal-600',
    statusText: 'Online',
    time: '10:42',
    lastMessageText: 'Mantap! Nanti siang kita review bareng di Lab RPL ya.',
    lastMessageIsMine: false,
    lastMessageTick: 'read',
    unread: 2,
    messages: [
      { id: 1, from: 'them', text: 'Halo, progres DPPL WhatsApp kelompok kita sudah sampai mana?', time: '10:40', tick: 'read' },
      { id: 2, from: 'me', text: 'Sudah masuk tahap redesign UI Liquid Glass nih!', time: '10:41', tick: 'read' },
      { id: 3, from: 'them', text: 'Mantap! Nanti siang kita review bareng di Lab RPL ya.', time: '10:42', tick: 'read' },
    ],
  },
  {
    id: '2',
    contactId: 2,
    conversationId: null,
    name: 'Clara Meylan',
    phone: '081234567802',
    initials: 'CM',
    gradient: 'from-sky-500 to-indigo-600',
    statusText: 'Terakhir dilihat hari ini pukul 09:15',
    time: '09:30',
    lastMessageText: 'Siap, terima kasih sudah dicek!',
    lastMessageIsMine: false,
    lastMessageTick: 'read',
    unread: 0,
    messages: [
      { id: 1, from: 'me', text: 'Clara, ERD dan kamus data sudah sesuai tabel tbl_status ya.', time: '09:28', tick: 'read' },
      { id: 2, from: 'them', text: 'Siap, terima kasih sudah dicek!', time: '09:30', tick: 'read' },
    ],
  },
  {
    id: '3',
    contactId: 3,
    conversationId: null,
    name: 'Zaldy Firaz',
    phone: '081234567803',
    initials: 'ZF',
    gradient: 'from-amber-500 to-orange-600',
    statusText: 'Online',
    time: 'Kemarin',
    lastMessageText: 'Oke, sampai ketemu besok!',
    lastMessageIsMine: true,
    lastMessageTick: 'delivered',
    unread: 0,
    messages: [
      { id: 1, from: 'them', text: 'Untuk matriks keterunutan SKPL-F-001 sampai F-003 sudah lengkap.', time: '19:12', tick: 'read' },
      { id: 2, from: 'me', text: 'Oke, sampai ketemu besok!', time: '19:15', tick: 'delivered' },
    ],
  },
  {
    id: '4',
    contactId: 4,
    conversationId: null,
    name: 'Tika Wahyuni',
    phone: '081234567804',
    initials: 'TW',
    gradient: 'from-rose-500 to-pink-600',
    statusText: 'Terakhir dilihat kemarin pukul 21:04',
    time: 'Kemarin',
    lastMessageText: 'Activity diagram ACT-001 sampai ACT-003 sudah kuunggah ke repo.',
    lastMessageIsMine: false,
    lastMessageTick: 'read',
    unread: 1,
    messages: [
      { id: 1, from: 'them', text: 'Activity diagram ACT-001 sampai ACT-003 sudah kuunggah ke repo.', time: '20:50', tick: 'read' },
    ],
  },
];

export const INITIAL_STORIES = [
  {
    id: 'story-raihandy',
    id_status: null,
    name: 'Raihandy Wijaya',
    initials: 'RW',
    time: '12 menit lalu',
    seen: false,
    jenis_status: 'teks',
    path_media: null,
    warna_latar: '#075e54',
    gradient: 'from-emerald-700 via-teal-800 to-emerald-950',
    content: 'Menyelesaikan Sequence Diagram SEQ-001 s.d. SEQ-003 ✨',
  },
  {
    id: 'story-tika',
    id_status: null,
    name: 'Tika Wahyuni',
    initials: 'TW',
    time: '45 menit lalu',
    seen: false,
    jenis_status: 'teks',
    path_media: null,
    warna_latar: '#1b3a4b',
    gradient: 'from-sky-800 via-blue-900 to-slate-950',
    content: 'Semangat Final Project Perancangan Perangkat Lunak! 💻',
  },
  {
    id: 'story-clara',
    id_status: null,
    name: 'Clara Meylan',
    initials: 'CM',
    time: '2 jam lalu',
    seen: true,
    jenis_status: 'teks',
    path_media: null,
    warna_latar: '#3d0c5a',
    gradient: 'from-purple-800 via-fuchsia-800 to-indigo-950',
    content: 'Skema MySQL & Enkripsi AES-256-CBC E2EE siap!',
  },
];
