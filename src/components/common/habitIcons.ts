export interface HabitIconItem {
  name: string;
  category: string;
  label: string;
}

export const HABIT_ICONS: HabitIconItem[] = [
  // Health & Movement
  { name: '🏋️', category: 'fitness', label: 'Workout / Gym' },
  { name: '🏃', category: 'fitness', label: 'Running / Cardio' },
  { name: '🚴', category: 'fitness', label: 'Cycling' },
  { name: '🧘', category: 'health', label: 'Yoga / Stretch' },
  { name: '💧', category: 'health', label: 'Hydration' },
  { name: '🥗', category: 'health', label: 'Healthy Meal' },
  { name: '😴', category: 'health', label: 'Deep Sleep' },
  { name: '❤️', category: 'health', label: 'Cardio / Vitals' },

  // Intellect & Learning
  { name: '📚', category: 'learning', label: 'Reading' },
  { name: '📖', category: 'learning', label: 'Study / Research' },
  { name: '💻', category: 'learning', label: 'Coding / Software' },
  { name: '✍️', category: 'learning', label: 'Journaling' },
  { name: '🧠', category: 'learning', label: 'Cognitive Flow' },

  // Focus & Productivity
  { name: '🎯', category: 'work', label: 'Deep Focus' },
  { name: '⚡', category: 'work', label: 'High Velocity' },
  { name: '🔥', category: 'work', label: 'Streak Fuel' },
  { name: '⏰', category: 'work', label: 'Time Blocking' },
  { name: '📈', category: 'work', label: 'Growth / KPIs' },

  // Mindfulness & Peace
  { name: '🌿', category: 'mindfulness', label: 'Nature Walk' },
  { name: '☀️', category: 'mindfulness', label: 'Morning Light' },
  { name: '🌙', category: 'mindfulness', label: 'Evening Ritual' },
  { name: '☕', category: 'mindfulness', label: 'Mindful Brew' },
  { name: '🎵', category: 'mindfulness', label: 'Auditory Calm' },
  { name: '✨', category: 'mindfulness', label: 'Gratitude' },

  // Wealth & Mastery
  { name: '💰', category: 'finance', label: 'Budget / Wealth' },
  { name: '🛡️', category: 'finance', label: 'Discipline' },
  { name: '🏆', category: 'finance', label: 'Milestone' },
  { name: '👑', category: 'finance', label: 'Mastery' },
];

