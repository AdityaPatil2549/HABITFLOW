import React from 'react';
import {
  Flame,
  Edit2,
  Check,
  Calendar,
  Target,
  Zap,
  TrendingUp,
  Clock,
  Layers,
  Archive,
  Minus,
  Plus,
} from 'lucide-react';
import type { HabitWithStreak } from '../../../types';
import { IconRenderer } from '../../common/IconRenderer';
import { soundService } from '../../../services/soundService';

interface HabitInspectorCardProps {
  habit: HabitWithStreak | null;
  onEdit: (habit: HabitWithStreak) => void;
  onToggle: (habit: HabitWithStreak) => Promise<void>;
  onIncrement?: (habit: HabitWithStreak, delta: number) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
}

export function HabitInspectorCard({
  habit,
  onEdit,
  onToggle,
  onIncrement,
  onArchive,
}: HabitInspectorCardProps) {
  if (!habit) {
    return (
      <div className="card-raised p-6 flex flex-col items-center justify-center text-center min-h-[380px] rounded-2xl border border-[var(--border-default)]">
        <div className="w-12 h-12 rounded-2xl bg-[var(--sf-overlay)] border border-[var(--border-default)] flex items-center justify-center text-xl mb-3 text-[var(--tx-muted)]">
          <Layers className="w-6 h-6 stroke-[1.5]" />
        </div>
        <h3 className="text-sm font-bold text-[var(--tx-primary)] mb-1">
          Tactical Telemetry Inspector
        </h3>
        <p className="text-xs text-[var(--tx-secondary)] max-w-xs leading-relaxed">
          Select any habit from the workstation table to inspect 30-day velocity, ritual windows, and continuity metrics.
        </p>
      </div>
    );
  }

  const target = habit.targetValue || 1;
  const todayValue = habit.todayLog?.value ?? 0;
  const isDone = todayValue >= target;
  const currentStreak = habit.streak?.current ?? 0;
  const bestStreak = habit.streak?.best ?? currentStreak;
  const completionRate = Math.min(100, Math.round((habit.completionRate30Days ?? 0) * 100));
  const isStepper = (habit.type === 'count' || habit.type === 'duration') && target > 1;

  // Circular progress calculations (radius = 36, circumference = 2 * PI * 36 ≈ 226.19)
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <div className="card-raised p-5 sm:p-6 rounded-2xl border border-[var(--border-default)] space-y-5 sticky top-20">
      {/* ── Top Bar: Tag & Quick Actions ── */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border-default)] pb-4">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: habit.color || 'var(--accent)' }}
          />
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--tx-muted)] font-semibold">
            {habit.category || 'General'}
          </span>
          {habit.archived && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Archived
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(habit)}
            title="Edit Protocol"
            className="p-1.5 rounded-lg text-[var(--tx-muted)] hover:text-[var(--tx-primary)] hover:bg-[var(--sf-overlay)] transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onArchive(habit.id)}
            title={habit.archived ? 'Restore Habit' : 'Archive Habit'}
            className="p-1.5 rounded-lg text-[var(--tx-muted)] hover:text-[var(--tx-primary)] hover:bg-[var(--sf-overlay)] transition-colors cursor-pointer"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Identity Header ── */}
      <div className="flex items-start gap-3.5">
        <div
          className="w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 shadow-sm"
          style={{
            backgroundColor: habit.color ? `${habit.color}15` : 'var(--sf-overlay)',
            borderColor: habit.color ? `${habit.color}40` : 'var(--border-default)',
          }}
        >
          <IconRenderer
            name={habit.icon || 'Target'}
            size={24}
            color={habit.color || 'var(--accent)'}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-extrabold text-[var(--tx-primary)] tracking-tight leading-snug break-words">
            {habit.name}
          </h2>
          <p className="text-[11px] font-mono text-[var(--tx-muted)] mt-1">
            Target Quota: {target} {habit.unit || (target > 1 ? 'units' : 'time')} / {habit.frequency || 'day'}
          </p>
        </div>
      </div>

      {/* ── Velocity & Streak Telemetry Radar ── */}
      <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[var(--sf-overlay)] border border-[var(--border-default)]">
        {/* Circular Progress Gauge */}
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 88 88">
              <circle
                cx="44"
                cy="44"
                r={radius}
                className="stroke-[var(--border-default)] fill-none"
                strokeWidth="7"
              />
              <circle
                cx="44"
                cy="44"
                r={radius}
                className="transition-all duration-700 ease-out fill-none"
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ stroke: habit.color || 'var(--accent)' }}
              />
            </svg>
            <span className="absolute font-data text-xs font-bold text-[var(--tx-primary)]">
              {completionRate}%
            </span>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--tx-muted)] block">
              30d Adherence
            </span>
            <span className="text-xs font-bold text-[var(--tx-primary)] flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3 text-[var(--accent-ink)]" />
              {completionRate >= 80 ? 'Optimal' : completionRate >= 50 ? 'Steady' : 'Emerging'}
            </span>
          </div>
        </div>

        {/* Streak Metrics */}
        <div className="flex flex-col justify-center border-l border-[var(--border-default)] pl-3.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--tx-muted)]">
              Current
            </span>
            <span className="font-data text-xs font-bold text-[var(--tx-primary)] flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
              {currentStreak}d
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--tx-muted)]">
              Best Record
            </span>
            <span className="font-data text-xs font-semibold text-[var(--tx-secondary)]">
              {bestStreak}d
            </span>
          </div>
        </div>
      </div>

      {/* ── Ritual Protocol Spec ── */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-default)]">
          <span className="flex items-center gap-1.5 text-[var(--tx-secondary)]">
            <Calendar className="w-3.5 h-3.5 text-[var(--tx-muted)]" />
            Frequency
          </span>
          <span className="font-medium text-[var(--tx-primary)] capitalize">
            {habit.frequency || 'Daily Protocol'}
          </span>
        </div>

        <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-default)]">
          <span className="flex items-center gap-1.5 text-[var(--tx-secondary)]">
            <Target className="w-3.5 h-3.5 text-[var(--tx-muted)]" />
            Daily Quota
          </span>
          <span className="font-mono font-medium text-[var(--tx-primary)]">
            {todayValue} / {target} {habit.unit || ''}
          </span>
        </div>

        {habit.timeOfDay && (
          <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-default)]">
            <span className="flex items-center gap-1.5 text-[var(--tx-secondary)]">
              <Clock className="w-3.5 h-3.5 text-[var(--tx-muted)]" />
              Ritual Window
            </span>
            <span className="font-medium text-[var(--tx-primary)] capitalize">
              {habit.timeOfDay}
            </span>
          </div>
        )}
      </div>

      {/* ── Tactile Execution Call-to-Action ── */}
      <div className="pt-2">
        {isStepper ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onIncrement?.(habit, -1)}
              disabled={todayValue <= 0}
              className="p-3 rounded-xl bg-[var(--sf-overlay)] border border-[var(--border-default)] hover:border-[var(--border-strong)] text-[var(--tx-secondary)] hover:text-[var(--tx-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => onIncrement?.(habit, 1)}
              className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Log Step ({todayValue}/{target})</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              if (!isDone) soundService.playTick();
              else soundService.playUncheck();
              onToggle(habit);
            }}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              isDone
                ? 'bg-[var(--accent-subtle)] text-[var(--accent-ink)] border border-[var(--accent)] shadow-sm'
                : 'btn-primary'
            }`}
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{isDone ? 'Completed Today (Click to Undo)' : 'Log Ritual Today'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
