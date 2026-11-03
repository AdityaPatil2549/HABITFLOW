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
        'group relative flex items-center justify-between gap-3.5 sm:gap-4 px-4 py-3.5 rounded-2xl border transition-all duration-200 cursor-pointer select-none',
        isDone
          ? 'bg-emerald-950/[0.18] border-emerald-500/30 text-slate-200 shadow-[0_4px_20px_rgba(16,185,129,0.06)] backdrop-blur-xl'
          : 'glass-panel-interactive text-slate-100 hover:border-emerald-500/30'
      )}
    >
      {/* ── Left Side: Checkbox + Icon + Name + Category ──────── */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Tactile Checkbox Button */}
        <button
          onClick={handleCheck}
          disabled={isToggling}
          aria-label={isDone ? `Mark ${habit.name} incomplete` : `Mark ${habit.name} complete`}
          className={cn(
            'w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400/40 active:scale-90',
            isDone
              ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_14px_rgba(16,185,129,0.5)]'
              : 'border border-white/20 hover:border-emerald-400/50 bg-white/[0.04] hover:bg-white/[0.08]'
          )}
        >
          <AnimatePresence mode="wait">
            {isDone ? (
              <motion.div
                key="check"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 20 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <Check className="w-4 h-4 stroke-[3]" />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </button>

        {/* Category Emoji Capsule */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-white/[0.05] border border-white/[0.08] shrink-0 select-none shadow-inner">
          <span aria-hidden="true">
            {getHabitEmoji(habit.icon)}
          </span>
        </div>

        {/* Habit Name & Metadata */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-sm font-semibold tracking-tight truncate transition-colors',
                isDone ? 'text-slate-400 line-through decoration-emerald-500/50' : 'text-slate-100 group-hover:text-emerald-300'
              )}
            >
              {habit.name}
            </span>

            {/* Target Value if greater than 1 */}
            {habit.type !== 'boolean' && habit.targetValue > 1 && (
              <span className="hidden sm:inline-flex items-center font-mono text-[11px] text-slate-400 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                {habit.todayLog?.value ?? 0}/{habit.targetValue} {habit.unit || ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Right Side: Category, 30d Rate, Streak, Actions ───── */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-xs">
        {/* Category Tag */}
        {habit.category && (
          <span className="hidden md:inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/[0.05] text-slate-300 border border-white/[0.08]">
            {habit.category}
          </span>
        )}

        {/* Frequency */}
        <span className="hidden sm:inline-flex text-[11px] font-mono text-slate-400 capitalize">
          {habit.frequency}
        </span>

        {/* 30-Day Completion Rate */}
        <div className="hidden lg:flex items-center gap-1.5 font-mono text-[11px] text-slate-400 bg-white/[0.03] px-2 py-1 rounded-lg border border-white/[0.06]">
          <span className="text-slate-500">30d:</span>
          <span className="text-emerald-400 font-semibold">{completionRate}%</span>
        </div>

        {/* Streak Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 font-mono text-xs font-semibold shadow-[0_0_12px_rgba(245,158,11,0.15)] min-w-[56px] justify-center">
          <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-pulse" />
          <SlidingNumber value={currentStreak} />
          <span className="text-[10px] font-normal text-amber-300/80">d</span>
        </div>

        {/* Action Menu Trigger */}
        <div className="relative">
          <button
            onClick={e => {
              e.stopPropagation();
              setShowMenu(prev => !prev);
            }}
            aria-label="Habit options"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
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
              <div className="absolute right-0 top-full mt-1.5 w-40 rounded-2xl bg-[#0c0e17]/95 backdrop-blur-2xl border border-white/[0.12] shadow-2xl z-50 p-1.5 text-xs">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit(habit);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors text-left"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Edit Habit</span>
                </button>
                <button
                  onClick={async e => {
                    e.stopPropagation();
                    setShowMenu(false);
                    await onArchive(habit.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors text-left"
                >
                  <Archive className="w-3.5 h-3.5 text-slate-400" />
                  <span>{habit.archived ? 'Unarchive' : 'Archive'}</span>
                </button>
                <div className="h-px bg-white/[0.08] my-1" />
                <button
                  onClick={async e => {
                    e.stopPropagation();
                    setShowMenu(false);
                    await onDelete(habit.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 rounded-xl transition-colors text-left font-semibold"
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
