import React from 'react';
import { getHabitEmoji } from '../../lib/emoji';

interface HabitIconItem {
  name: string;
  icon: React.FC<{ size?: number; className?: string }>;
}

const createEmojiIcon = (emoji: string): React.FC<{ size?: number; className?: string }> => {
  return ({ size = 20, className }) => (
    <span style={{ fontSize: size }} className={`select-none leading-none ${className || ''}`}>
      {emoji}
    </span>
  );
};

export const HABIT_ICONS: HabitIconItem[] = [
  { name: '📚', icon: createEmojiIcon('📚') },
  { name: '🏋️', icon: createEmojiIcon('🏋️') },
  { name: '💧', icon: createEmojiIcon('💧') },
  { name: '💻', icon: createEmojiIcon('💻') },
  { name: '🧘', icon: createEmojiIcon('🧘') },
  { name: '🏃', icon: createEmojiIcon('🏃') },
  { name: '🍎', icon: createEmojiIcon('🍎') },
  { name: '⚡', icon: createEmojiIcon('⚡') },
  { name: '🎯', icon: createEmojiIcon('🎯') },
  { name: '🔥', icon: createEmojiIcon('🔥') },
  { name: '🧠', icon: createEmojiIcon('🧠') },
  { name: '🌙', icon: createEmojiIcon('🌙') },
  { name: '☀️', icon: createEmojiIcon('☀️') },
  { name: '💰', icon: createEmojiIcon('💰') },
  { name: '☕', icon: createEmojiIcon('☕') },
  { name: '🎵', icon: createEmojiIcon('🎵') },
  { name: '🌿', icon: createEmojiIcon('🌿') },
  { name: '✍️', icon: createEmojiIcon('✍️') },
  { name: '⚖️', icon: createEmojiIcon('⚖️') },
  { name: '🛡️', icon: createEmojiIcon('🛡️') },
];

interface IconRendererProps {
  name?: string;
  className?: string;
  size?: number;
  color?: string;
  interactive?: boolean;
}

export function IconRenderer({ name, className, size = 18, color }: IconRendererProps) {
  const emoji = getHabitEmoji(name);

  return (
    <span
      className={`inline-flex items-center justify-center select-none leading-none ${className || ''}`}
      style={{ fontSize: size, color }}
      role="img"
      aria-label={name || 'icon'}
    >
      {emoji}
    </span>
  );
}
