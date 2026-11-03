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
          'relative flex items-center justify-between gap-3.5 p-3.5 sm:p-4 rounded-xl cursor-pointer select-none transition-all duration-200',
          isDone
            ? 'bg-emerald-950/15 border-emerald-500/25'
            : 'bg-white/[0.02] border-white/[0.07] hover:border-white/[0.14] hover:bg-white/[0.035]'
        )}
        spotlightColor={isDone ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.05)'}
      >
        {/* Border trail celebratory laser on completion */}
        {isDone && (
          <BorderTrail 
            className="from-emerald-400 via-emerald-300 to-transparent" 
            size={50} 
          />
        )}

        {/* Left Side: Icon + Title + Meta */}
        <div className="flex items-center gap-3 min-w-0">
          <div 
            className={cn(
              'w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-lg sm:text-xl transition-transform duration-200 shrink-0',
              isDone
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-white/[0.04] text-slate-300 border border-white/[0.06]'
            )}
          >
            {habit.icon || '🎯'}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 
                className={cn(
                  'text-sm sm:text-base font-medium tracking-tight truncate transition-colors duration-150',
                  isDone ? 'text-slate-400 line-through decoration-emerald-500/40' : 'text-slate-100'
                )}
              >
                {habit.name}
              </h3>

              {habit.frequency === 'daily' && (
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono text-slate-500 border border-white/[0.06]">
                  daily
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 mt-0.5 text-xs text-slate-400">
              {/* Streak Badge */}
              <div className="flex items-center gap-1 font-mono font-medium text-amber-400">
                <Flame className="w-3 h-3 fill-amber-400/80 text-amber-400" />
                <SlidingNumber value={currentStreak} />
                <span className="text-[10px] font-normal text-slate-500 ml-0.5">d streak</span>
              </div>

              {/* Target / Unit value if count or duration */}
              {habit.type !== 'boolean' && habit.targetValue > 1 && (
                <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                  <span className="text-slate-300 font-medium">{todayValue}</span>
                  <span className="text-slate-600">/</span>
                  <span>{habit.targetValue}</span>
                  {habit.unit && <span className="text-[10px] text-slate-500 ml-0.5">{habit.unit}</span>}
                </div>
              )}

              {/* Category */}
              {habit.category && (
                <span className="hidden md:inline-block text-[11px] text-slate-500">
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
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            disabled={isToggling}
            aria-label={isDone ? `Mark ${habit.name} incomplete` : `Mark ${habit.name} complete`}
            className={cn(
              'w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer',
              isDone
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/[0.08]'
            )}
          >
            <AnimatePresence mode="wait">
              {isDone ? (
                <motion.div
                  key="checked"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </motion.div>
              ) : (
                <div className="w-3.5 h-3.5 rounded border border-slate-500/70 group-hover:border-slate-300 transition-colors" />
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </SpotlightCard>
    </motion.div>
  );
}

export default TactileHabitCard;
