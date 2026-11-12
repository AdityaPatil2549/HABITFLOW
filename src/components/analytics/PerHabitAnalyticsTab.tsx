import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, subWeeks, eachDayOfInterval } from 'date-fns';
import { db } from '../../db';
import type { HabitWithStreak } from '../../types';
import { IconRenderer } from '../common/IconRenderer';
import { StatCard, ChartCard, EmptyChart } from './shared';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';

interface PerHabitTabProps {
  habits: HabitWithStreak[];
}

// ─── Per-Habit 26-Week Heatmap ────────────────────────────────
function Heatmap({ logs }: { logs: Record<string, number> }) {
  const weeks = 26;
  const today = new Date();
  const startDate = subWeeks(today, weeks);
  const days = eachDayOfInterval({ start: startDate, end: today });
  const grid: { date: string; value: number }[][] = [];
  let week: { date: string; value: number }[] = [];

  days.forEach((d, i) => {
    const ds = format(d, 'yyyy-MM-dd');
    week.push({ date: ds, value: logs[ds] ?? 0 });
    if (d.getDay() === 6 || i === days.length - 1) {
      grid.push(week);
      week = [];
    }
  });

  function colorFor(val: number) {
    if (val === 0) return 'rgba(255, 255, 255, 0.04)';
    if (val < 0.4) return 'rgba(16, 185, 129, 0.35)';
    if (val < 0.7) return 'rgba(16, 185, 129, 0.70)';
    return '#10b981';
  }

  return (
    <div className="overflow-x-auto pb-2">
      <svg width={grid.length * 14} height={7 * 14}>
        {grid.map((wk, wi) =>
          wk.map(day => (
            <rect
              key={day.date}
              x={wi * 14}
              y={day.date ? new Date(day.date + 'T00:00:00').getDay() * 14 : 0}
              width={11}
              height={11}
              rx={3}
              fill={colorFor(day.value)}
            >
              <title>
                {day.date}: {Math.round(day.value * 100)}%
              </title>
            </rect>
          ))
        )}
      </svg>
      <div className="flex items-center gap-2 mt-3 text-xs text-[var(--tx-muted)]">
        <span>Less</span>
        {[0, 0.3, 0.6, 1].map(v => (
          <div key={v} className="w-3 h-3 rounded-sm" style={{ background: colorFor(v) }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

// ─── Main Per-Habit Tab ───────────────────────────────────────
export function PerHabitAnalyticsTab({ habits }: PerHabitTabProps) {
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [perHabitDays, setPerHabitDays] = useState<7 | 30 | 90>(30);
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});

  const selectedHabit = habits.find(h => h.id === selectedHabitId) ?? habits[0] ?? null;

  useEffect(() => {
    if (!selectedHabit) return;
    let isMounted = true;
    const cutoff = format(subDays(new Date(), perHabitDays), 'yyyy-MM-dd');
    const today = format(new Date(), 'yyyy-MM-dd');

    (async () => {
      const logs = await db.habitLogs
        .where('habitId')
        .equals(selectedHabit.id)
        .and(l => l.date >= cutoff && l.date <= today)
        .toArray();
      const map: Record<string, number> = {};
      logs.forEach(l => {
        map[l.date] =
          selectedHabit.type === 'boolean'
            ? l.value >= 1
              ? 1
              : 0
            : Math.min(l.value / selectedHabit.targetValue, 1);
      });
      if (isMounted) setHeatmapData(map);
    })();

    return () => {
      isMounted = false;
    };
  }, [selectedHabit, perHabitDays]);

  if (habits.length === 0) {
    return <EmptyChart message="No habits created yet" sub="Create your first habit to view individual performance telemetry." />;
  }

  const completionPct = Math.round(
    (Object.values(heatmapData).filter(v => v >= 1).length / Math.max(1, perHabitDays)) * 100
  );

  return (
    <div className="space-y-6">
      {/* Habit selector pills */}
      <div className="flex flex-wrap gap-2">
        {habits.map(h => (
          <button
            key={h.id}
            onClick={() => setSelectedHabitId(h.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border cursor-pointer ${
              selectedHabit?.id === h.id
                ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] font-extrabold'
                : 'bg-[var(--sf-raised)] border-[var(--border-default)] text-[var(--tx-secondary)] hover:text-[var(--tx-primary)] hover:border-[var(--border-strong)]'
            }`}
          >
            <span>
              <IconRenderer name={h.icon} size={16} />
            </span>
            <span>{h.name}</span>
          </button>
        ))}
      </div>

      {selectedHabit && (
        <>
          {/* Date range selector */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex bg-[var(--sf-raised)] p-1 rounded-xl border border-[var(--border-default)] relative">
              {([7, 30, 90] as const).map(days => (
                <button
                  key={days}
                  onClick={() => setPerHabitDays(days)}
                  className={`relative z-10 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    perHabitDays === days
                      ? 'text-[var(--accent-fg)]'
                      : 'text-[var(--tx-secondary)] hover:text-[var(--tx-primary)]'
                  }`}
                >
                  {perHabitDays === days && (
                    <motion.div
                      layoutId="per-habit-timeframe-pill"
                      className="absolute inset-0 bg-[var(--accent)] rounded-lg"
                      style={{ zIndex: -1 }}
                      transition={{ duration: 0.14, ease: 'easeOut' }}
                    />
                  )}
                  {days} Days
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              icon="🔥"
              label="Current Streak"
              value={`${selectedHabit.streak.current}d`}
              colorClass="kpi-card-amber"
            />
            <StatCard
              icon="🏆"
              label="Best Streak"
              value={`${selectedHabit.streak.best}d`}
              colorClass="kpi-card-indigo"
            />
            <StatCard
              icon="📈"
              label={`${perHabitDays}d Completion`}
              value={`${completionPct}%`}
              colorClass="kpi-card-emerald"
            />
            <StatCard
              icon="📅"
              label="Since"
              value={selectedHabit.startDate}
              colorClass="kpi-card-indigo"
            />
          </div>

          <ChartCard
            title={
              <span className="flex items-center gap-2">
                <IconRenderer name={selectedHabit.icon} size={20} /> {selectedHabit.name} — Completion Heatmap
              </span>
            }
            subtitle={`Last ${perHabitDays} days of habit consistency`}
          >
            <WidgetErrorBoundary title="Habit Heatmap">
              <Heatmap logs={heatmapData} />
            </WidgetErrorBoundary>
          </ChartCard>
        </>
      )}
    </div>
  );
}
