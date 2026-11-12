import type React from 'react';
import { Minus, Plus } from 'lucide-react';
import type { HabitWithStreak } from '@/types';
import { cn } from '@/lib/utils';

interface HabitStepperProps {
  habit: HabitWithStreak;
  todayValue: number;
  disabled?: boolean;
  onStep: (e: React.MouseEvent, delta: number) => void;
  onRate: (e: React.MouseEvent, score: number) => void;
}

/**
 * Inline stepper [−] val/target [+] for count & duration habits,
 * or 1-5 tactile score bar for rating habits.
 */
export function HabitStepper({
  habit,
  todayValue,
  disabled = false,
  onStep,
  onRate,
}: HabitStepperProps) {
  const target = habit.targetValue || 1;
  const isDone = todayValue >= target;

  if (habit.type === 'rating') {
    return (
      <div
        className="inline-flex items-center gap-1 rounded-xl border border-[var(--border-default)] bg-[var(--sf-overlay)] p-1"
        role="group"
        aria-label={`Rate ${habit.name}`}
        onClick={e => e.stopPropagation()}
      >
        {[1, 2, 3, 4, 5].map(score => (
          <button
            key={score}
            type="button"
            onClick={e => onRate(e, score)}
            disabled={disabled}
            aria-label={`Rate ${habit.name} ${score} out of 5`}
            aria-pressed={todayValue === score}
            className={cn(
              'w-7 h-7 rounded-lg font-mono text-xs font-semibold transition-transform duration-100 cursor-pointer tabular-nums active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed',
              todayValue >= score
                ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                : 'text-[var(--tx-secondary)] hover:bg-[var(--sf-raised)] hover:text-[var(--tx-primary)]'
            )}
          >
            {score}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-xl border px-1.5 py-1 transition-colors duration-100',
        isDone
          ? 'bg-[var(--accent-subtle)] border-[var(--accent)]'
          : 'bg-[var(--sf-overlay)] border-[var(--border-default)]'
      )}
      onClick={e => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={e => onStep(e, -1)}
        disabled={disabled || todayValue <= 0}
        aria-label={`Decrease ${habit.name}`}
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[var(--tx-secondary)] hover:bg-[var(--sf-raised)] hover:text-[var(--tx-primary)] active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed transition-transform duration-100 cursor-pointer"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <span className="min-w-[44px] text-center font-mono text-xs font-semibold tabular-nums text-[var(--tx-primary)] px-1">
        {todayValue}/{target}
      </span>

      <button
        type="button"
        onClick={e => onStep(e, 1)}
        disabled={disabled}
        aria-label={`Increase ${habit.name}`}
        className={cn(
          'w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-transform duration-100 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
          isDone
            ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
            : 'bg-[var(--sf-raised)] text-[var(--tx-primary)] border border-[var(--border-default)] hover:border-[var(--accent)]'
        )}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
