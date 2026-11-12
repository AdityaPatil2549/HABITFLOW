import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
} from 'recharts';
import { subDays, format } from 'date-fns';
import { correlationService } from '../../services/correlationService';
import { habitService } from '../../services/habitService';
import type { HabitWithStreak, HabitLog, Mood, CorrelationResult } from '../../types';
import {
  ChartCard,
  EmptyChart,
  DynamicInsights,
  TOOLTIP_STYLE,
  TOOLTIP_LABEL_STYLE,
  TOOLTIP_ITEM_STYLE,
} from './shared';
import { Skeleton } from '../ui/Skeleton';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';

interface CorrelationTabProps {
  habits: HabitWithStreak[];
  moods: Mood[];
  logsByDate: Map<string, HabitLog[]>;
}

// ─── Deep Insights / Correlation Engine ───────────────────────
function CorrelationInsights() {
  const [correlations, setCorrelations] = useState<CorrelationResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    correlationService
      .getAllCorrelations()
      .then(data => {
        if (isMounted) {
          setCorrelations(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
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
        <EmptyChart message="Not enough multi-habit data yet" sub="Log at least 2 habits consistently for 7 days to unlock correlation insights." />
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Deep Insights" subtitle="AI-powered correlations based on your data">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2">
        {correlations.map((corr, i) => (
          <div
            key={i}
            className="rounded-xl bg-[var(--sf-overlay)] border border-[var(--border-default)] p-4 hover:border-[var(--accent)] transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-[var(--accent-ink)]">{corr.habitAName}</h4>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                  corr.correlation > 0
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {corr.correlation > 0 ? '+' : ''}
                {Math.round(corr.correlation * 100)}%
              </span>
            </div>
            <p className="text-xs text-[var(--tx-secondary)] leading-relaxed">
              {corr.description}
            </p>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

// ─── Habit-Mood Correlation Chart ─────────────────────────────
function HabitMoodCorrelation({
  habits,
  moods,
  logsByDate,
}: {
  habits: HabitWithStreak[];
  moods: Mood[];
  logsByDate: Map<string, HabitLog[]>;
}) {
  const data = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) =>
      format(subDays(new Date(), 29 - i), 'yyyy-MM-dd')
    );

    return days.map(date => {
      const logs = logsByDate.get(date) ?? [];
      const scheduled = habits.filter(h => habitService.isScheduledForDate(h, date));
      const pct = scheduled.length
        ? Math.round((logs.filter(l => l.value >= 1).length / scheduled.length) * 100)
        : 0;
      const moodLog = moods.find(m => m.date === date);
      return { date: date.slice(5), completion: pct, mood: moodLog ? moodLog.score : null };
    });
  }, [habits, moods, logsByDate]);

  return (
    <div style={{ width: '100%', height: 260, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <defs>
            <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
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
            fill="rgba(16,185,129,0.5)"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="mood"
            name="Mood (1–5)"
            stroke="#06b6d4"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#06b6d4' }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Main Correlation Insights Tab ─────────────────────────────
export function CorrelationInsightsTab({ habits, moods, logsByDate }: CorrelationTabProps) {
  return (
    <div className="space-y-6">
      <ChartCard
        title="Habit Completion vs. Daily Mood"
        subtitle="Discover how keeping up with your habits affects your energy, and vice versa (30 days)"
      >
        <WidgetErrorBoundary title="Habit & Mood Correlation">
          {habits.length > 0 ? (
            <HabitMoodCorrelation habits={habits} moods={moods} logsByDate={logsByDate} />
          ) : (
            <EmptyChart />
          )}
        </WidgetErrorBoundary>
      </ChartCard>

      {/* Dynamic AI Insight Callouts */}
      <DynamicInsights />

      {/* Correlation Engine Grid */}
      <WidgetErrorBoundary title="Correlation Analysis">
        <CorrelationInsights />
      </WidgetErrorBoundary>
    </div>
  );
}
