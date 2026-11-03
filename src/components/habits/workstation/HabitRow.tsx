import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Flame,
  MoreVertical,
  Edit2,
  Archive,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { HabitWithStreak } from '../../../types';
import { SlidingNumber } from '../../ui/motion/SlidingNumber';
import { soundService } from '../../../services/soundService';
import { cn } from '../../../lib/utils';
import { getHabitEmoji } from '../../../lib/emoji';

export interface HabitRowProps {
  habit: HabitWithStreak;
  onToggle: (habit: HabitWithStreak) => Promise<void>;
  onEdit: (habit: HabitWithStreak) => void;
  onArchive: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  index?: number;
}

export function HabitRow({
  habit,
  onToggle,
  onEdit,
  onArchive,
  onDelete,
  index = 0,
}: HabitRowProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const isDone = (habit.todayLog?.value ?? 0) >= (habit.targetValue || 1);
  const currentStreak = habit.streak?.current ?? 0;
  const bestStreak = habit.streak?.best ?? 0;
  const completionRate = habit.completionRate30Days ?? 0;

  const handleCheck = async (e: React.MouseEvent) => {
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

  return (
    <div
      onClick={() => onEdit(habit)}
      className={cn(
        'group relative flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border transition-all duration-150 cursor-pointer select-none',
        isDone
          ? 'bg-emerald-950/[0.12] border-emerald-500/20 text-slate-300'
          : 'bg-white/[0.015] border-white/[0.06] hover:bg-white/[0.035] hover:border-white/[0.12] text-slate-100'
      )}
    >
      {/* ── Left Side: Checkbox + Icon + Name + Category ──────── */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Tactile Checkbox Button */}
        <button
          onClick={handleCheck}
          disabled={isToggling}
          aria-label={isDone ? `Mark ${habit.name} incomplete` : `Mark ${habit.name} complete`}
          className={cn(
            'w-6 h-6 rounded-md flex items-center justify-center transition-all duration-150 shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400/40',
            isDone
              ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
              : 'border border-slate-600/60 hover:border-slate-300 bg-white/[0.02]'
          )}
        >
          <AnimatePresence mode="wait">
            {isDone ? (
              <motion.div
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </button>

        {/* Category Icon */}
        <span className="text-base select-none shrink-0" aria-hidden="true">
          {getHabitEmoji(habit.icon)}
        </span>

        {/* Habit Name & Metadata */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-sm font-medium tracking-tight truncate transition-colors',
                isDone ? 'text-slate-400 line-through decoration-emerald-500/40' : 'text-slate-100'
              )}
            >
              {habit.name}
            </span>

            {/* Target Value if greater than 1 */}
            {habit.type !== 'boolean' && habit.targetValue > 1 && (
              <span className="hidden sm:inline-flex items-center font-mono text-[11px] text-slate-500">
                ({habit.todayLog?.value ?? 0}/{habit.targetValue} {habit.unit || ''})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Right Side: Category, 30d Rate, Streak, Actions ───── */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-xs">
        {/* Category Tag */}
        {habit.category && (
          <span className="hidden md:inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-white/[0.03] text-slate-400 border border-white/[0.05]">
            {habit.category}
          </span>
        )}

        {/* Frequency */}
        <span className="hidden sm:inline-flex text-[11px] font-mono text-slate-500">
          {habit.frequency}
        </span>

        {/* 30-Day Completion Rate */}
        <div className="hidden lg:flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
          <span className="text-slate-500">30d:</span>
          <span className="text-slate-300 font-semibold">{completionRate}%</span>
        </div>

        {/* Streak Indicator */}
        <div className="flex items-center gap-1 font-mono text-xs font-semibold text-amber-400 min-w-[50px] justify-end">
          <Flame className="w-3.5 h-3.5 fill-amber-400/80 text-amber-400" />
          <SlidingNumber value={currentStreak} />
          <span className="text-[10px] font-normal text-slate-500">d</span>
        </div>

        {/* Action Menu Trigger */}
        <div className="relative">
          <button
            onClick={e => {
              e.stopPropagation();
              setShowMenu(prev => !prev);
            }}
            aria-label="Habit options"
            className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={e => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-slate-900 border border-white/10 shadow-2xl z-50 py-1 text-xs">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit(habit);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Habit</span>
                </button>
                <button
                  onClick={async e => {
                    e.stopPropagation();
                    setShowMenu(false);
                    await onArchive(habit.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>{habit.archived ? 'Unarchive' : 'Archive'}</span>
                </button>
                <div className="h-px bg-white/5 my-1" />
                <button
                  onClick={async e => {
                    e.stopPropagation();
                    setShowMenu(false);
                    await onDelete(habit.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default HabitRow;
