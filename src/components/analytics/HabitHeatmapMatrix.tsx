import React, { useState, useEffect } from 'react';
import { format, subYears, eachDayOfInterval } from 'date-fns';
import { toPng } from 'html-to-image';
import { db } from '../../db';
import { habitService } from '../../services/habitService';
import type { HabitWithStreak, Mood } from '../../types';
import { Skeleton } from '../ui/Skeleton';
import { EmptyChart } from './shared';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';

interface HeatmapMatrixProps {
  habits: HabitWithStreak[];
  moods: Mood[];
}

// ─── 365-Day Yearly Habit Activity Heatmap ─────────────────────
function YearlyHeatmap({ habits }: { habits: HabitWithStreak[] }) {
  const [data, setData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    if (!habits.length) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }
    let isMounted = true;
    (async () => {
      setLoading(true);
      const today = new Date();
      const yearAgo = subYears(today, 1);
      const yearAgoStr = format(yearAgo, 'yyyy-MM-dd');
      const todayStr = format(today, 'yyyy-MM-dd');
      const days = eachDayOfInterval({ start: yearAgo, end: today });

      const allLogs = await db.habitLogs
        .where('date')
        .between(yearAgoStr, todayStr, true, true)
        .toArray();

      const logsByDate = new Map<string, typeof allLogs>();
      for (const log of allLogs) {
        if (!logsByDate.has(log.date)) logsByDate.set(log.date, []);
        logsByDate.get(log.date)!.push(log);
      }

      const map: Record<string, number> = {};
      for (const day of days) {
        const ds = format(day, 'yyyy-MM-dd');
        const logs = logsByDate.get(ds) ?? [];
        const scheduled = habits.filter(h => habitService.isScheduledForDate(h, ds));
        map[ds] = scheduled.length ? logs.filter(l => l.value >= 1).length / scheduled.length : 0;
      }
      if (isMounted) {
        setData(map);
        setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [habits]);

  function colorFor(val: number) {
    if (val === 0) return 'rgba(255, 255, 255, 0.04)';
    if (val < 0.25) return 'rgba(16, 185, 129, 0.25)';
    if (val < 0.5) return 'rgba(16, 185, 129, 0.50)';
    if (val < 0.75) return 'rgba(16, 185, 129, 0.75)';
    return '#10b981';
  }

  const today = new Date();
  const yearAgo = subYears(today, 1);
  const days = eachDayOfInterval({ start: yearAgo, end: today });

  const weeks: { date: string; value: number; dow: number }[][] = [];
  let week: { date: string; value: number; dow: number }[] = [];
  days.forEach((d, i) => {
    const ds = format(d, 'yyyy-MM-dd');
    week.push({ date: ds, value: data[ds] ?? 0, dow: d.getDay() });
    if (d.getDay() === 6 || i === days.length - 1) {
      weeks.push(week);
      week = [];
    }
  });

  const monthLabels: { label: string; col: number }[] = [];
  weeks.forEach((wk, wi) => {
    const firstDay = wk[0];
    if (firstDay) {
      const d = new Date(firstDay.date + 'T00:00:00');
      if (wi === 0 || d.getDate() <= 7) {
        monthLabels.push({ label: MONTHS[d.getMonth()], col: wi });
      }
    }
  });

  if (loading) {
    return (
      <div className="h-40 w-full rounded-2xl overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  const CELL = 13;
  const GAP = 2;
  const STEP = CELL + GAP;

  return (
    <div className="space-y-4">
        <div className="overflow-x-auto pb-2 -mx-1">
          <svg width={weeks.length * STEP + 30} height={7 * STEP + 24} className="block">
            {monthLabels.map(({ label, col }) => (
              <text
                key={`${label}-${col}`}
                x={col * STEP + 30}
                y={10}
                fill="#64748b"
                fontSize={10}
                fontFamily="Inter, sans-serif"
              >
                {label}
              </text>
            ))}
            {['M', 'W', 'F'].map((l, i) => (
              <text
                key={l}
                x={4}
                y={12 + (i * 2 + 1) * STEP}
                fill="#64748b"
                fontSize={9}
                fontFamily="Inter, sans-serif"
                alignmentBaseline="middle"
              >
                {l}
              </text>
            ))}
            {weeks.map((wk, wi) =>
              wk.map(day => (
                <rect
                  key={day.date}
                  x={wi * STEP + 30}
                  y={12 + day.dow * STEP}
                  width={CELL}
                  height={CELL}
                  rx={3}
                  fill={colorFor(day.value)}
                  style={{ transition: 'fill 0.3s' }}
                >
                  <title>
                    {day.date}: {Math.round(day.value * 100)}% completion
                  </title>
                </rect>
              ))
            )}
          </svg>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--tx-muted)]">
          <span>Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map(v => (
            <div key={v} className="w-3 h-3 rounded-sm" style={{ background: colorFor(v) }} />
          ))}
          <span>More</span>
          <span className="ml-auto text-[var(--tx-muted)] font-mono text-[11px]">
            {days.length} days logged
          </span>
        </div>
      </div>
  );
}

// ─── 365-Day Mood Yearly Heatmap ──────────────────────────────
function MoodYearlyHeatmap({ moods }: { moods: Mood[] }) {
  const [data, setData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    if (!moods.length) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }
    let isMounted = true;
    (async () => {
      setLoading(true);
      const today = new Date();
      const yearAgo = subYears(today, 1);
      const yearAgoStr = format(yearAgo, 'yyyy-MM-dd');
      const todayStr = format(today, 'yyyy-MM-dd');

      const allMoods = await db.moods
        .where('date')
        .between(yearAgoStr, todayStr, true, true)
        .toArray();

      const map: Record<string, number> = {};
      for (const m of allMoods) {
        map[m.date] = m.score;
      }
      if (isMounted) {
        setData(map);
        setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [moods]);

  function colorFor(val: number) {
    if (!val || val === 0) return 'rgba(255, 255, 255, 0.04)';
    if (val === 1) return '#f43f5e'; // Rose
    if (val === 2) return '#fb923c'; // Orange
    if (val === 3) return '#facc15'; // Amber
    if (val === 4) return '#38bdf8'; // Sky
    if (val === 5) return '#a855f7'; // Purple
    return 'rgba(255, 255, 255, 0.04)';
  }

  const today = new Date();
  const yearAgo = subYears(today, 1);
  const days = eachDayOfInterval({ start: yearAgo, end: today });

  const weeks: { date: string; value: number; dow: number }[][] = [];
  let week: { date: string; value: number; dow: number }[] = [];
  days.forEach((d, i) => {
    const ds = format(d, 'yyyy-MM-dd');
    week.push({ date: ds, value: data[ds] ?? 0, dow: d.getDay() });
    if (d.getDay() === 6 || i === days.length - 1) {
      weeks.push(week);
      week = [];
    }
  });

  const monthLabels: { label: string; col: number }[] = [];
  weeks.forEach((wk, wi) => {
    const firstDay = wk[0];
    if (firstDay) {
      const d = new Date(firstDay.date + 'T00:00:00');
      if (wi === 0 || d.getDate() <= 7) {
        monthLabels.push({ label: MONTHS[d.getMonth()], col: wi });
      }
    }
  });

  if (loading) {
    return (
      <div className="h-40 w-full rounded-2xl overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  const CELL = 13;
  const GAP = 2;
  const STEP = CELL + GAP;

  return (
    <div className="space-y-4">
        <div className="overflow-x-auto pb-2 -mx-1">
          <svg width={weeks.length * STEP + 30} height={7 * STEP + 24} className="block">
            {monthLabels.map(({ label, col }) => (
              <text
                key={`${label}-${col}`}
                x={col * STEP + 30}
                y={10}
                fill="#64748b"
                fontSize={10}
                fontFamily="Inter, sans-serif"
              >
                {label}
              </text>
            ))}
            {['M', 'W', 'F'].map((l, i) => (
              <text
                key={l}
                x={4}
                y={12 + (i * 2 + 1) * STEP}
                fill="#64748b"
                fontSize={9}
                fontFamily="Inter, sans-serif"
                alignmentBaseline="middle"
              >
                {l}
              </text>
            ))}
            {weeks.map((wk, wi) =>
              wk.map(day => (
                <rect
                  key={day.date}
                  x={wi * STEP + 30}
                  y={12 + day.dow * STEP}
                  width={CELL}
                  height={CELL}
                  rx={3}
                  fill={colorFor(day.value)}
                  style={{ transition: 'fill 0.3s' }}
                >
                  <title>
                    {day.date}: Mood {day.value > 0 ? `${day.value}/5` : 'Not recorded'}
                  </title>
                </rect>
              ))
            )}
          </svg>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--tx-muted)]">
          <span>Awful</span>
          {[1, 2, 3, 4, 5].map(v => (
            <div key={v} className="w-3 h-3 rounded-sm" style={{ background: colorFor(v) }} />
          ))}
          <span>Awesome</span>
          <span className="ml-auto text-[var(--tx-muted)] font-mono text-[11px]">
            {days.length} days
          </span>
        </div>
      </div>
  );
}

// ─── Main Heatmap Matrix Component ─────────────────────────────
export function HabitHeatmapMatrix({ habits, moods }: HeatmapMatrixProps) {
  const handleExportMood = () => {
    const el = document.getElementById('mood-heatmap-export');
    if (el) {
      toPng(el, { backgroundColor: '#090a10' }).then(dataUrl => {
        const link = document.createElement('a');
        link.download = 'habitflow-mood-year-in-pixels.png';
        link.href = dataUrl;
        link.click();
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="card-raised rounded-2xl p-6">
        <div className="mb-5">
          <h3 className="text-base font-bold text-[var(--tx-primary)] flex items-center gap-2">
            🟩 Habit Activity Heatmap
          </h3>
          <p className="text-xs text-[var(--tx-secondary)] mt-1">
            Your overall habit completion matrix across the entire last year, styled like GitHub.
          </p>
        </div>
        <WidgetErrorBoundary title="Habit Activity Heatmap">
          {habits.length > 0 ? <YearlyHeatmap habits={habits} /> : <EmptyChart />}
        </WidgetErrorBoundary>
      </div>

      <div className="card-raised rounded-2xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[var(--tx-primary)] flex items-center gap-2">
              🎨 Year in Pixels (Mood)
            </h3>
            <p className="text-xs text-[var(--tx-secondary)] mt-1">
              Your daily emotional energy painted across all 365 days.
            </p>
          </div>
          <button
            onClick={handleExportMood}
            className="btn-secondary px-3 py-1.5 text-xs font-bold flex items-center gap-2"
          >
            <span>📸</span> Download Image
          </button>
        </div>
        <div id="mood-heatmap-export" className="p-4 rounded-xl bg-[var(--sf-base)] border border-[var(--border-default)]">
          <WidgetErrorBoundary title="Mood Heatmap">
            {moods.length > 0 ? <MoodYearlyHeatmap moods={moods} /> : <EmptyChart />}
          </WidgetErrorBoundary>
        </div>
      </div>
    </div>
  );
}
