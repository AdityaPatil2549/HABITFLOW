import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Flame, ChevronRight, Zap, RefreshCw, Sparkles, Clock } from 'lucide-react';
import type { HabitWithStreak } from '../../types';
import { SpotlightCard } from '../ui/motion/SpotlightCard';
import { BorderTrail } from '../ui/motion/BorderTrail';
import { SlidingNumber } from '../ui/motion/SlidingNumber';
import { soundService } from '../../services/soundService';
import { cn } from '../../lib/utils';

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
  const isDone = (habit.todayLog?.value ?? 0) >= (habit.targetValue || 1);
  const currentStreak = habit.streak?.current ?? 0;
  const todayValue = habit.todayLog?.value ?? 0;

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isToggling) return;
    setIsToggling(true);
    
    // Play tactile sound
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ 
        type: 'spring', 
        stiffness: 350, 
        damping: 24, 
        delay: Math.min(index * 0.04, 0.3) 
      }}
      className="relative group"
    >
      <SpotlightCard
        onClick={() => onOpenDetails?.(habit)}
        className={cn(
          'relative flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl cursor-pointer select-none transition-all duration-300',
          isDone
            ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
            : 'bg-slate-900/60 border-white/[0.08] hover:border-white/20 hover:bg-slate-900/80'
        )}
        spotlightColor={isDone ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.12)'}
      >
        {/* Border trail celebration glow when completed */}
        {isDone && (
          <BorderTrail 
            className="from-emerald-400 via-emerald-300 to-transparent" 
            size={70} 
          />
        )}

        {/* Left Side: Icon + Title + Meta */}
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          {/* Category/Emoji Icon Container */}
          <div 
            className={cn(
              'w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl transition-transform duration-300 group-hover:scale-105 shrink-0',
              isDone
                ? 'bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/20'
                : 'bg-white/5 text-slate-300 border border-white/10'
            )}
          >
            {habit.icon || '🎯'}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 
                className={cn(
                  'text-base sm:text-lg font-semibold tracking-tight truncate transition-colors duration-200',
                  isDone ? 'text-slate-200 line-through decoration-emerald-500/40' : 'text-white'
                )}
              >
                {habit.name}
              </h3>

              {habit.frequency === 'daily' && (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-white/5 text-slate-400 border border-white/5">
                  Daily
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
              {/* Streak Badge */}
              <div className="flex items-center gap-1 font-mono font-bold text-amber-400">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <SlidingNumber value={currentStreak} />
                <span className="text-[11px] font-normal text-slate-500 ml-0.5">days</span>
              </div>

              {/* Target / Unit value if count or duration */}
              {habit.type !== 'boolean' && habit.targetValue > 1 && (
                <div className="flex items-center gap-1 text-slate-400">
                  <span className="font-mono text-slate-300">{todayValue}</span>
                  <span>/</span>
                  <span className="font-mono">{habit.targetValue}</span>
                  {habit.unit && <span className="text-[11px] text-slate-500">{habit.unit}</span>}
                </div>
              )}

              {/* Category */}
              {habit.category && (
                <span className="hidden md:inline-block text-slate-500">
                  • {habit.category}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Checkoff Button */}
        <div className="flex items-center gap-2 shrink-0">
          <motion.button
            onClick={handleToggle}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            disabled={isToggling}
            aria-label={isDone ? `Mark ${habit.name} incomplete` : `Mark ${habit.name} complete`}
            className={cn(
              'w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md',
              isDone
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10'
            )}
          >
            <AnimatePresence mode="wait">
              {isDone ? (
                <motion.div
                  key="checked"
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                >
                  <Check className="w-6 h-6 stroke-[3]" />
                </motion.div>
              ) : (
                <motion.div
                  key="unchecked"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="w-5 h-5 rounded-lg border-2 border-slate-500/60 group-hover:border-slate-300 transition-colors"
                />
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </SpotlightCard>
    </motion.div>
  );
}

export default TactileHabitCard;
