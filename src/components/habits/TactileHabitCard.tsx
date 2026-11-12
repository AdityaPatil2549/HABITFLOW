import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Flame, ChevronRight, Zap, Clock, Sparkles, Lock, ArrowDown } from 'lucide-react';
import type { HabitWithStreak } from '../../types';
import { soundService } from '../../services/soundService';
import { cn } from '../../lib/utils';
import { getHabitEmoji } from '../../lib/emoji';

interface TactileHabitCardProps {
  habit: HabitWithStreak;
  onToggle: (habit: HabitWithStreak) => Promise<void>;
  onOpenDetails?: (habit: HabitWithStreak) => void;
  index?: number;
  isPrimed?: boolean;
  isLocked?: boolean;
  parentHabitName?: string;
  chainPosition?: { current: number; total: number };
}

export function TactileHabitCard({
  habit,
  onToggle,
  onOpenDetails,
  index = 0,
  isPrimed = false,
  isLocked = false,
  parentHabitName,
  chainPosition,
}: TactileHabitCardProps) {
  const [isToggling, setIsToggling] = useState(false);

  const isDone = (habit.todayLog?.value ?? 0) >= (habit.targetValue || 1);
  const currentStreak = habit.streak?.current ?? 0;
  const todayValue = habit.todayLog?.value ?? 0;

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isToggling) return;
    setIsToggling(true);

    if (!isDone) {
      soundService.playTick();
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
      className="relative group cursor-pointer"
      onClick={() => onOpenDetails?.(habit)}
    >
      <div
        className={cn(
          'relative flex items-center justify-between gap-4 p-4 sm:p-5 rounded-xl border transition-colors duration-150 overflow-hidden',
          isDone
            ? 'bg-neutral-900/80 border-emerald-500/35'
            : isPrimed
            ? 'bg-neutral-900/80 border-white/25'
            : isLocked
            ? 'bg-neutral-900/40 border-white/5 opacity-75 hover:opacity-100'
            : 'bg-neutral-900/60 border-white/10 hover:border-white/20 hover:bg-neutral-900/80'
        )}
      >

        {/* Left Side: Icon + Title + Metadata */}
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1 z-10">
          <div
            className={cn(
              'w-10 h-10 rounded-lg border flex items-center justify-center text-xl shrink-0',
              isDone
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-neutral-800/80 border-white/10'
            )}
          >
            {getHabitEmoji(habit.icon)}
          </div>

          <div className="min-w-0 flex-1">
            {/* Title & Category Tag */}
            <div className="flex items-center gap-2 mb-1 min-w-0 flex-wrap">
              <h3
                className={cn(
                  'text-base sm:text-lg font-semibold tracking-tight truncate max-w-full transition-colors duration-200',
                  isDone
                    ? 'text-slate-400 line-through decoration-emerald-400/50'
                    : 'text-white group-hover:text-white'
                )}
                title={habit.name}
              >
                {habit.name}
              </h3>

              {/* Atomic Stack Primed / Locked Indicator */}
              {isPrimed && !isDone && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tracking-wider bg-teal-500/20 text-teal-300 border border-teal-400/40 flex items-center gap-1 shadow-[0_0_10px_rgba(45,212,191,0.3)] animate-pulse shrink-0">
                  <Zap size={11} className="fill-teal-300 text-teal-300" />
                  <span>PRIMED</span>
                </span>
              )}

              {isLocked && !isDone && parentHabitName && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono text-slate-300 bg-white/[0.06] border border-white/[0.12] flex items-center gap-1 shrink-0">
                  <Lock size={11} className="text-slate-400" />
                  <span>Queued after {parentHabitName}</span>
                </span>
              )}

              {habit.category && (
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-xs font-mono uppercase tracking-wider border shrink-0',
                    theme.badge
                  )}
                >
                  {habit.category}
                </span>
              )}
            </div>

            {/* Streak & Sub-metrics */}
            <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
              {/* Streak Flame Pill */}
              <div
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-xs font-semibold transition-colors',
                  currentStreak > 0
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-white/[0.04] text-slate-400 border border-white/[0.08]'
                )}
              >
                <Flame
                  size={13}
                  className={cn(
                    currentStreak > 0
                      ? 'fill-amber-400 text-amber-400 animate-pulse'
                      : 'text-slate-500'
                  )}
                />
                <span className="tabular-nums">{currentStreak}</span>
                <span className="text-xs font-normal opacity-85">d streak</span>
              </div>

              {/* Progress counter for count / duration targets */}
              {habit.type !== 'boolean' && habit.targetValue > 1 && (
                <div className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-200 bg-white/[0.05] px-2.5 py-0.5 rounded-full border border-white/[0.08]">
                  <span className="text-emerald-400 font-bold">{todayValue}</span>
                  <span className="text-slate-400">/</span>
                  <span>{habit.targetValue}</span>
                  {habit.unit && <span className="text-xs text-slate-300">{habit.unit}</span>}
                </div>
              )}

              {habit.frequency === 'daily' && (
                <span className="text-xs font-mono text-slate-400 hidden sm:inline">
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
                : isPrimed
                ? 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-400/60 shadow-[0_0_18px_rgba(45,212,191,0.35)] animate-pulse'
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
