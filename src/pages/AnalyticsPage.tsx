import React, { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { format, subDays } from 'date-fns';
import { useHabitStore } from '../store/habitStore';
import { useTaskStore } from '../store/taskStore';
import { useMoodStore } from '../store/moodStore';
import { db } from '../db';
import { cn } from '../lib/utils';
import { soundService } from '../services/soundService';
import { ExportReportButton } from '../components/ui/ExportReportButton';

const AnalyticsOverviewTab = lazy(() =>
  import('../components/analytics/AnalyticsOverviewTab').then(m => ({ default: m.AnalyticsOverviewTab }))
);
const CorrelationInsightsTab = lazy(() =>
  import('../components/analytics/CorrelationInsightsTab').then(m => ({ default: m.CorrelationInsightsTab }))
);
const PerHabitAnalyticsTab = lazy(() =>
  import('../components/analytics/PerHabitAnalyticsTab').then(m => ({ default: m.PerHabitAnalyticsTab }))
);
const TaskAnalyticsTab = lazy(() =>
  import('../components/analytics/TaskAnalyticsTab').then(m => ({ default: m.TaskAnalyticsTab }))
);
const HabitHeatmapMatrix = lazy(() =>
  import('../components/analytics/HabitHeatmapMatrix').then(m => ({ default: m.HabitHeatmapMatrix }))
);
const AICoachInsightsTab = lazy(() =>
  import('../components/analytics/AICoachInsightsTab').then(m => ({ default: m.AICoachInsightsTab }))
);

const TABS = ['Overview', 'Insights', 'Per Habit', 'Tasks', 'Heatmap', 'AI Coach'] as const;
type TabType = (typeof TABS)[number];

export function AnalyticsPage() {
  const { habits, loadHabits } = useHabitStore();
  const { tasks, loadTasks } = useTaskStore();
  const { moods, loadMoods } = useMoodStore();
  const [tab, setTab] = useState<TabType>('Overview');
  const [logs30Days, setLogs30Days] = useState<Map<string, any[]>>(new Map());

  useEffect(() => {
    document.title = 'Analytics — HabitFlow';
    loadHabits();
    loadTasks();
    loadMoods();
  }, [loadHabits, loadTasks, loadMoods]);

  // Bulk query 30 days of logs for efficient downstream tab calculations
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const start = format(subDays(new Date(), 29), 'yyyy-MM-dd');
      const end = format(new Date(), 'yyyy-MM-dd');
      const allLogs = await db.habitLogs
        .where('date')
        .between(start, end, true, true)
        .toArray();
      const logsByDate = new Map<string, typeof allLogs>();
      for (const log of allLogs) {
        if (!logsByDate.has(log.date)) logsByDate.set(log.date, []);
        logsByDate.get(log.date)!.push(log);
      }
      if (isMounted) setLogs30Days(logsByDate);
    })();
    return () => {
      isMounted = false;
    };
  }, [habits]);

  // Key KPI metrics
  const bestStreak = habits.length ? Math.max(...habits.map(h => h.streak.best)) : 0;
  const avgCompletion = habits.length
    ? Math.round((habits.reduce((s, h) => s + h.completionRate30Days, 0) / habits.length) * 100)
    : 0;

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
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium text-[var(--ok)] bg-[var(--ok-subtle)] border border-[var(--ok)]/25 mb-2">
            <span className="w-2 h-2 rounded-full bg-[var(--ok)]" />
            <span>Telemetry &amp; Insights</span>
          </div>
          <h1 className="text-3xl font-black text-[var(--tx-primary)] tracking-tight">
            Your Progress Report
          </h1>
          <p className="text-[var(--tx-secondary)] text-sm mt-1">
            Track, analyze, and compound your habit consistency over time.
          </p>
        </div>
        <div className="self-start sm:self-auto">
          <ExportReportButton />
        </div>
      </div>

      {/* Modern Tactile Segmented Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-[var(--sf-raised)] rounded-xl border border-[var(--border-default)]">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              soundService.playTick();
            }}
            className={cn(
              'px-4 py-2 sm:px-5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-150 whitespace-nowrap flex-grow sm:flex-grow-0 text-center cursor-pointer',
              tab === t
                ? 'bg-[var(--accent-subtle)] text-[var(--accent-ink)] border border-[var(--accent)]/30'
                : 'text-[var(--tx-secondary)] hover:text-[var(--tx-primary)] hover:bg-[var(--sf-overlay)] border border-transparent'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content Panes */}
      <Suspense fallback={<div className="h-64 rounded-xl border border-[var(--border-default)] bg-[var(--sf-raised)] animate-pulse" />}>
        {tab === 'Overview' && (
          <AnalyticsOverviewTab
            habits={habits}
            moods={moods}
            logs30Days={logs30Days}
            bestStreak={bestStreak}
            avgCompletion={avgCompletion}
            avgMood={avgMood}
          />
        )}

        {tab === 'Insights' && (
          <CorrelationInsightsTab
            habits={habits}
            moods={moods}
            logsByDate={logs30Days}
          />
        )}

        {tab === 'Per Habit' && <PerHabitAnalyticsTab habits={habits} />}

        {tab === 'Tasks' && <TaskAnalyticsTab tasks={tasks} />}

        {tab === 'Heatmap' && <HabitHeatmapMatrix habits={habits} moods={moods} />}

        {tab === 'AI Coach' && <AICoachInsightsTab />}
      </Suspense>
    </div>
  );
}
export default AnalyticsPage;
