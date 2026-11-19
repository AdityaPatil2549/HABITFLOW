import React from 'react';
import { Target } from 'lucide-react';
import { Icon as IconifyIcon } from '@iconify/react';
import { getHabitEmoji } from '../../lib/emoji';
import { resolveLucideIconName, isEmojiIcon, isIconifyId } from './iconUtils';
import { CURATED_LUCIDE_ICONS } from './habitIcons';

export interface IconRendererProps {
  name?: string | null;
  category?: string;
  className?: string;
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  strokeWidth?: number;
  interactive?: boolean;
  capsule?: boolean;
  isDone?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  fallback?: string;
}

const SIZE_MAP: Record<string, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export function IconRenderer({
  name,
  className,
  size = 20,
  color,
  strokeWidth = 2,
  interactive = false,
  onClick,
  fallback,
}: IconRendererProps) {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || 20;

  const interactiveClasses = interactive
    ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform'
    : '';

  // 1. Direct Emoji
  if (isEmojiIcon(name)) {
    return (
      <span
        onClick={onClick}
        className={`inline-flex items-center justify-center select-none leading-none ${interactiveClasses} ${className || ''}`}
        style={{ fontSize: `${pixelSize}px` }}
        role="img"
        aria-label={name || 'icon'}
      >
        {name}
      </span>
    );
  }

  // 2. Iconify Icon (e.g. "mdi:fire", "solar:dumbbell-bold", "ph:barbell")
  if (isIconifyId(name)) {
    return (
      <span
        onClick={onClick}
        className={`inline-flex items-center justify-center shrink-0 ${interactiveClasses} ${className || ''}`}
        style={{ color: color || 'currentColor', width: pixelSize, height: pixelSize }}
        aria-label={name || 'icon'}
      >
        <IconifyIcon icon={name!.trim()} width={pixelSize} height={pixelSize} />
      </span>
    );
  }

  // 3. Lucide Vector Icon (100% Tree-Shaken from Curated Registry)
  const lucideName = resolveLucideIconName(name);
  if (lucideName) {
    const LucideComponent = CURATED_LUCIDE_ICONS[lucideName] || Target;
    return (
      <span
        onClick={onClick}
        className={`inline-flex items-center justify-center shrink-0 ${interactiveClasses} ${className || ''}`}
        aria-label={lucideName}
      >
        <LucideComponent
          size={pixelSize}
          strokeWidth={strokeWidth}
          color={color || 'currentColor'}
          className="shrink-0"
        />
      </span>
    );
  }

  // 4. Fallback: Check if it's a legacy keyword resolving to emoji or fallback Lucide
  if (name && typeof name === 'string' && name.trim()) {
    const resolvedEmoji = getHabitEmoji(name, '');
    if (resolvedEmoji) {
      return (
        <span
          onClick={onClick}
          className={`inline-flex items-center justify-center select-none leading-none ${interactiveClasses} ${className || ''}`}
          style={{ fontSize: `${pixelSize}px` }}
          role="img"
          aria-label={name}
        >
          {resolvedEmoji}
        </span>
      );
    }
  }

  // 5. Ultimate Fallback: Target icon or provided fallback
  if (fallback && isEmojiIcon(fallback)) {
    return (
      <span
        onClick={onClick}
        className={`inline-flex items-center justify-center select-none leading-none ${interactiveClasses} ${className || ''}`}
        style={{ fontSize: `${pixelSize}px` }}
        role="img"
        aria-label="fallback-icon"
      >
        {fallback}
      </span>
    );
  }

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center justify-center shrink-0 ${interactiveClasses} ${className || ''}`}
      aria-label="default-target"
    >
      <Target
        size={pixelSize}
        strokeWidth={strokeWidth}
        color={color || 'currentColor'}
        className="shrink-0"
      />
    </span>
  );
}

export default IconRenderer;
