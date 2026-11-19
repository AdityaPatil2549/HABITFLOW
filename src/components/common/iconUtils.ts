import { CURATED_LUCIDE_NAMES } from './habitIcons';

export const EMOJI_REGEX =
  /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji_Modifier_Base}|\p{Emoji_Component}|\s)+$/u;

export const LUCIDE_ALIASES: Record<string, string> = {
  home: 'House',
  house: 'House',
  checkcircle: 'CircleCheck',
  'check-circle': 'CircleCheck',
  checkcircle2: 'CircleCheck',
  'circle-check': 'CircleCheck',
  linechart: 'ChartLine',
  'line-chart': 'ChartLine',
  chartline: 'ChartLine',
  target: 'Target',
  fire: 'Flame',
  flame: 'Flame',
  water: 'Droplets',
  droplets: 'Droplets',
  sleep: 'BedDouble',
  gym: 'Dumbbell',
  dumbbell: 'Dumbbell',
  code: 'Code',
  walk: 'Footprints',
  footprints: 'Footprints',
  bike: 'Bike',
  read: 'BookOpen',
  book: 'BookOpen',
  'book-open': 'BookOpen',
  bookopen: 'BookOpen',
  run: 'Activity',
  heart: 'Heart',
  zap: 'Zap',
  sun: 'Sun',
  moon: 'Moon',
  coffee: 'Coffee',
  trophy: 'Trophy',
  money: 'Coins',
  coins: 'Coins',
  wallet: 'Wallet',
};

export function resolveLucideIconName(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const clean = raw.replace(/^lucide:/i, '').trim();
  if (!clean) return null;

  const lower = clean.toLowerCase();
  if (LUCIDE_ALIASES[lower]) {
    return LUCIDE_ALIASES[lower];
  }

  // Check direct PascalCase against curated icons
  const pascal = clean.replace(/(^\w|-\w|_\w)/g, m => m.replace(/[-_]/, '').toUpperCase());
  if (CURATED_LUCIDE_NAMES.has(pascal)) {
    return pascal;
  }

  // Case-insensitive lookup against curated icons
  for (const name of CURATED_LUCIDE_NAMES) {
    if (name.toLowerCase() === lower) return name;
  }

  return pascal.length > 0 ? pascal : null;
}

export function isEmojiIcon(raw?: string | null): boolean {
  if (!raw || typeof raw !== 'string') return false;
  return EMOJI_REGEX.test(raw.trim());
}

export function isIconifyId(raw?: string | null): boolean {
  if (!raw || typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  return trimmed.includes(':') && !trimmed.toLowerCase().startsWith('lucide:');
}
