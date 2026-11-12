import { TrendingUp, Flame, CheckCircle2 } from 'lucide-react';

interface MomentumHorizonProps {
  globalMomentum: number;
  completedCount: number;
  totalHabits: number;
  maxStreak: number;
  weeklySeries: number[]; // 7 daily momentum/completion % points
}

export function MomentumHorizon({
  globalMomentum,
  completedCount,
  totalHabits,
  maxStreak,
  weeklySeries,
}: MomentumHorizonProps) {
  const completionRate = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

  // Build normalized SVG polyline points for the 7-day sparkline
  const points = (weeklySeries.length > 0 ? weeklySeries : [0, 0, 0, 0, 0, 0, globalMomentum])
    .map((val, idx, arr) => {
      const x = arr.length > 1 ? (idx / (arr.length - 1)) * 100 : 50;
      const clamped = Math.max(0, Math.min(100, val));
      const y = 26 - (clamped / 100) * 22;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <section
      aria-label="Momentum Horizon"
      className="card-raised p-4 sm:p-5 space-y-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-[var(--accent-ink)]" />
          <span className="font-label-caps">Momentum Horizon</span>
        </div>
        <span className="font-data text-xl font-bold text-[var(--tx-primary)]">
          {globalMomentum}
          <span className="text-xs font-normal text-[var(--tx-muted)]">%</span>
        </span>
      </div>

      {/* Horizontal Momentum Progress Bar */}
      <div
        className="w-full h-2 rounded-full bg-[var(--sf-overlay)] border border-[var(--border-default)] overflow-hidden"
        role="progressbar"
        aria-valuenow={globalMomentum}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Global habit momentum percentage"
      >
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all duration-150"
          style={{ width: `${Math.min(100, Math.max(0, globalMomentum))}%` }}
        />
      </div>

      {/* 7-Day Trend Sparkline */}
      <div className="pt-1">
        <svg
          viewBox="0 0 100 28"
          preserveAspectRatio="none"
          className="w-full h-7 overflow-visible"
          aria-hidden="true"
        >
          <polyline
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      </div>

      {/* Sub-metrics Row */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-default)] text-xs">
        <div className="flex items-center justify-between bg-[var(--sf-overlay)] rounded-lg px-2.5 py-2 border border-[var(--border-default)]">
          <span className="text-[var(--tx-secondary)] flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-[var(--accent-ink)]" />
            Today
          </span>
          <span className="font-data font-semibold text-[var(--tx-primary)]">
            {completionRate}%
          </span>
        </div>

        <div className="flex items-center justify-between bg-[var(--sf-overlay)] rounded-lg px-2.5 py-2 border border-[var(--border-default)]">
          <span className="text-[var(--tx-secondary)] flex items-center gap-1.5">
            <Flame size={13} className="text-[var(--accent-ink)]" />
            Peak
          </span>
          <span className="font-data font-semibold text-[var(--tx-primary)]">
            {maxStreak}d
          </span>
        </div>
      </div>
    </section>
  );
}
