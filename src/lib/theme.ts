import type { AccentTheme, PolarityMode, Settings, TelemetryMode, Theme } from '@/types';

export interface AccentCartridgeMeta {
  id: AccentTheme;
  label: string;
  description: string;
  swatchDark: string;
  swatchLight: string;
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const ACCENT_CARTRIDGES: AccentCartridgeMeta[] = [
  {
    id: 'obsidian',
    label: 'Obsidian Ink',
    description: 'High-contrast monochrome editorial ink that adapts cleanly between Carbon Dark and Warm Paper Light.',
    swatchDark: '#F5F5F5',
    swatchLight: '#1A1A1A',
    price: 0,
    rarity: 'common',
  },
  {
    id: 'ember',
    label: 'Ember Signal',
    description: 'International Orange Swiss kinetic accent for high-focus tactile cues.',
    swatchDark: '#EF6443',
    swatchLight: '#EF6443',
    price: 0,
    rarity: 'common',
  },
  {
    id: 'ocean',
    label: 'Cobalt Blue',
    description: 'Precision drafting blue cartridge for calm structural focus.',
    swatchDark: '#3B82F6',
    swatchLight: '#2563EB',
    price: 100,
    rarity: 'common',
  },
  {
    id: 'forest',
    label: 'Signal Green',
    description: 'Clean instrument emerald ink for momentum and continuity.',
    swatchDark: '#22C55E',
    swatchLight: '#16A34A',
    price: 120,
    rarity: 'rare',
  },
  {
    id: 'violet',
    label: 'Ultraviolet',
    description: 'Deep studio violet cartridge for deliberate deep-work sessions.',
    swatchDark: '#8B5CF6',
    swatchLight: '#7C3AED',
    price: 150,
    rarity: 'rare',
  },
  {
    id: 'gold',
    label: 'Amber Brass',
    description: 'Warm precision brass ink inspired by mechanical chronograph indices.',
    swatchDark: '#EAB308',
    swatchLight: '#CA8A04',
    price: 200,
    rarity: 'epic',
  },
  {
    id: 'rose',
    label: 'Crimson Ink',
    description: 'Sharp Swiss vermilion-rose cartridge for urgent execution cadence.',
    swatchDark: '#F43F5E',
    swatchLight: '#E11D48',
    price: 200,
    rarity: 'epic',
  },
  {
    id: 'cyan',
    label: 'Cyan Grid',
    description: 'Technical blueprint cyan for crisp telemetry readouts.',
    swatchDark: '#06B6D4',
    swatchLight: '#0891B2',
    price: 250,
    rarity: 'legendary',
  },
];

export const FREE_STARTER_THEMES: AccentTheme[] = ['obsidian', 'ember'];

const LEGACY_THEME_MAP: Record<string, AccentTheme> = {
  obsidian: 'obsidian',
  indigo: 'obsidian',
  midnight: 'obsidian',
  monochrome: 'obsidian',
  ember: 'ember',
  sunset: 'ember',
  pastel: 'ember',
  ocean: 'ocean',
  forest: 'forest',
  emerald: 'forest',
  violet: 'violet',
  galaxy: 'violet',
  gold: 'gold',
  amber: 'gold',
  cyberpunk: 'gold',
  rose: 'rose',
  neon: 'rose',
  cyan: 'cyan',
  aurora: 'cyan',
  cherry: 'rose',
  volcanic: 'ember',
};

export const LEGACY_SHOP_ITEM_MAP: Record<string, string> = {
  ...LEGACY_THEME_MAP,
  icons_3d: 'acoustic_switch_pack',
};

export function normalizeAccentTheme(theme?: string | null): AccentTheme {
  if (!theme) return 'obsidian';
  return LEGACY_THEME_MAP[theme] ?? 'obsidian';
}

export function normalizeShopItemId(itemId: string): string {
  return LEGACY_SHOP_ITEM_MAP[itemId] ?? itemId;
}

export function normalizeUnlockedThemes(themes?: string[] | null): AccentTheme[] {
  const result = new Set<AccentTheme>(FREE_STARTER_THEMES);
  for (const raw of themes ?? []) {
    result.add(normalizeAccentTheme(raw));
  }
  return Array.from(result);
}

export function resolvePolarityMode(settings?: Pick<Settings, 'polarity' | 'darkMode'> | null): PolarityMode {
  const mode = settings?.polarity ?? settings?.darkMode ?? 'dark';
  if (mode === 'light' || mode === 'dark' || mode === 'system') return mode;
  return 'dark';
}

export function resolveTelemetryMode(
  settings?: Pick<Settings, 'telemetryMode'> | null,
  level?: number
): TelemetryMode {
  if (settings?.telemetryMode) return settings.telemetryMode;
  if (typeof level === 'number' && level >= 5) return 'instrument';
  return 'scaffold';
}

export function getEffectivePolarity(mode: PolarityMode): 'dark' | 'light' {
  if (mode === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  }
  return mode;
}

export function applyAppearanceToDocument(
  polarityMode: PolarityMode,
  theme?: Theme | string | null
): 'dark' | 'light' {
  const effectivePolarity = getEffectivePolarity(polarityMode);
  const accent = normalizeAccentTheme(theme);

  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.setAttribute('data-polarity', effectivePolarity);
    root.setAttribute('data-theme', accent);
    root.classList.toggle('dark', effectivePolarity === 'dark');
    root.classList.toggle('light', effectivePolarity === 'light');

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', effectivePolarity === 'dark' ? '#0B0B0E' : '#F4F2ED');
    }
  }

  return effectivePolarity;
}
