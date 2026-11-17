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
                ? 'text-white'
                : 'text-[var(--tx-secondary)] hover:bg-[var(--sf-raised)] hover:text-[var(--tx-primary)]'
            )}
            style={
              todayValue >= score
                ? {
                    backgroundColor: habit.color || 'var(--accent)',
                    boxShadow: habit.color ? `0 1px 8px -1px ${habit.color}60` : undefined,
                  }
                : undefined
            }
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
        'inline-flex items-center gap-1 rounded-xl border px-1.5 py-1 transition-all duration-150',
        isDone
          ? 'bg-[var(--sf-raised)]'
          : 'bg-[var(--sf-overlay)] border-[var(--border-default)]'
      )}
      style={
        isDone
          ? {
              borderColor: habit.color || 'var(--accent)',
              backgroundColor: habit.color ? `${habit.color}15` : 'var(--accent-subtle)',
              boxShadow: habit.color ? `0 0 12px -2px ${habit.color}40` : undefined,
            }
          : undefined
      }
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
          'w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all duration-100 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
          isDone
            ? 'text-white'
            : 'bg-[var(--sf-raised)] text-[var(--tx-primary)] border border-[var(--border-default)] hover:border-[var(--accent)] hover:scale-105'
        )}
        style={
          isDone
            ? {
                backgroundColor: habit.color || 'var(--accent)',
                boxShadow: habit.color ? `0 2px 10px -2px ${habit.color}65` : undefined,
              }
            : undefined
        }
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

