import type React from 'react';
import { useState } from 'react';
import { Check, Flame, Zap, Lock, Link2Off } from 'lucide-react';
import type { HabitLog, HabitWithStreak, TelemetryMode } from '../../types';
import { soundService } from '../../services/soundService';
import { cn } from '../../lib/utils';
import { getHabitEmoji } from '../../lib/emoji';
import { ContinuityTape } from './ContinuityTape';
import { HabitStepper } from './HabitStepper';

interface TactileHabitCardProps {
  habit: HabitWithStreak;
  onToggle: (habit: HabitWithStreak) => Promise<void>;
  onIncrement?: (habit: HabitWithStreak, delta: number) => Promise<void>;
  onSetValue?: (habit: HabitWithStreak, value: number) => Promise<void>;
  onOpenDetails?: (habit: HabitWithStreak) => void;
  onBypassLock?: (habitId: string) => void;
  isBypassed?: boolean;
  isPrimed?: boolean;
  isLocked?: boolean;
  parentHabitName?: string;
  nextHabitName?: string;
  recentLogs?: HabitLog[];
  momentumScore?: number;
  telemetryMode?: TelemetryMode;
  zenExpanded?: boolean;
}

export function TactileHabitCard({
  habit,
  onToggle,
  onIncrement,
  onSetValue,
  onOpenDetails,
  onBypassLock,
  isBypassed = false,
  isPrimed = false,
  isLocked = false,
  parentHabitName,
  nextHabitName,
  recentLogs = [],
  momentumScore,
  telemetryMode = 'scaffold',
  zenExpanded = false,
}: TactileHabitCardProps) {
  const [isToggling, setIsToggling] = useState(false);

  const target = habit.targetValue || 1;
  const todayValue = habit.todayLog?.value ?? 0;
  const isDone = todayValue >= target;
  const isStepperHabit = (habit.type === 'count' || habit.type === 'duration') && target > 1;
  const isRatingHabit = habit.type === 'rating';
  const currentStreak = habit.streak?.current ?? 0;
  const effectiveLocked = isLocked && !isBypassed && !isDone;
  const showTelemetry = telemetryMode !== 'monastic';

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isToggling || effectiveLocked) return;
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
    if (isToggling || effectiveLocked) return;
    setIsToggling(true);
    try {
      if (delta > 0) soundService.playTick();
      else soundService.playUncheck();

      if (onIncrement) {
        await onIncrement(habit, delta);
      } else {
        await onToggle(habit);
      }
    } finally {
      setIsToggling(false);
    }
  };

  const handleRate = async (e: React.MouseEvent, score: number) => {
    e.stopPropagation();
    if (isToggling || effectiveLocked) return;
    setIsToggling(true);
    try {
      soundService.playTick();
      if (onSetValue) {
        await onSetValue(habit, todayValue === score ? 0 : score);
      } else {
        await onToggle(habit);
      }
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div
      className="relative group"
      onClick={() => onOpenDetails?.(habit)}
      onKeyDown={e => {
        if (e.key === 'Enter' && e.target === e.currentTarget) {
          onOpenDetails?.(habit);
        }
      }}
      role={onOpenDetails ? 'button' : undefined}
      tabIndex={onOpenDetails ? 0 : undefined}
      aria-label={onOpenDetails ? `Edit ${habit.name}` : undefined}
    >
      <div
        className={cn(
          'relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border transition-colors duration-150',
          isDone
            ? 'bg-[var(--sf-raised)] border-[var(--accent)] border-l-[3px]'
            : isPrimed
              ? 'bg-[var(--sf-raised)] border-[var(--accent)] animate-chain-prime'
              : effectiveLocked
                ? 'bg-[var(--sf-base)] border-[var(--border-default)] opacity-50'
                : 'bg-[var(--sf-raised)] border-[var(--border-default)] hover:border-[var(--border-strong)]'
        )}
      >
        {/* Left: Icon + Name + Subline */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className={cn(
              'w-9 h-9 sm:w-10 sm:h-10 rounded-lg border flex items-center justify-center text-lg shrink-0',
              isDone
                ? 'bg-[var(--accent-subtle)] border-[var(--accent)]'
                : 'bg-[var(--sf-overlay)] border-[var(--border-default)]'
            )}
          >
            <span aria-hidden="true">{getHabitEmoji(habit.icon)}</span>
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={cn(
                  'font-semibold tracking-tight truncate transition-colors',
                  zenExpanded ? 'text-base sm:text-xl' : 'text-sm sm:text-base',
                  isDone ? 'line-through text-[var(--tx-muted)]' : 'text-[var(--tx-primary)]'
                )}
                title={habit.name}
              >
                {habit.name}
              </h3>

              {isPrimed && !isDone && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-[var(--accent-subtle)] text-[var(--accent-ink)] border border-[var(--accent)] shrink-0">
                  <Zap size={10} />
                  <span>Primed</span>
                </span>
              )}

              {effectiveLocked && parentHabitName && (
                <div className="inline-flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono text-[var(--tx-secondary)] bg-[var(--sf-overlay)] border border-[var(--border-default)]">
                    <Lock size={10} />
                    <span>After {parentHabitName}</span>
                  </span>
                  {onBypassLock && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        soundService.playUnlatchClick();
                        onBypassLock(habit.id);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold text-[var(--accent-ink)] bg-[var(--accent-subtle)] hover:opacity-90 border border-[var(--border-default)] cursor-pointer"
                    >
                      <Link2Off size={10} />
                      <span>Bypass Link Today</span>
                    </button>
                  )}
                </div>
              )}

              {isBypassed && !isDone && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono text-[var(--tx-secondary)] bg-[var(--sf-overlay)] border border-[var(--border-default)]">
                  Link bypassed today
                </span>
              )}
            </div>

            {/* Subline: Continuity Tape + Momentum % + Streak + Chain */}
            {showTelemetry && (
              <div className="flex items-center gap-2.5 flex-wrap text-xs text-[var(--tx-secondary)]">
                <ContinuityTape habit={habit} logs={recentLogs} />

                {typeof momentumScore === 'number' && (
                  <span className="font-data text-xs text-[var(--tx-primary)]">
                    {momentumScore}% <span className="text-[var(--tx-muted)] font-sans">mom.</span>
                  </span>
                )}

                {currentStreak > 0 && (
                  <span className="inline-flex items-center gap-1 font-data text-xs text-[var(--accent-ink)]">
                    <Flame size={12} aria-hidden="true" />
                    <span>{currentStreak}</span>
                    <span className="sr-only">day streak</span>
                  </span>
                )}

                {nextHabitName && (
                  <span className="text-[11px] font-mono text-[var(--tx-muted)] truncate hidden sm:inline">
                    Chain: → {nextHabitName}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Stepper / Rating / Check Button */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          {isStepperHabit ? (
            <HabitStepper
              habit={habit}
              todayValue={todayValue}
              disabled={isToggling || effectiveLocked}
              onStep={handleStep}
              onRate={handleRate}
            />
          ) : isRatingHabit ? (
            <HabitStepper
              habit={habit}
              todayValue={todayValue}
              disabled={isToggling || effectiveLocked}
              onStep={handleStep}
              onRate={handleRate}
            />
          ) : (
            <button
              type="button"
              onClick={handleToggle}
              disabled={isToggling || effectiveLocked}
              aria-label={isDone ? `Mark ${habit.name} incomplete` : `Mark ${habit.name} complete`}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center border transition-transform duration-100 ease-out cursor-pointer active:scale-[0.94] disabled:opacity-45 disabled:cursor-not-allowed',
                isDone
                  ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)]'
                  : isPrimed
                    ? 'bg-[var(--accent-subtle)] text-[var(--accent-ink)] border-[var(--accent)] hover:opacity-90'
                    : 'bg-[var(--sf-overlay)] text-[var(--tx-secondary)] border-[var(--border-strong)] hover:border-[var(--accent)] hover:text-[var(--tx-primary)]'
              )}
            >
              {isDone ? (
                <Check className="w-5 h-5" strokeWidth={2.75} />
              ) : (
                <span className="w-3.5 h-3.5 rounded-[4px] border border-current opacity-70" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TactileHabitCard;
