import { useEffect, useState, useMemo } from 'react';
import { useHabitStore } from '../store/habitStore';
import { useTaskStore } from '../store/taskStore';
import { useMoodStore } from '../store/moodStore';
import { db } from '../db';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { correlationService } from '../services/correlationService';
import { ExportReportButton } from '../components/ui/ExportReportButton';
import type { CorrelationResult } from '../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  Cell,
  ComposedChart,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import {
  format,
  subDays,
  subWeeks,
  startOfWeek,
  eachDayOfInterval,
  getDay,
  subYears,
} from 'date-fns';
import { habitService } from '../services/habitService';
import { IconRenderer } from '../components/common/IconRenderer';

import { TiltCard } from '../components/ui/TiltCard';
import { Skeleton } from '../components/ui/Skeleton';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TABS = ['Overview', 'Insights', 'Per Habit', 'Tasks', 'Heatmap'] as const;
type TabType = (typeof TABS)[number];

const TOOLTIP_STYLE = {
  background: 'rgba(15,23,42,0.85)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '16px',
  color: '#dae2fd',
  fontSize: '13px',
  boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
  padding: '12px 16px',
};
const TOOLTIP_LABEL_STYLE = { color: '#f8fafc', fontWeight: 800, marginBottom: '6px', fontSize: '14px' };
const TOOLTIP_ITEM_STYLE = { color: '#dae2fd', fontWeight: 600 };

// ─── Correlation Insights ──────────────────────────────────────
function CorrelationInsights() {
  const [correlations, setCorrelations] = useState<CorrelationResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    correlationService
      .getAllCorrelations()
      .then(data => {
        setCorrelations(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <ChartCard title="Deep Insights" subtitle="Analyzing patterns in your habit data...">
        <div className="flex flex-col space-y-3 p-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </ChartCard>
    );
  }

  if (correlations.length === 0) {
    return (
      <ChartCard title="Deep Insights" subtitle="Not enough data yet.">
        <EmptyChart />
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Deep Insights" subtitle="AI-powered correlations based on your data">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
        {correlations.map((corr, i) => (
          <div
            key={i}
            className="rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-brand-300">{corr.habitAName}</h4>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  corr.correlation > 0
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {corr.correlation > 0 ? '+' : ''}
                {Math.round(corr.correlation * 100)}%
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {corr.description}
            </p>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

// ─── 365-Day Yearly Heatmap ────────────────────────────────────
function YearlyHeatmap({ habits }: { habits: any[] }) {
  const [data, setData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  useEffect(() => {
    if (!habits.length) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }
    (async () => {
      setLoading(true);
      const today = new Date();
      const yearAgo = subYears(today, 1);
      const yearAgoStr = format(yearAgo, 'yyyy-MM-dd');
      const todayStr = format(today, 'yyyy-MM-dd');
      const days = eachDayOfInterval({ start: yearAgo, end: today });

      // ── Single bulk query for the entire year ──────────────────
      const allLogs = await db.habitLogs
        .where('date')
        .between(yearAgoStr, todayStr, true, true)
        .toArray();

      // Group logs by date for O(1) lookup
      const logsByDate = new Map<string, typeof allLogs>();
      for (const log of allLogs) {
        if (!logsByDate.has(log.date)) logsByDate.set(log.date, []);
        logsByDate.get(log.date)!.push(log);
      }
      // ──────────────────────────────────────────────────────────

      const map: Record<string, number> = {};
      for (const day of days) {
        const ds = format(day, 'yyyy-MM-dd');
        const logs = logsByDate.get(ds) ?? [];
        const scheduled = habits.filter(h => habitService.isScheduledForDate(h, ds));
        map[ds] = scheduled.length ? logs.filter(l => l.value >= 1).length / scheduled.length : 0;
      }
      setData(map);
      setLoading(false);
    })();
  }, [habits]);

  function colorFor(val: number) {
    if (val === 0) return 'var(--heatmap-empty)';
    if (val < 0.25) return '#166534';
    if (val < 0.5) return '#16a34a';
    if (val < 0.75) return '#22c55e';
    return '#4ade80';
  }

  const today = new Date();
  const yearAgo = subYears(today, 1);
  const days = eachDayOfInterval({ start: yearAgo, end: today });

  // Build weeks grid
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

  // Month labels: find week index where month changes
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

  if (loading)
    return (
      <div className="h-40 w-full rounded-2xl overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>
    );

  const CELL = 13;
  const GAP = 2;
  const STEP = CELL + GAP;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-2 -mx-1">
        <svg width={weeks.length * STEP + 30} height={7 * STEP + 24} className="block">
          {/* Month labels */}
          {monthLabels.map(({ label, col }) => (
            <text
              key={`${label}-${col}`}
              x={col * STEP + 30}
              y={10}
              fill="#475569"
              fontSize={10}
              fontFamily="Inter, sans-serif"
            >
              {label}
            </text>
          ))}
          {/* Day-of-week labels */}
          {['M', 'W', 'F'].map((l, i) => (
            <text
              key={l}
              x={4}
              y={12 + (i * 2 + 1) * STEP}
              fill="#475569"
              fontSize={9}
              fontFamily="Inter, sans-serif"
              alignmentBaseline="middle"
            >
              {l}
            </text>
          ))}
          {/* Cells */}
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

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map(v => (
          <div key={v} className="w-3 h-3 rounded-sm" style={{ background: colorFor(v) }} />
        ))}
        <span>More</span>
        <span className="ml-auto text-slate-600">Showing {days.length} days</span>
      </div>

      {/* Summary stats */}
      {Object.keys(data).length > 0 && (
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { label: 'Active Days', value: Object.values(data).filter(v => v > 0).length },
            { label: 'Perfect Days', value: Object.values(data).filter(v => v === 1).length },
            {
              label: 'Avg Rate',
              value: `${Math.round((Object.values(data).reduce((a, b) => a + b, 0) / Object.values(data).length) * 100)}%`,
            },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-xl p-3 text-center bg-slate-50 dark:bg-white/3 border border-slate-200 dark:border-white/5"
            >
              <p className="text-xl font-bold text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Per-Habit Heatmap (26 weeks) ─────────────────────────────
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
    if (val === 0) return 'var(--heatmap-empty)';
    if (val < 0.4) return 'var(--color-brand-300, rgba(99,102,241,0.3))';
    if (val < 0.7) return 'var(--color-brand-400, rgba(99,102,241,0.6))';
    return 'var(--color-brand-500, #6366f1)';
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
      <div className="flex items-center gap-2 mt-3 text-xs text-slate-500 dark:text-slate-400">
        <span>Less</span>
        {[0, 0.3, 0.6, 1].map(v => (
          <div key={v} className="w-3 h-3 rounded-sm" style={{ background: colorFor(v) }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

// ─── Weekly Radar ──────────────────────────────────────────────
function WeeklyRadar({ habits }: { habits: any[] }) {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const today = new Date();
      const week = DAY_NAMES.map((name, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - today.getDay() + i);
        return { day: name, date: format(d, 'yyyy-MM-dd') };
      });
      const startDateStr = week[0].date;
      const endDateStr = week[week.length - 1].date;

      const allLogs = await db.habitLogs
        .where('date')
        .between(startDateStr, endDateStr, true, true)
        .toArray();

      const logsByDate = new Map<string, typeof allLogs>();
      for (const log of allLogs) {
        if (!logsByDate.has(log.date)) logsByDate.set(log.date, []);
        logsByDate.get(log.date)!.push(log);
      }

      const rows = week.map(({ day, date }) => {
        const logs = logsByDate.get(date) ?? [];
        const scheduled = habits.filter(h => habitService.isScheduledForDate(h, date));
        return {
          day,
          completion: scheduled.length
            ? Math.round((logs.filter(l => l.value >= 1).length / scheduled.length) * 100)
            : 0,
        };
      });
      setData(rows);
    })();
  }, [habits]);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} />
        <Radar
          name="Completion %"
          dataKey="completion"
          stroke="#818cf8"
          fill="rgba(129,140,248,0.2)"
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ─── 30-day Area Trend ─────────────────────────────────────────
function TrendLine({ habits }: { habits: any[] }) {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const days = Array.from({ length: 30 }, (_, i) =>
        format(subDays(new Date(), 29 - i), 'yyyy-MM-dd')
      );
      const startDateStr = days[0];
      const endDateStr = days[days.length - 1];

      const allLogs = await db.habitLogs
        .where('date')
        .between(startDateStr, endDateStr, true, true)
        .toArray();

      const logsByDate = new Map<string, typeof allLogs>();
      for (const log of allLogs) {
        if (!logsByDate.has(log.date)) logsByDate.set(log.date, []);
        logsByDate.get(log.date)!.push(log);
      }

      const rows = days.map(date => {
        const logs = logsByDate.get(date) ?? [];
        const scheduled = habits.filter(h => habitService.isScheduledForDate(h, date));
        return {
          date: date.slice(5),
          completion: scheduled.length
            ? Math.round((logs.filter(l => l.value >= 1).length / scheduled.length) * 100)
            : 0,
        };
      });
      setData(rows);
    })();
  }, [habits]);
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.6} />
            <stop offset="95%" stopColor="#818cf8" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} interval={4} />
        <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} unit="%" />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          itemStyle={TOOLTIP_ITEM_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          formatter={(v: any) => [`${v}%`, 'Completion']}
        />
        <Area
          type="monotone"
          dataKey="completion"
          stroke="#818cf8"
          strokeWidth={2.5}
          fill="url(#areaGrad)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── 30-day Mood Trend ─────────────────────────────────────────
function MoodTrend({ moods }: { moods: any[] }) {
  const data = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) =>
      format(subDays(new Date(), 29 - i), 'yyyy-MM-dd')
    );
    return days.map(date => {
      const moodLog = moods.find(m => m.date === date);
      return {
        date: date.slice(5),
        mood: moodLog ? moodLog.score : null,
      };
    });
  }, [moods]);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} interval={4} />
        <YAxis domain={[1, 5]} tick={{ fill: '#64748b', fontSize: 11 }} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          itemStyle={TOOLTIP_ITEM_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          formatter={(v: any) => [`${v}/5`, 'Mood Score']}
        />
        <Area
          type="monotone"
          dataKey="mood"
          stroke="#10b981"
          strokeWidth={2.5}
          fill="url(#moodGrad)"
          dot={{ r: 4, fill: '#10b981' }}
          connectNulls
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Task Throughput ───────────────────────────────────────────
function TaskThroughput({ tasks }: { tasks: any[] }) {
  const data = useMemo(() => {
    const weeks: Record<string, { created: number; completed: number }> = {};
    const ensureWeek = (wk: string) => {
      if (!weeks[wk]) weeks[wk] = { created: 0, completed: 0 };
    };
    tasks.forEach(t => {
      const createdWk = format(startOfWeek(new Date(t.createdAt)), 'MM/dd');
      ensureWeek(createdWk);
      weeks[createdWk].created++;
      if (t.completed && t.completedAt) {
        const completedWk = format(startOfWeek(new Date(t.completedAt)), 'MM/dd');
        ensureWeek(completedWk);
        weeks[completedWk].completed++;
      }
    });
    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([week, v]) => ({ week, ...v }));
  }, [tasks]);
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          itemStyle={TOOLTIP_ITEM_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
        />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
        <Bar
          dataKey="created"
          name="Created"
          fill="rgba(129,140,248,0.5)"
          radius={[4, 4, 0, 0]}
          maxBarSize={48}
        />
        <Bar
          dataKey="completed"
          name="Completed"
          fill="#10b981"
          radius={[4, 4, 0, 0]}
          maxBarSize={48}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Best/Worst Day ────────────────────────────────────────────
function BestWorstDay({ habits }: { habits: any[] }) {
  const [dayData, setDayData] = useState<{ day: string; pct: number }[]>([]);
  useEffect(() => {
    (async () => {
      const days90 = Array.from({ length: 90 }, (_, i) => subDays(new Date(), i));
      const startDateStr = format(days90[days90.length - 1], 'yyyy-MM-dd');
      const endDateStr = format(days90[0], 'yyyy-MM-dd');

      const allLogs = await db.habitLogs
        .where('date')
        .between(startDateStr, endDateStr, true, true)
        .toArray();

      const logsByDate = new Map<string, typeof allLogs>();
      for (const log of allLogs) {
        if (!logsByDate.has(log.date)) logsByDate.set(log.date, []);
        logsByDate.get(log.date)!.push(log);
      }

      const counts: Record<number, { done: number; total: number }> = {};
      for (const d of days90) {
        const dow = getDay(d);
        if (!counts[dow]) counts[dow] = { done: 0, total: 0 };
        const date = format(d, 'yyyy-MM-dd');
        const scheduled = habits.filter(h => habitService.isScheduledForDate(h, date));
        if (!scheduled.length) continue;
        const logs = logsByDate.get(date) ?? [];
        counts[dow].done += logs.filter(l => l.value >= 1).length;
        counts[dow].total += scheduled.length;
      }
      setDayData(
        DAY_NAMES.map((day, i) => ({
          day,
          pct: counts[i]?.total ? Math.round((counts[i].done / counts[i].total) * 100) : 0,
        }))
      );
    })();
  }, [habits]);
  const best = dayData.reduce((a, b) => (b.pct > a.pct ? b : a), { day: '—', pct: 0 });
  const worst = dayData.reduce((a, b) => (b.pct < a.pct ? b : a), { day: '—', pct: 100 });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-4 text-center border border-emerald-500/20 bg-emerald-500/5">
          <div className="text-2xl mb-1">🏆</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 mb-1">
            Best Day
          </p>
          <p className="font-bold text-slate-900 dark:text-white">{best.day}</p>
          <p className="text-emerald-400 text-sm font-bold">{best.pct}%</p>
        </div>
        <div className="rounded-xl p-4 text-center border border-red-500/20 bg-red-500/5">
          <div className="text-2xl mb-1">⚠️</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 mb-1">
            Weakest Day
          </p>
          <p className="font-bold text-slate-900 dark:text-white">{worst.day}</p>
          <p className="text-orange-400 text-sm font-bold">{worst.pct}%</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={dayData}>
          <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} unit="%" />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            itemStyle={TOOLTIP_ITEM_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            formatter={(v: any) => [`${v}%`, 'Completion']}
          />
          <Bar dataKey="pct" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {dayData.map((d, i) => (
              <Cell
                key={i}
                fill={
                  d.day === best.day
                    ? '#10b981'
                    : d.day === worst.day
                      ? '#ef4444'
                      : 'rgba(129,140,248,0.6)'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Habit-Mood Correlation ────────────────────────────────────
function HabitMoodCorrelation({ habits, moods }: { habits: any[]; moods: any[] }) {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const days = Array.from({ length: 30 }, (_, i) =>
        format(subDays(new Date(), 29 - i), 'yyyy-MM-dd')
      );
      const startDateStr = days[0];
      const endDateStr = days[days.length - 1];

      const allLogs = await db.habitLogs
        .where('date')
        .between(startDateStr, endDateStr, true, true)
        .toArray();

      const logsByDate = new Map<string, typeof allLogs>();
      for (const log of allLogs) {
        if (!logsByDate.has(log.date)) logsByDate.set(log.date, []);
        logsByDate.get(log.date)!.push(log);
      }

      const rows = days.map(date => {
        const logs = logsByDate.get(date) ?? [];
        const scheduled = habits.filter(h => habitService.isScheduledForDate(h, date));
        const pct = scheduled.length
          ? Math.round((logs.filter(l => l.value >= 1).length / scheduled.length) * 100)
          : 0;
        const moodLog = moods.find(m => m.date === date);
        return { date: date.slice(5), completion: pct, mood: moodLog ? moodLog.score : null };
      });
      setData(rows);
    })();
  }, [habits, moods]);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data}>
        <defs>
          <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.6} />
            <stop offset="95%" stopColor="#818cf8" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} interval={4} />
        <YAxis yAxisId="left" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} unit="%" />
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[1, 5]}
          tick={{ fill: '#64748b', fontSize: 11 }}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          itemStyle={TOOLTIP_ITEM_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
        />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
        <Bar
          yAxisId="left"
          dataKey="completion"
          name="Completion %"
          fill="rgba(129,140,248,0.5)"
          radius={[4, 4, 0, 0]}
          maxBarSize={48}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="mood"
          name="Mood (1–5)"
          stroke="#10b981"
          strokeWidth={2.5}
          dot={{ r: 3, fill: '#10b981' }}
          connectNulls
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  colorClass = 'kpi-card-indigo',
  iconColor = '#818cf8',
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  colorClass?: string;
  iconColor?: string;
}) {
  return (
    <TiltCard className="h-full w-full block">
      <motion.div
        className={cn(
          'glass-card rounded-2xl p-6 text-center relative overflow-hidden group h-full',
          colorClass
        )}
      >
        <span className="absolute right-3 bottom-3 text-5xl opacity-10 rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-transform duration-500">
          {icon}
        </span>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">
          {label}
        </p>
        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
          {value}
        </p>
        {sub && (
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider opacity-60">
            {sub}
          </p>
        )}
      </motion.div>
    </TiltCard>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="glass-card-3d rounded-2xl p-6 relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-500" />
      <div className="mb-5 relative z-10">
        <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">{title}</h3>
        {subtitle && (
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

function EmptyChart() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
      <span className="text-4xl mb-3">📊</span>
      <p className="text-sm">Not enough data yet.</p>
      <p className="text-xs mt-1">Keep logging your habits to unlock insights.</p>
    </div>
  );
}

// ─── AI Insight Synthesizer ──────────────────────────────────────
function DynamicInsights({ habits }: { habits: any[] }) {
  if (habits.length === 0) {
    return (
      <div className="glass-card-3d rounded-2xl p-6 relative overflow-hidden h-full flex flex-col justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-transparent opacity-50" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-500/20 flex items-center justify-center text-2xl animate-pulse">
            🌱
          </div>
          <div>
            <h4 className="text-sm font-black text-brand-400 uppercase tracking-widest mb-1">
              AI Synthesis
            </h4>
            <p className="text-sm text-slate-300 font-medium leading-relaxed">
              Every day is a new opportunity. Start building your habits to generate insights!
            </p>
          </div>
        </div>
      </div>
    );
  }

  const insights: string[] = [];

  const bestCurrent = [...habits].sort((a, b) => b.streak.current - a.streak.current)[0];
  if (bestCurrent && bestCurrent.streak.current >= 3) {
    insights.push(`You're on a powerful ${bestCurrent.streak.current}-day streak for "${bestCurrent.name}".`);
  }

  const avgComp = Math.round(
    (habits.reduce((s, h) => s + h.completionRate30Days, 0) / habits.length) * 100
  );
  if (avgComp > 80) {
    insights.push(`Your overall consistency is an impressive ${avgComp}%.`);
  } else if (avgComp > 40) {
    insights.push(`You maintain a steady ${avgComp}% completion rate.`);
  }

  const catCounts: Record<string, number> = {};
  habits.forEach(h => {
    catCounts[h.category] = (catCounts[h.category] || 0) + h.completionRate30Days;
  });
  const bestCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];
  if (bestCat && bestCat[1] > 0) {
    insights.push(`You've been highly focused on your ${bestCat[0]} routines.`);
  }

  return (
    <div className="glass-card-3d rounded-2xl p-6 md:p-8 relative overflow-hidden h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-transparent opacity-50" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
      
      <div className="relative z-10 flex flex-col h-full justify-center">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-brand-500/20">
            <span className="text-sm">✨</span>
            <div className="absolute inset-0 rounded-full border border-brand-500/50 animate-[spin_3s_linear_infinite]" />
          </div>
          <h4 className="text-xs font-black text-brand-400 uppercase tracking-[0.2em]">
            HabitFlow AI Analysis
          </h4>
        </div>
        
        <div className="space-y-3">
          {insights.map((text, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.4 + 0.2, duration: 0.6, ease: 'easeOut' }}
              className="text-[15px] text-slate-700 dark:text-slate-200 font-medium leading-relaxed"
            >
              {text}
            </motion.p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Analytics Page ────────────────────────────────────────────
export function AnalyticsPage() {
  const { habits, loadHabits } = useHabitStore();
  const { tasks, loadTasks } = useTaskStore();
  const { moods, loadMoods } = useMoodStore();
  const [tab, setTab] = useState<TabType>('Overview');
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});
  const [perHabitDays, setPerHabitDays] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    loadHabits();
    loadTasks();
    loadMoods();
  }, [loadHabits, loadTasks, loadMoods]);

  useEffect(() => {
    document.title = 'Analytics — HabitFlow';
  }, []);

  const selectedHabit = habits.find(h => h.id === selectedHabitId) ?? habits[0] ?? null;

  useEffect(() => {
    if (!selectedHabit) return;
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
      setHeatmapData(map);
    })();
  }, [selectedHabit, perHabitDays]);

  const bestStreak = habits.length ? Math.max(...habits.map(h => h.streak.best)) : 0;
  const avgCompletion = habits.length
    ? Math.round((habits.reduce((s, h) => s + h.completionRate30Days, 0) / habits.length) * 100)
    : 0;
  const tasksDone = tasks.filter(t => t.completed).length;

  const avgMood = useMemo(() => {
    if (!moods.length) return null;
    const recent = moods.filter(m => new Date(m.date) >= subDays(new Date(), 30));
    if (!recent.length) return null;
    const sum = recent.reduce((s, m) => s + m.score, 0);
    return (sum / recent.length).toFixed(1);
  }, [moods]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-32 relative">

      {/* Header */}
      <div className="relative z-10 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">
            Analytics
          </p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Your Progress Report
          </h1>
          <p className="text-slate-500 dark:text-slate-400 dark:text-slate-400 text-sm mt-1">
            Track, analyze, and improve your habits over time.
          </p>
        </div>
        <div className="hidden sm:block">
          <ExportReportButton />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-transparent sm:bg-slate-800/60 sm:rounded-2xl sm:border sm:border-white/5">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl font-bold text-[13px] sm:text-sm transition-all whitespace-nowrap flex-grow sm:flex-grow-0 text-center border',
              tab === t
                ? 'button-3d text-white border-brand-400'
                : 'glass-card-3d text-slate-400 border-white/5 hover:text-white hover:border-white/20 hover:-translate-y-1'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'Overview' && (
        <div className="space-y-6">
          {/* Top Bento Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DynamicInsights habits={habits} />
            </div>
            <div className="lg:col-span-1 grid grid-cols-2 gap-4">
              <StatCard
                icon="🏆"
                label="Best Streak"
                value={bestStreak ? `${bestStreak}d` : '—'}
                sub="all time"
                colorClass="kpi-card-indigo"
              />
              <StatCard
                icon="📈"
                label="30d Avg"
                value={avgCompletion ? `${avgCompletion}%` : '—'}
                sub="completion rate"
                colorClass="kpi-card-emerald"
              />
              <StatCard
                icon="🔥"
                label="Active Habits"
                value={habits.filter(h => !h.archived).length}
                sub="tracking now"
                colorClass="kpi-card-amber"
              />
              <StatCard
                icon="✨"
                label="Avg Mood"
                value={avgMood ? `${avgMood}/5` : '—'}
                sub="last 30 days"
                colorClass="kpi-card-indigo"
              />
            </div>
          </div>

          {/* Bottom Bento Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <ChartCard title="Weekly Pattern" subtitle="Completion rate by day of week">
                <WeeklyRadar habits={habits} />
              </ChartCard>
            </div>
            <div className="lg:col-span-2">
              <ChartCard title="Best & Weakest Days" subtitle="Based on last 90 days of data">
                {habits.length > 0 ? <BestWorstDay habits={habits} /> : <EmptyChart />}
              </ChartCard>
            </div>
          </div>

          <ChartCard
            title="30-Day Completion Trend"
            subtitle="Daily habit completion rate over the last month"
          >
            {habits.length > 0 ? <TrendLine habits={habits} /> : <EmptyChart />}
          </ChartCard>

          <ChartCard
            title="30-Day Mood Trend"
            subtitle="Your daily mood score (1-5) over the last month"
          >
            {moods.length > 0 ? <MoodTrend moods={moods} /> : <EmptyChart />}
          </ChartCard>
        </div>
      )}

      {/* ── Insights ── */}
      {tab === 'Insights' && (
        <div className="space-y-6">
          <ChartCard
            title="Habit Completion vs. Daily Mood"
            subtitle="Discover how keeping up with your habits affects your energy, and vice versa (30 days)"
          >
            {habits.length > 0 ? (
              <HabitMoodCorrelation habits={habits} moods={moods} />
            ) : (
              <EmptyChart />
            )}
          </ChartCard>

          {/* Dynamic insight callouts */}
          <DynamicInsights habits={habits} />

          {/* Correlation Engine */}
          <CorrelationInsights />
        </div>
      )}

      {/* ── Per Habit ── */}
      {tab === 'Per Habit' && (
        <div className="space-y-6">
          {habits.length === 0 ? (
            <EmptyChart />
          ) : (
            <>
              {/* Habit selector pills */}
              <div className="flex flex-wrap gap-2">
                {habits.map(h => (
                  <button
                    key={h.id}
                    onClick={() => setSelectedHabitId(h.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                      selectedHabit?.id === h.id
                        ? 'button-3d border-brand-500/50 text-white'
                        : 'glass-card-3d border-white/5 text-slate-400 hover:text-white hover:-translate-y-1'
                    }`}
                  >
                    <span>
                      <IconRenderer name={h.icon} size={16} />
                    </span>{' '}
                    {h.name}
                  </button>
                ))}
              </div>

              {selectedHabit && (
                <>
                  {/* Date range selector */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex bg-slate-900/40 p-1 rounded-xl border border-white/5 relative shadow-inner">
                      {([7, 30, 90] as const).map(days => (
                        <button
                          key={days}
                          onClick={() => setPerHabitDays(days)}
                          className={`relative z-10 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            perHabitDays === days
                              ? 'text-white'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {perHabitDays === days && (
                            <motion.div
                              layoutId="timeframe-pill"
                              className="absolute inset-0 bg-brand-500/80 rounded-lg shadow-sm"
                              style={{ zIndex: -1 }}
                              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
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
                      value={`${Math.round(
                        (Object.values(heatmapData).filter(v => v >= 1).length /
                          Math.max(1, perHabitDays)) *
                          100
                      )}%`}
                      colorClass="kpi-card-indigo"
                    />
                    <StatCard
                      icon="📅"
                      label="Since"
                      value={selectedHabit.startDate}
                      colorClass="kpi-card-emerald"
                    />
                  </div>

                  <ChartCard
                    title={
                      <span className="flex items-center gap-2">
                        <IconRenderer name={selectedHabit.icon} size={20} /> {selectedHabit.name} —
                        Completion Heatmap
                      </span>
                    }
                    subtitle={`Last ${perHabitDays} days of habit tracking`}
                  >
                    <Heatmap logs={heatmapData} />
                  </ChartCard>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Tasks ── */}
      {tab === 'Tasks' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              icon="📋"
              label="Total Tasks"
              value={tasks.length}
              colorClass="kpi-card-indigo"
            />
            <StatCard icon="✅" label="Completed" value={tasksDone} colorClass="kpi-card-emerald" />
            <StatCard
              icon="⏳"
              label="Pending"
              value={tasks.filter(t => !t.completed).length}
              colorClass="kpi-card-amber"
            />
            <StatCard
              icon="🔴"
              label="Urgent"
              value={tasks.filter(t => t.priority === 0 && !t.completed).length}
              colorClass="kpi-card-rose"
            />
          </div>
          <ChartCard
            title="Task Throughput"
            subtitle="Created vs. completed per week (last 8 weeks)"
          >
            {tasks.length > 0 ? <TaskThroughput tasks={tasks} /> : <EmptyChart />}
          </ChartCard>
        </div>
      )}

      {/* ── Heatmap ── */}
      {tab === 'Heatmap' && (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <div className="mb-5">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                🟩 365-Day Activity Heatmap
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 mt-1">
                Your overall habit completion across the entire last year, just like GitHub.
              </p>
            </div>
            {habits.length > 0 ? <YearlyHeatmap habits={habits} /> : <EmptyChart />}
          </div>
        </div>
      )}
    </div>
  );
}
