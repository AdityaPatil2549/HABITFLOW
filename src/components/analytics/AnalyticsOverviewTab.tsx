import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { format, subDays, getDay } from 'date-fns';
import { db } from '../../db';
import { habitService } from '../../services/habitService';
import type { HabitWithStreak, HabitLog, Mood } from '../../types';
import {
  StatCard,
  ChartCard,
  EmptyChart,
  DynamicInsights,
  TOOLTIP_STYLE,
  TOOLTIP_LABEL_STYLE,
  TOOLTIP_ITEM_STYLE,
  DAY_NAMES,
} from './shared';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';

interface OverviewTabProps {
  habits: HabitWithStreak[];
  moods: Mood[];
  logs30Days: Map<string, HabitLog[]>;
  bestStreak: number;
  avgCompletion: number;
  avgMood: string | null;
}

// ─── Weekly Radar Chart ──────────────────────────────────────
function WeeklyRadar({ habits }: { habits: HabitWithStreak[] }) {
  const [data, setData] = useState<{ day: string; completion: number }[]>([]);

  useEffect(() => {
    let isMounted = true;
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
      if (isMounted) setData(rows);
    })();
    return () => {
      isMounted = false;
    };
  }, [habits]);

  return (
    <div style={{ width: '100%', height: 260, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} />
          <Radar
            name="Completion %"
            dataKey="completion"
            stroke="#10b981"
            fill="rgba(16,185,129,0.2)"
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Best/Worst Day Analysis ──────────────────────────────────
function BestWorstDay({ habits }: { habits: HabitWithStreak[] }) {
  const [dayData, setDayData] = useState<{ day: string; pct: number }[]>([]);

  useEffect(() => {
    let isMounted = true;
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
      if (isMounted) {
        setDayData(
          DAY_NAMES.map((day, i) => ({
            day,
            pct: counts[i]?.total ? Math.round((counts[i].done / counts[i].total) * 100) : 0,
          }))
        );
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [habits]);

  const best = dayData.reduce((a, b) => (b.pct > a.pct ? b : a), { day: '—', pct: 0 });
  const worst = dayData.reduce((a, b) => (b.pct < a.pct ? b : a), { day: '—', pct: 100 });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-4 text-center border border-emerald-500/25 bg-emerald-500/5">
          <div className="text-2xl mb-1 select-none">🏆</div>
          <p className="text-xs text-[var(--tx-muted)] mb-1">Best Day</p>
          <p className="font-bold text-[var(--tx-primary)]">{best.day}</p>
          <p className="text-emerald-400 text-sm font-bold font-mono">{best.pct}%</p>
        </div>
        <div className="rounded-xl p-4 text-center border border-red-500/25 bg-red-500/5">
          <div className="text-2xl mb-1 select-none">⚠️</div>
          <p className="text-xs text-[var(--tx-muted)] mb-1">Weakest Day</p>
          <p className="font-bold text-[var(--tx-primary)]">{worst.day}</p>
          <p className="text-orange-400 text-sm font-bold font-mono">{worst.pct}%</p>
        </div>
      </div>
      <div style={{ width: '100%', height: 180, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dayData}>
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} unit="%" />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              itemStyle={TOOLTIP_ITEM_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              formatter={(v: unknown) => [`${v}%`, 'Completion']}
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
                        : 'rgba(16,185,129,0.5)'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── 30-day Completion Trend Line ─────────────────────────────
function TrendLine({ habits, logsByDate }: { habits: HabitWithStreak[]; logsByDate: Map<string, HabitLog[]> }) {
  const data = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) =>
      format(subDays(new Date(), 29 - i), 'yyyy-MM-dd')
    );

    return days.map(date => {
      const logs = logsByDate.get(date) ?? [];
      const scheduled = habits.filter(h => habitService.isScheduledForDate(h, date));
      return {
        date: date.slice(5),
        completion: scheduled.length
          ? Math.round((logs.filter(l => l.value >= 1).length / scheduled.length) * 100)
          : 0,
      };
    });
  }, [habits, logsByDate]);

  return (
    <div style={{ width: '100%', height: 220, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} interval={4} />
          <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} unit="%" />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            itemStyle={TOOLTIP_ITEM_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            formatter={(v: unknown) => [`${v}%`, 'Completion']}
          />
          <Area
            type="monotone"
            dataKey="completion"
            stroke="#10b981"
            strokeWidth={2.5}
            fill="url(#areaGrad)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── 30-day Mood Trend ─────────────────────────────────────────
function MoodTrend({ moods }: { moods: Mood[] }) {
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
    <div style={{ width: '100%', height: 220, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} interval={4} />
          <YAxis domain={[1, 5]} tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            itemStyle={TOOLTIP_ITEM_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            formatter={(v: unknown) => [`${v}/5`, 'Mood Score']}
          />
          <Area
            type="monotone"
            dataKey="mood"
            stroke="#06b6d4"
            strokeWidth={2.5}
            fill="url(#moodGrad)"
            dot={{ r: 4, fill: '#06b6d4' }}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Main Overview Tab Component ──────────────────────────────
export function AnalyticsOverviewTab({
  habits,
  moods,
  logs30Days,
  bestStreak,
  avgCompletion,
  avgMood,
}: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Top Bento Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DynamicInsights />
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
            <WidgetErrorBoundary title="Weekly Pattern">
              <WeeklyRadar habits={habits} />
            </WidgetErrorBoundary>
          </ChartCard>
        </div>
        <div className="lg:col-span-2">
          <ChartCard title="Best & Weakest Days" subtitle="Based on last 90 days of data">
            <WidgetErrorBoundary title="Best & Weakest Days">
              {habits.length > 0 ? <BestWorstDay habits={habits} /> : <EmptyChart />}
            </WidgetErrorBoundary>
          </ChartCard>
        </div>
      </div>

      <ChartCard
        title="30-Day Completion Trend"
        subtitle="Daily habit completion rate over the last month"
      >
        <WidgetErrorBoundary title="30-Day Completion Trend">
          {habits.length > 0 ? (
            <TrendLine habits={habits} logsByDate={logs30Days} />
          ) : (
            <EmptyChart />
          )}
        </WidgetErrorBoundary>
      </ChartCard>

      <ChartCard
        title="30-Day Mood Trend"
        subtitle="Your daily mood score (1-5) over the last month"
      >
        <WidgetErrorBoundary title="30-Day Mood Trend">
          {moods.length > 0 ? <MoodTrend moods={moods} /> : <EmptyChart />}
        </WidgetErrorBoundary>
      </ChartCard>
    </div>
  );
}
