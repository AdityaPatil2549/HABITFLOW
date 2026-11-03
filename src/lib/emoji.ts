/**
 * Universal Habit Emoji Resolver
 * Guarantees that any icon string (legacy lucide name, slug, or emoji)
 * renders as a clean, vibrant Unicode emoji rather than literal text.
 */

const EMOJI_MAP: Record<string, string> = {
  // Reading & Learning
  book: '📚',
  'book-open': '📖',
  bookopen: '📖',
  read: '📚',
  reading: '📚',
  study: '📝',
  pencil: '✏️',
  feather: '🪶',
  journal: '📝',
  code: '💻',
  coding: '💻',
  layers: '🥞',

  // Health, Fitness & Movement
  dumbbell: '🏋️',
  gym: '🏋️',
  workout: '🏋️',
  fitness: '💪',
  run: '🏃',
  running: '🏃',
  walk: '🚶',
  walking: '🚶',
  bike: '🚲',
  cycling: '🚲',
  water: '💧',
  droplets: '💧',
  hydrate: '💧',
  hydration: '💧',
  stretch: '🧘',
  stretching: '🧘',
  meditate: '🧘',
  meditation: '🧘',
  heart: '❤️',
  health: '❤️',
  apple: '🍎',
  nutrition: '🥗',
  diet: '🥗',
  food: '🥗',
  sleep: '😴',
  moon: '🌙',
  sun: '☀️',
  morning: '🌅',
  coffee: '☕',
  wind: '💨',
  breath: '🫁',
  stethoscope: '🩺',

  // Mind, Focus & Productivity
  brain: '🧠',
  focus: '🎯',
  target: '🎯',
  zap: '⚡',
  energy: '⚡',
  lightning: '⚡',
  flame: '🔥',
  fire: '🔥',
  star: '⭐',
  sparkles: '✨',
  check: '✅',
  checkcircle: '✅',
  task: '📋',
  map: '🗺️',

  // Finance & Wealth
  dollar: '💰',
  dollarsign: '💰',
  money: '💵',
  finance: '💰',
  trendingup: '📈',
  trend: '📈',
  shield: '🛡️',
  scales: '⚖️',
  hammer: '🔨',

  // Lifestyle & Mood
  music: '🎵',
  leaf: '🌿',
  nature: '🌲',
  smile: '😊',
  happy: '😊',
  zen: '☯️',
  peace: '🕊️',
  clock: '⏰',
  alarm: '⏰',
  bell: '🔔',
  gift: '🎁',
  trophy: '🏆',
  award: '🥇',
  medal: '🏅',
  crown: '👑',
};

// Regex to test if a string already consists of Unicode emojis
const EMOJI_REGEX = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji_Modifier_Base}|\p{Emoji_Component}|\s)+$/u;

/**
 * Returns a guaranteed single-character / composite emoji for any given input.
 * If the input is already an emoji, returns it directly.
 * If the input is a keyword like "book", "dumbbell", "water", resolves to the mapped emoji.
 * If unrecognized text, returns '🎯' fallback instead of rendering raw alphabet text.
 */
export function getHabitEmoji(icon?: string | null, fallback = '🎯'): string {
  if (!icon || typeof icon !== 'string') return fallback;
  const trimmed = icon.trim();
  if (!trimmed) return fallback;

  // 1. If it's already an emoji (e.g. "📚", "🏋️", "🧘", "🔥")
  if (EMOJI_REGEX.test(trimmed)) {
    return trimmed;
  }

  // 2. Normalize string: lowercase and strip non-alphanumeric
  const key = trimmed.toLowerCase().replace(/[^a-z0-9-]/g, '');

  if (EMOJI_MAP[key]) {
    return EMOJI_MAP[key];
  }

  // 3. Substring matching for compound names like "book-reading", "dumbbell_morning"
  for (const [slug, emoji] of Object.entries(EMOJI_MAP)) {
    if (key.includes(slug)) {
      return emoji;
    }
  }

  // Fallback to default target emoji instead of displaying broken text
  return fallback;
}
