import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { getHabitEmoji } from '../../lib/emoji';

export interface GlassEmojiCapsuleProps {
  icon?: string | null;
  category?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  isDone?: boolean;
  interactive?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  showHalo?: boolean;
}

interface CategoryStyling {
  gradient: string;
  border: string;
  glow: string;
  doneGradient: string;
  doneBorder: string;
  doneGlow: string;
}

const CATEGORY_STYLES: Record<string, CategoryStyling> = {
  health: {
    gradient: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    border: 'border-emerald-500/30 group-hover:border-emerald-400/50',
    glow: 'rgba(16, 185, 129, 0.25)',
    doneGradient: 'from-emerald-500/30 via-emerald-400/15 to-teal-500/10',
    doneBorder: 'border-emerald-400/60 shadow-[0_0_18px_rgba(52,211,153,0.35)]',
    doneGlow: 'rgba(16, 185, 129, 0.45)',
  },
  fitness: {
    gradient: 'from-orange-500/15 via-amber-500/5 to-transparent',
    border: 'border-orange-500/30 group-hover:border-orange-400/50',
    glow: 'rgba(249, 115, 22, 0.25)',
    doneGradient: 'from-orange-500/30 via-amber-400/15 to-emerald-500/10',
    doneBorder: 'border-orange-400/60 shadow-[0_0_18px_rgba(251,146,60,0.35)]',
    doneGlow: 'rgba(249, 115, 22, 0.45)',
  },
  learning: {
    gradient: 'from-indigo-500/15 via-cyan-500/5 to-transparent',
    border: 'border-indigo-500/30 group-hover:border-indigo-400/50',
    glow: 'rgba(99, 102, 241, 0.25)',
    doneGradient: 'from-indigo-500/30 via-cyan-400/15 to-teal-500/10',
    doneBorder: 'border-indigo-400/60 shadow-[0_0_18px_rgba(129,140,248,0.35)]',
    doneGlow: 'rgba(99, 102, 241, 0.45)',
  },
  work: {
    gradient: 'from-amber-500/15 via-yellow-500/5 to-transparent',
    border: 'border-amber-500/30 group-hover:border-amber-400/50',
    glow: 'rgba(245, 158, 11, 0.25)',
    doneGradient: 'from-amber-500/30 via-yellow-400/15 to-emerald-500/10',
    doneBorder: 'border-amber-400/60 shadow-[0_0_18px_rgba(251,191,36,0.35)]',
    doneGlow: 'rgba(245, 158, 11, 0.45)',
  },
  mindfulness: {
    gradient: 'from-purple-500/15 via-pink-500/5 to-transparent',
    border: 'border-purple-500/30 group-hover:border-purple-400/50',
    glow: 'rgba(168, 85, 247, 0.25)',
    doneGradient: 'from-purple-500/30 via-pink-400/15 to-teal-500/10',
    doneBorder: 'border-purple-400/60 shadow-[0_0_18px_rgba(192,132,252,0.35)]',
    doneGlow: 'rgba(168, 85, 247, 0.45)',
  },
  finance: {
    gradient: 'from-cyan-500/15 via-teal-500/5 to-transparent',
    border: 'border-cyan-500/30 group-hover:border-cyan-400/50',
    glow: 'rgba(6, 182, 212, 0.25)',
    doneGradient: 'from-cyan-500/30 via-teal-400/15 to-emerald-500/10',
    doneBorder: 'border-cyan-400/60 shadow-[0_0_18px_rgba(34,211,238,0.35)]',
    doneGlow: 'rgba(6, 182, 212, 0.45)',
  },
  default: {
    gradient: 'from-white/[0.10] via-white/[0.04] to-transparent',
    border: 'border-white/[0.12] group-hover:border-white/[0.22]',
    glow: 'rgba(255, 255, 255, 0.1)',
    doneGradient: 'from-emerald-500/25 via-emerald-400/10 to-transparent',
    doneBorder: 'border-emerald-400/50 shadow-[0_0_16px_rgba(52,211,153,0.3)]',
    doneGlow: 'rgba(16, 185, 129, 0.35)',
  },
};

const SIZE_PRESETS = {
  xs: { box: 'w-7 h-7 rounded-lg text-sm', fontSize: 13 },
  sm: { box: 'w-9 h-9 rounded-xl text-lg', fontSize: 16 },
  md: { box: 'w-11 h-11 sm:w-12 sm:h-12 rounded-2xl text-2xl', fontSize: 22 },
  lg: { box: 'w-14 h-14 rounded-2xl text-3xl', fontSize: 28 },
  xl: { box: 'w-20 h-20 sm:w-24 sm:h-24 rounded-3xl text-5xl', fontSize: 44 },
};

export const GlassEmojiCapsule: React.FC<GlassEmojiCapsuleProps> = ({
  icon,
  category,
  size = 'md',
  isDone = false,
  interactive = false,
  className,
  onClick,
  showHalo = true,
}) => {
  const emoji = getHabitEmoji(icon);
  const catKey = (category || '').toLowerCase();
  const theme = CATEGORY_STYLES[catKey] || CATEGORY_STYLES.default;

  // Resolve size styles
  const isPreset = typeof size === 'string' && size in SIZE_PRESETS;
  const sizeConfig = isPreset ? SIZE_PRESETS[size as keyof typeof SIZE_PRESETS] : SIZE_PRESETS.md;
  const customBoxStyle = !isPreset && typeof size === 'number' ? { width: size, height: size, fontSize: size * 0.55 } : {};

  return (
    <motion.div
      onClick={onClick}
      whileHover={interactive ? { scale: 1.08, rotate: [-1, 1, 0], y: -1 } : undefined}
      whileTap={interactive ? { scale: 0.94 } : undefined}
      transition={{ type: 'spring', stiffness: 420, damping: 20 }}
      className={cn(
        'relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden transition-all duration-300 backdrop-blur-xl',
        isPreset ? sizeConfig.box : 'rounded-2xl',
        isDone ? theme.doneBorder : theme.border,
        interactive && 'cursor-pointer hover:shadow-lg',
        className
      )}
      style={{
        ...customBoxStyle,
        background: isDone
          ? `linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(6, 182, 212, 0.12) 100%)`
          : `linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)`,
        boxShadow: isDone
          ? `inset 0 1px 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 2px 0 rgba(0, 0, 0, 0.4), 0 0 20px -2px ${theme.doneGlow}`
          : `inset 0 1px 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 2px 0 rgba(0, 0, 0, 0.3), 0 4px 12px -2px rgba(0, 0, 0, 0.4)`,
      }}
      role="img"
      aria-label={category ? `${category} emoji: ${emoji}` : `emoji: ${emoji}`}
    >
      {/* Specular highlight rim at top */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

      {/* Internal ambient color bloom */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br pointer-events-none transition-opacity duration-300',
          isDone ? theme.doneGradient : theme.gradient
        )}
      />

      {/* Optional ambient backglow halo */}
      {showHalo && (
        <div
          className="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none blur-md -z-10"
          style={{ background: isDone ? theme.doneGlow : theme.glow }}
        />
      )}

      {/* The 3D Glass Emoji itself */}
      <span
        className={cn(
          'relative z-10 leading-none transition-transform duration-300 flex items-center justify-center transform-gpu',
          isDone && 'scale-105 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]'
        )}
        style={{
          filter: isDone
            ? 'drop-shadow(0 2px 6px rgba(16, 185, 129, 0.4))'
            : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35))',
        }}
      >
        {emoji}
      </span>
    </motion.div>
  );
};

export default GlassEmojiCapsule;
