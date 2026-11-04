import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Flame, ChevronRight, Zap, Clock, Sparkles } from 'lucide-react';
import type { HabitWithStreak } from '../../types';
import { SlidingNumber } from '../ui/motion/SlidingNumber';
import { soundService } from '../../services/soundService';
import { useChronoStore } from '../../store/chronoStore';
import { cn } from '../../lib/utils';
import { getHabitEmoji } from '../../lib/emoji';
import { GlassEmojiCapsule } from '../common/GlassEmojiCapsule';
import { triggerGoldFoilBurst } from '../common/GoldFoilBurst';

interface TactileHabitCardProps {
  habit: HabitWithStreak;
  onToggle: (habit: HabitWithStreak) => Promise<void>;
  onOpenDetails?: (habit: HabitWithStreak) => void;
  index?: number;
}

export function TactileHabitCard({
  habit,
  onToggle,
  onOpenDetails,
  index = 0,
}: TactileHabitCardProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0, mouseX: 0, mouseY: 0, isHovered: false });
  const [shockwave, setShockwave] = useState<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  
  const { currentEpoch } = useChronoStore();
  const isDone = (habit.todayLog?.value ?? 0) >= (habit.targetValue || 1);
  const currentStreak = habit.streak?.current ?? 0;
  const todayValue = habit.todayLog?.value ?? 0;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -3.2;
    const rotateY = ((x - centerX) / centerX) * 3.2;
    setTilt({ x: rotateX, y: rotateY, mouseX: x, mouseY: y, isHovered: true });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, mouseX: 0, mouseY: 0, isHovered: false });
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isToggling) return;
    setIsToggling(true);

    const rect = e.currentTarget.getBoundingClientRect();
    setShockwave({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true });
    setTimeout(() => setShockwave(prev => ({ ...prev, active: false })), 600);

    if (!isDone) {
      const isMilestone = [3, 7, 14, 30, 100].includes(currentStreak + 1);
      soundService.playChronoForging(currentEpoch, isMilestone);
      if (isMilestone) {
        triggerGoldFoilBurst();
      }
    } else {
      soundService.playUncheck();
    }

    try {
      await onToggle(habit);
    } finally {
      setIsToggling(false);
    }
  };

  // Color thematic accent based on category or streak
  const getCategoryTheme = (cat?: string) => {
    switch (cat?.toLowerCase()) {
      case 'health':
      case 'fitness':
        return {
          glow: 'rgba(16, 185, 129, 0.15)',
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        };
      case 'learning':
      case 'work':
        return {
          glow: 'rgba(245, 158, 11, 0.15)',
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        };
      case 'mindfulness':
      case 'personal':
        return {
          glow: 'rgba(168, 85, 247, 0.15)',
          badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        };
      case 'finance':
        return {
          glow: 'rgba(6, 182, 212, 0.15)',
          badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        };
      default:
        return {
          glow: 'rgba(99, 102, 241, 0.15)',
          badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        };
    }
  };

  const theme = getCategoryTheme(habit.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{
        type: 'spring',
        stiffness: 350,
        damping: 24,
        delay: Math.min(index * 0.04, 0.25),
      }}
      className="relative group cursor-pointer perspective-[1200px]"
      onClick={() => onOpenDetails?.(habit)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={cn(
          'relative flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl transition-[border-color,background-color,box-shadow] duration-200 backdrop-blur-md overflow-hidden will-change-transform card-horlogerie',
          isDone
            ? 'bg-[#091512]/90 border-emerald-500/50 shadow-[0_12px_32px_rgba(16,185,129,0.20)]'
            : 'bg-[#0d101a]/85 border-white/[0.08] hover:border-white/[0.22] hover:bg-[#121624]/90 shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.6)]'
        )}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${isToggling ? 'translateZ(-8px) scale(0.985)' : 'translateZ(0px)'}`,
          transition: 'transform 120ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms ease, border-color 200ms ease',
        }}
      >
        {/* Dynamic Cursor Spotlight Sheen */}
        {tilt.isHovered && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle 180px at ${tilt.mouseX}px ${tilt.mouseY}px, rgba(255, 255, 255, 0.08), transparent 75%)`,
            }}
          />
        )}

        {/* Dynamic Forging Shockwave Ripple */}
        <AnimatePresence>
          {shockwave.active && (
            <motion.span
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 3.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="absolute w-24 h-24 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 bg-emerald-400/30 blur-md"
              style={{ left: shockwave.x, top: shockwave.y }}
            />
          )}
        </AnimatePresence>

        {/* Ambient Backglow */}
        <div
          className="absolute -left-10 -top-10 w-36 h-36 rounded-full opacity-30 pointer-events-none transition-opacity duration-300 group-hover:opacity-50"
          style={{ background: isDone ? 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)' : `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)` }}
        />


        {/* Left Side: Rich Icon Capsule + Title + Metadata */}
        <div className="flex items-center gap-4 min-w-0 z-10">
          {/* 3D Glass Emoji Capsule */}
          <GlassEmojiCapsule
            icon={habit.icon}
            category={habit.category}
            size="md"
            isDone={isDone}
            interactive={false}
            showHalo={true}
          />

          <div className="min-w-0">
            {/* Title & Category Tag */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3
                className={cn(
                  'text-base sm:text-lg font-semibold tracking-tight truncate transition-colors duration-200',
                  isDone
                    ? 'text-slate-400 line-through decoration-emerald-400/50'
                    : 'text-white group-hover:text-white'
                )}
              >
                {habit.name}
              </h3>

              {habit.category && (
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border',
                    theme.badge
                  )}
                >
                  {habit.category}
                </span>
              )}
            </div>

            {/* Streak & Sub-metrics */}
            <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
              {/* Streak Flame Pill */}
              <div
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[11px] font-semibold transition-colors',
                  currentStreak > 0
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-white/[0.03] text-slate-500 border border-white/[0.05]'
                )}
              >
                <Flame
                  size={12}
                  className={cn(
                    currentStreak > 0
                      ? 'fill-amber-400 text-amber-400 animate-pulse'
                      : 'text-slate-600'
                  )}
                />
                <SlidingNumber value={currentStreak} />
                <span className="text-[10px] font-normal opacity-75">d streak</span>
              </div>

              {/* Progress counter for count / duration targets */}
              {habit.type !== 'boolean' && habit.targetValue > 1 && (
                <div className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-300 bg-white/[0.03] px-2 py-0.5 rounded-full border border-white/[0.06]">
                  <span className="text-emerald-400 font-bold">{todayValue}</span>
                  <span className="text-slate-600">/</span>
                  <span>{habit.targetValue}</span>
                  {habit.unit && <span className="text-[10px] text-slate-400">{habit.unit}</span>}
                </div>
              )}

              {habit.frequency === 'daily' && (
                <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                  • Daily ritual
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: High-Craft Physical Check Button */}
        <div className="flex items-center gap-2 shrink-0 z-10">
          <motion.button
            onClick={handleToggle}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            disabled={isToggling}
            aria-label={isDone ? `Mark ${habit.name} incomplete` : `Mark ${habit.name} complete`}
            className={cn(
              'w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-300 cursor-pointer shadow-lg',
              isDone
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_24px_rgba(16,185,129,0.5)] border border-emerald-300/60'
                : 'bg-white/[0.04] hover:bg-emerald-500/15 hover:border-emerald-500/40 text-slate-400 hover:text-emerald-300 border border-white/[0.1]'
            )}
          >
            <AnimatePresence mode="wait">
              {isDone ? (
                <motion.div
                  key="done"
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                >
                  <Check className="w-5 h-5 stroke-[3]" />
                </motion.div>
              ) : (
                <div className="w-4 h-4 rounded-md border-2 border-slate-500/60 group-hover:border-emerald-400/80 transition-colors" />
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default TactileHabitCard;
