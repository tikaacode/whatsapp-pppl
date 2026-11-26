/**
 * Y2K Glossy Neo-Retro theme presets for WhatsNew.
 * Default "acid-yellow" fuses ui-references/new-ui-1.jpg (Phoning Chat)
 * and ui-references/new-ui-2.jpg (Periwinkle Sky Hub).
 */
export const Y2K_THEMES = [
  {
    id: 'acid-yellow',
    label: 'Acid Yellow',
    subtitle: 'Kuning Neon & Lime Gloss (Default)',
    swatch: 'linear-gradient(135deg, #FEFE00 0%, #9CE74E 55%, #699AF7 100%)',
    sendFill: '#95E23C',
    tickColor: '#69C616',
  },
  {
    id: 'sky-blue',
    label: 'Sky Blue',
    subtitle: 'Biru Periwinkle & Ice Gloss',
    swatch: 'linear-gradient(135deg, #5B78F8 0%, #A9C6FF 55%, #9CE74E 100%)',
    sendFill: '#7EA6FF',
    tickColor: '#3B64E6',
  },
  {
    id: 'candy-pink',
    label: 'Candy Pink',
    subtitle: 'Bubblegum Pink & Pastel Gloss',
    swatch: 'linear-gradient(135deg, #FF8FCE 0%, #FFD4EC 55%, #FEFE00 100%)',
    sendFill: '#FF8FCE',
    tickColor: '#D9368B',
  },
];

export const DEFAULT_Y2K_THEME_ID = 'acid-yellow';

export function getY2KTheme(themeId) {
  return Y2K_THEMES.find((t) => t.id === themeId) || Y2K_THEMES[0];
}

const RETRO_AVATAR_STYLES = [
  'linear-gradient(180deg, #FFFFFF 0%, #D8F8B2 52%, #95E23C 100%)',
  'linear-gradient(180deg, #FFFFFF 0%, #FFD2EA 52%, #FF9AD0 100%)',
  'linear-gradient(180deg, #FFFFFF 0%, #B7CEFF 52%, #7CA2FF 100%)',
  'linear-gradient(180deg, #FFFFFF 0%, #FFF4A8 52%, #FFE629 100%)',
  'linear-gradient(180deg, #FFFFFF 0%, #E1D4FF 52%, #B49CFF 100%)',
  'linear-gradient(180deg, #FFFFFF 0%, #C6F7F2 52%, #68E0D4 100%)',
];

export function getRetroAvatarBackground(seed) {
  const str = String(seed ?? '0');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return RETRO_AVATAR_STYLES[hash % RETRO_AVATAR_STYLES.length];
}
