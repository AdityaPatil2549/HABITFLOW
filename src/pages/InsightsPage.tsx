import { lazy, Suspense, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart2, CalendarCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { soundService } from '../services/soundService';

const AnalyticsPage = lazy(() =>
  import('./AnalyticsPage').then(m => ({ default: m.AnalyticsPage }))
);
const WeeklyReviewPage = lazy(() =>
  import('./WeeklyReviewPage').then(m => ({ default: m.WeeklyReviewPage }))
);

type InsightsView = 'analytics' | 'review';

function InsightsSkeleton() {
  return (
    <div className="space-y-4 py-6">
      <div className="h-8 w-56 rounded-lg bg-[var(--sf-raised)] border border-[var(--border-default)] animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(idx => (
          <div
            key={idx}
            className="h-28 rounded-2xl bg-[var(--sf-raised)] border border-[var(--border-default)] animate-pulse"
          />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-[var(--sf-raised)] border border-[var(--border-default)] animate-pulse" />
    </div>
  );
}

export function InsightsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view: InsightsView = searchParams.get('tab') === 'review' ? 'review' : 'analytics';

  useEffect(() => {
    document.title = view === 'review' ? 'Weekly Review — HabitFlow' : 'Insights — HabitFlow';
  }, [view]);

  const handleSelectView = (next: InsightsView) => {
    soundService.playTick();
    setSearchParams(next === 'review' ? { tab: 'review' } : {}, { replace: true });
  };

  return (
    <div className="space-y-6">
      {/* Unified Insights Mode Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--tx-secondary)] mb-1">
            <span className="px-2 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent-ink)] border border-[var(--accent)]/25 font-bold">
              Workspace / Telemetry
            </span>
            <span>•</span>
            <span className="text-[var(--tx-muted)]">
              {view === 'review' ? 'Algorithmic Synthesis' : 'Behavioral Kinetics'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--tx-primary)] mt-0.5">
            {view === 'review' ? 'Weekly Retrospective' : 'Behavioral Telemetry'}
          </h1>
          <p className="text-xs text-[var(--tx-secondary)] mt-1">
            {view === 'review'
              ? 'Offline algorithmic synthesis of your habits, mood vectors, and task throughput.'
              : 'Track, analyze, and compound your habit consistency over time.'}
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Insights view selector"
          className="inline-flex p-1 rounded-xl bg-[var(--sf-raised)] border border-[var(--border-default)] self-start"
        >
          <button
            role="tab"
            type="button"
            aria-selected={view === 'analytics'}
            onClick={() => handleSelectView('analytics')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
              view === 'analytics'
                ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                : 'text-[var(--tx-secondary)] hover:text-[var(--tx-primary)]'
            )}
          >
            <BarChart2 size={14} />
            <span>Telemetry</span>
          </button>
          <button
            role="tab"
            type="button"
            aria-selected={view === 'review'}
            onClick={() => handleSelectView('review')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
              view === 'review'
                ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                : 'text-[var(--tx-secondary)] hover:text-[var(--tx-primary)]'
            )}
          >
            <CalendarCheck size={14} />
            <span>Weekly Review</span>
          </button>
        </div>
      </div>

      <Suspense fallback={<InsightsSkeleton />}>
        {view === 'analytics' ? <AnalyticsPage /> : <WeeklyReviewPage />}
      </Suspense>
    </div>
  );
}
