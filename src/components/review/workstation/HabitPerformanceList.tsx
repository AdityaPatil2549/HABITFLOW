import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Star, AlertTriangle, ChevronRight, Check, Flame } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { db } from '../../../db';
import { IconRenderer } from '../../common/IconRenderer';
import { SpotlightCard } from '../../ui/motion/SpotlightCard';
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
                'w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold transition-all',
                done
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_8px_rgba(52,211,153,0.15)]'
                  : 'bg-white/[0.03] border border-white/[0.06] text-transparent'
              )}
            >
              {done ? <Check size={10} strokeWidth={3} /> : ''}
            </div>
            <span className="text-[8px] font-mono text-slate-500 uppercase">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-emerald-400" />
          <h3 className="text-sm font-bold text-white">
            Habit Execution Roster ({habits.length})
          </h3>
        </div>

        <div className="flex items-center gap-1 bg-[#13151f] p-1 rounded-lg border border-white/[0.06]">
          {[
            { id: 'all', label: 'All Habits' },
            { id: 'star', label: 'Top Performers' },
            { id: 'struggling', label: 'Needs Focus' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={cn(
                'px-2.5 py-1 text-xs font-mono rounded-md transition-all',
                filter === f.id
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs font-mono">
          No habits matched the selected filter.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(h => (
            <SpotlightCard
              key={h.id}
              className={cn(
                'p-3.5 sm:p-4 rounded-xl bg-[#0e1017]/80 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                h.isBest && 'border-amber-500/30 bg-amber-500/[0.02]',
                h.isStruggling && 'border-rose-500/20 bg-rose-500/[0.02]',
                !h.isBest && !h.isStruggling && 'border-white/[0.06]'
              )}
            >
              {/* Left: Icon, Name, Category */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300 flex-shrink-0">
                  <IconRenderer name={h.icon || 'zap'} size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white truncate">
                      {h.name}
                    </span>
                    {h.isBest && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Star size={9} /> Top
                      </span>
                    )}
                    {h.isStruggling && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                        <AlertTriangle size={9} /> Needs Care
                      </span>
                    )}
                  </div>
                  {h.category && (
                    <span className="text-[10px] font-mono text-slate-400">
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
                  <span className="text-xs font-mono font-bold text-white">
                    {h.rate}%
                  </span>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden mt-1">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        h.rate >= 75 ? 'bg-emerald-400' : h.rate >= 50 ? 'bg-blue-400' : 'bg-rose-400'
                      )}
                      style={{ width: `${h.rate}%` }}
                    />
                  </div>
                </div>

                {/* Streak Badge */}
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono">
                  <Flame size={12} />
                  <span>{h.streak}d</span>
                </div>
              </div>
            </SpotlightCard>
          ))}
        </div>
      )}
    </div>
  );
}
