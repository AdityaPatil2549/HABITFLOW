import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Flame,
  MoreVertical,
  Edit2,
  Archive,
  Trash2,
  Minus,
  Plus,
} from 'lucide-react';
import type { HabitWithStreak } from '../../../types';
import { soundService } from '../../../services/soundService';
import { cn } from '../../../lib/utils';
import { IconRenderer } from '../../common/IconRenderer';

export interface HabitRowProps {
  habit: HabitWithStreak;
  onToggle: (habit: HabitWithStreak) => Promise<void>;
  onIncrement?: (habit: HabitWithStreak, delta: number) => Promise<void>;
  onEdit: (habit: HabitWithStreak) => void;
  onArchive: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  index?: number;
}

export function HabitRow({
  habit,
  onToggle,
  onIncrement,
  onEdit,
  onArchive,
  onDelete,
}: HabitRowProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const target = habit.targetValue || 1;
  const todayValue = habit.todayLog?.value ?? 0;
  const isDone = todayValue >= target;
  const isStepperHabit = (habit.type === 'count' || habit.type === 'duration') && target > 1;
  const currentStreak = habit.streak?.current ?? 0;
  const completionRate = Math.round((habit.completionRate30Days ?? 0) * 100);

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

  const handleStep = async (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    if (isToggling) return;
    setIsToggling(true);
    try {
      if (onIncrement) {
        await onIncrement(habit, delta);
      } else {
        await onToggle(habit);
      }
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div
      onClick={() => onEdit(habit)}
      className={cn(
        'group relative flex items-center justify-between gap-3.5 sm:gap-4 px-4 py-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none',
        isDone
          ? 'bg-[var(--sf-raised)] text-[var(--tx-secondary)] border-l-[3.5px]'
          : 'bg-[var(--sf-raised)] border-[var(--border-default)] hover:border-[var(--border-strong)] hover:shadow-lg hover:shadow-black/20 hover:-translate-y-[1px] text-[var(--tx-primary)]'
      )}
      style={{
        borderLeftColor: isDone ? (habit.color || 'var(--accent)') : undefined,
        boxShadow: isDone && habit.color ? `0 2px 14px -4px ${habit.color}25, inset 0 1px 0 0 rgba(255, 255, 255, 0.06)` : undefined,
      }}
    >
      {/* ── Left Side: Checkbox + Icon + Name + Category ──────── */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Tactile Checkbox Button */}
        <button
          onClick={handleCheck}
          disabled={isToggling}
          aria-label={isDone ? `Mark ${habit.name} incomplete` : `Mark ${habit.name} complete`}
          className={cn(
            'w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-150 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] active:scale-90',
            isDone
              ? 'text-white'
              : 'border border-[var(--border-strong)] hover:border-[var(--accent)] bg-[var(--sf-overlay)] hover:scale-105'
          )}
          style={
            isDone
              ? {
                  backgroundColor: habit.color || 'var(--accent)',
                  borderColor: habit.color || 'var(--accent)',
                  boxShadow: habit.color ? `0 2px 10px -2px ${habit.color}65` : '0 2px 8px -2px rgba(var(--brand-500-rgb), 0.4)',
                }
              : undefined
          }
        >
          <AnimatePresence mode="wait">
            {isDone ? (
              <motion.div
                key="check"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ duration: 0.12, ease: 'easeOut' }}
              >
                <Check className="w-4 h-4 stroke-[3]" />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </button>

        {/* Habit Icon / Emoji */}
        <span
          className="w-8 h-8 rounded-lg border flex items-center justify-center text-base shrink-0 transition-transform duration-200 group-hover:scale-105"
          style={{
            backgroundColor: habit.color ? `${habit.color}18` : 'var(--sf-overlay)',
            borderColor: habit.color ? `${habit.color}40` : 'var(--border-default)',
            boxShadow: isDone && habit.color ? `0 0 10px -2px ${habit.color}40` : undefined,
          }}
        >
          <IconRenderer name={habit.icon} color={habit.color || 'var(--accent)'} size={18} />
        </span>

        {/* Habit Name & Metadata */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-sm font-semibold tracking-tight truncate transition-colors',
                isDone ? 'text-[var(--tx-muted)] line-through decoration-[var(--accent)]/50' : 'text-[var(--tx-primary)] group-hover:text-[var(--accent-ink)]'
              )}
            >
              {habit.name}
            </span>

            {/* Target Value stepper or badge */}
            {isStepperHabit && (
              <div
                className="inline-flex items-center gap-1 font-mono text-[11px] bg-[var(--sf-overlay)] px-1.5 py-0.5 rounded border border-[var(--border-default)]"
                onClick={e => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={e => handleStep(e, -1)}
                  disabled={isToggling || todayValue <= 0}
                  aria-label={`Decrease ${habit.name}`}
                  className="p-0.5 rounded hover:bg-[var(--sf-dim)] disabled:opacity-35 cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="tabular-nums text-[var(--tx-primary)] px-1">
                  {todayValue}/{target} {habit.unit || ''}
                </span>
                <button
                  type="button"
                  onClick={e => handleStep(e, 1)}
                  disabled={isToggling}
                  aria-label={`Increase ${habit.name}`}
                  className="p-0.5 rounded hover:bg-[var(--sf-dim)] cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right Side: Category, 30d Rate, Streak, Actions ───── */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-xs">
        {/* Category Tag */}
        {habit.category && (
          <span className="hidden md:inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--sf-overlay)] text-[var(--tx-secondary)] border border-[var(--border-default)]">
            {habit.category}
          </span>
        )}

        {/* Frequency */}
        <span className="hidden sm:inline-flex text-[11px] font-mono text-[var(--tx-muted)] capitalize">
          {habit.frequency}
        </span>

        {/* 30-Day Completion Rate */}
        <div className="hidden lg:flex items-center gap-1.5 font-mono text-[11px] text-[var(--tx-secondary)] bg-[var(--sf-overlay)] px-2 py-1 rounded-lg border border-[var(--border-default)]">
          <span className="text-[var(--tx-muted)]">30d:</span>
          <span className="text-[var(--accent-ink)] font-semibold">{completionRate}%</span>
        </div>

        {/* Streak Indicator */}
        <div
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-mono text-xs font-semibold min-w-[56px] justify-center tabular-nums transition-colors',
            currentStreak > 0
              ? 'bg-orange-500/10 border-orange-500/25 text-orange-400'
              : 'bg-[var(--sf-overlay)] border-[var(--border-default)] text-[var(--tx-muted)]'
          )}
        >
          <Flame
            className={cn(
              'w-3.5 h-3.5',
              currentStreak > 0 ? 'text-orange-500 fill-orange-500/30' : 'text-[var(--tx-muted)]'
            )}
          />
          <span>{currentStreak}</span>
          <span className="text-[10px] font-normal opacity-70">d</span>
        </div>

        {/* Action Menu Trigger */}
        <div className="relative">
          <button
            onClick={e => {
              e.stopPropagation();
              setShowMenu(prev => !prev);
            }}
            aria-label="Habit options"
            className="p-1.5 rounded-lg text-[var(--tx-muted)] hover:text-[var(--tx-primary)] hover:bg-[var(--sf-overlay)] transition-colors cursor-pointer"
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
              <div className="absolute right-0 top-full mt-1.5 w-40 rounded-xl bg-[var(--sf-raised)] border border-[var(--border-strong)] shadow-xl z-50 p-1.5 text-xs">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit(habit);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[var(--tx-secondary)] hover:text-[var(--tx-primary)] hover:bg-[var(--sf-overlay)] rounded-lg transition-colors text-left"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[var(--tx-muted)]" />
                  <span>Edit Habit</span>
                </button>
                <button
                  onClick={async e => {
                    e.stopPropagation();
                    setShowMenu(false);
                    await onArchive(habit.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[var(--tx-secondary)] hover:text-[var(--tx-primary)] hover:bg-[var(--sf-overlay)] rounded-lg transition-colors text-left"
                >
                  <Archive className="w-3.5 h-3.5 text-[var(--tx-muted)]" />
                  <span>{habit.archived ? 'Unarchive' : 'Archive'}</span>
                </button>
                <div className="h-px bg-[var(--border-default)] my-1" />
                <button
                  onClick={async e => {
                    e.stopPropagation();
                    setShowMenu(false);
                    await onDelete(habit.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 rounded-lg transition-colors text-left font-semibold"
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
