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
          <p className="font-label-caps">Workspace / Insights</p>
          <h1 className="font-h1 text-[var(--tx-primary)] mt-1">
            {view === 'review' ? 'Weekly Review' : 'Behavioral Telemetry'}
          </h1>
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
