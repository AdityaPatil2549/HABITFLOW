import React, { useState, useEffect } from 'react';
import { TrendingUp, Star, AlertTriangle, Check, Flame } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { db } from '../../../db';
import { IconRenderer } from '../../common/IconRenderer';
import { cn } from '../../../lib/utils';

export interface HabitPerformanceItem {
  id: string;
  name: string;
  icon: string;
  category?: string;
  rate: number;
  streak: number;
  isBest: boolean;
  isStruggling: boolean;
}

interface HabitPerformanceListProps {
  habits: HabitPerformanceItem[];
}

function MiniDayGrid({ habitId }: { habitId: string }) {
  const [daysDone, setDaysDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;
    const days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'));
    db.habitLogs
      .where('habitId').equals(habitId)
      .and(l => days.includes(l.date) && !l.isFrozen && l.value >= 1)
      .toArray()
      .then(ls => {
        if (!mounted) return;
        const m: Record<string, boolean> = {};
        ls.forEach(l => { m[l.date] = true; });
        setDaysDone(m);
      })
      .catch(() => {});

    return () => { mounted = false; };
  }, [habitId]);

  const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));

  return (
    <div className="flex items-center gap-1">
      {days.map(d => {
        const key = format(d, 'yyyy-MM-dd');
        const done = daysDone[key];
        return (
          <div key={key} className="flex flex-col items-center gap-0.5">
            <div
              className={cn(
                'w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold transition-colors duration-150',
                done
                  ? 'bg-[var(--ok-subtle)] text-[var(--ok)] border border-[var(--ok)]/30'
                  : 'bg-[var(--sf-overlay)] border border-[var(--border-default)] text-transparent'
              )}
            >
              {done ? <Check size={10} strokeWidth={3} /> : ''}
            </div>
            <span className="text-[10px] font-mono font-medium text-[var(--tx-muted)] uppercase">
              {format(d, 'eeeee')}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function HabitPerformanceList({ habits }: HabitPerformanceListProps) {
  const [filter, setFilter] = useState<'all' | 'star' | 'struggling'>('all');

  const filtered = habits.filter(h => {
    if (filter === 'star') return h.isBest || h.rate >= 80;
    if (filter === 'struggling') return h.isStruggling || h.rate < 50;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Subheader and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border-default)]">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-[var(--ok)]" />
          <h3 className="text-sm font-bold text-[var(--tx-primary)]">
            Habit Execution Roster ({habits.length})
          </h3>
        </div>

        <div className="flex items-center gap-1 bg-[var(--sf-overlay)] p-1 rounded-lg border border-[var(--border-default)]">
          {([
            { id: 'all', label: 'All Habits' },
            { id: 'star', label: 'Top Performers' },
            { id: 'struggling', label: 'Needs Focus' },
          ] as const).map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                'px-2.5 py-1 text-xs font-mono rounded-md transition-colors duration-150 cursor-pointer',
                filter === f.id
                  ? 'bg-[var(--ok-subtle)] text-[var(--ok)] border border-[var(--ok)]/30 font-semibold'
                  : 'text-[var(--tx-muted)] hover:text-[var(--tx-primary)]'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-[var(--tx-muted)] text-xs font-mono">
          No habits matched the selected filter.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(h => (
            <div
              key={h.id}
              className={cn(
                'p-3.5 sm:p-4 rounded-xl card-raised transition-colors duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                h.isBest && 'border-[var(--border-strong)]',
                h.isStruggling && 'border-[var(--danger)]/30'
              )}
            >
              {/* Left: Icon, Name, Category */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[var(--sf-overlay)] border border-[var(--border-default)] flex items-center justify-center text-[var(--tx-secondary)] flex-shrink-0">
                  <IconRenderer name={h.icon || 'zap'} size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--tx-primary)] truncate">
                      {h.name}
                    </span>
                    {h.isBest && (
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[var(--warn-subtle)] text-[var(--warn)] border border-[var(--warn)]/30 flex items-center gap-1">
                        <Star size={11} /> Top
                      </span>
                    )}
                    {h.isStruggling && (
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[var(--danger-subtle)] text-[var(--danger)] border border-[var(--danger)]/30 flex items-center gap-1">
                        <AlertTriangle size={11} /> Needs Care
                      </span>
                    )}
                  </div>
                  {h.category && (
                    <span className="text-xs font-mono text-[var(--tx-secondary)]">
                      {h.category}
                    </span>
                  )}
                </div>
              </div>

              {/* Middle: 7-day Mini Day Grid */}
              <div className="self-start sm:self-auto">
                <MiniDayGrid habitId={h.id} />
              </div>

              {/* Right: Rate Bar & Streak */}
              <div className="flex items-center gap-4 flex-shrink-0 justify-between sm:justify-end">
                {/* 30-day completion rate */}
                <div className="flex flex-col items-end w-20">
                  <span className="text-xs font-mono font-bold text-[var(--tx-primary)] tabular-nums">
                    {h.rate}%
                  </span>
                  <div className="w-full h-1.5 rounded-full bg-[var(--sf-overlay)] overflow-hidden mt-1">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-150',
                        h.rate >= 75 ? 'bg-[var(--ok)]' : h.rate >= 50 ? 'bg-[var(--accent)]' : 'bg-[var(--danger)]'
                      )}
                      style={{ width: `${h.rate}%` }}
                    />
                  </div>
                </div>

                {/* Streak Badge */}
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--sf-overlay)] border border-[var(--border-default)] text-[var(--tx-secondary)] text-xs font-mono tabular-nums">
                  <Flame size={12} />
                  <span>{h.streak}d</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
