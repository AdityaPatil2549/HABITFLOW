import React from 'react';
import { getHabitEmoji } from '../../lib/emoji';
import { GlassEmojiCapsule } from './GlassEmojiCapsule';

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

export interface IconRendererProps {
  name?: string;
  category?: string;
  className?: string;
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  interactive?: boolean;
  capsule?: boolean;
  isDone?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export function IconRenderer({
  name,
  category,
  className,
  size = 18,
  color,
  interactive = false,
  capsule = false,
  isDone = false,
  onClick,
}: IconRendererProps) {
  if (capsule) {
    return (
      <GlassEmojiCapsule
        icon={name}
        category={category}
        size={typeof size === 'number' ? (size <= 16 ? 'xs' : size <= 20 ? 'sm' : size <= 28 ? 'md' : 'lg') : size}
        isDone={isDone}
        interactive={interactive}
        className={className}
        onClick={onClick}
      />
    );
  }

  const emoji = getHabitEmoji(name);

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center justify-center select-none leading-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] ${
        interactive ? 'cursor-pointer hover:scale-110 active:scale-95 transition-transform' : ''
      } ${className || ''}`}
      style={{ fontSize: typeof size === 'number' ? size : undefined, color }}
      role="img"
      aria-label={name || 'icon'}
    >
      {emoji}
    </span>
  );
}

export default IconRenderer;
