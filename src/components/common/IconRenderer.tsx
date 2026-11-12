import React from 'react';
import { getHabitEmoji } from '../../lib/emoji';

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
  className,
  size = 18,
  color,
  interactive = false,
  onClick,
}: IconRendererProps) {
  const emoji = getHabitEmoji(name);

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center justify-center select-none leading-none ${
        interactive ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''
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
