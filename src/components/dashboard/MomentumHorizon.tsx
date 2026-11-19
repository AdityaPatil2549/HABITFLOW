import { TrendingUp, Flame, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

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

  const series = weeklySeries.length > 0 ? weeklySeries : [0, 0, 0, 0, 0, 0, globalMomentum];

  // Normalized coordinates for 100 x 30 SVG canvas
  const coords = series.map((val, idx, arr) => {
    const x = arr.length > 1 ? (idx / (arr.length - 1)) * 100 : 50;
    const clamped = Math.max(0, Math.min(100, val));
    const y = 28 - (clamped / 100) * 22;
    return { x, y };
  });

  const polylinePoints = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const polygonPoints = `0,30 ${polylinePoints} 100,30`;
  const lastCoord = coords[coords.length - 1] ?? { x: 100, y: 15 };

  // Status tiering
  const statusMeta =
    globalMomentum >= 80
      ? {
          label: 'Surging',
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/15',
          border: 'border-emerald-500/30',
          dot: 'bg-emerald-400',
          icon: Zap,
        }
      : globalMomentum >= 50
        ? {
            label: 'Steady',
            color: 'text-sky-400',
            bg: 'bg-sky-500/15',
            border: 'border-sky-500/30',
            dot: 'bg-sky-400',
            icon: TrendingUp,
          }
        : {
            label: 'Recovering',
            color: 'text-amber-400',
            bg: 'bg-amber-500/15',
            border: 'border-amber-500/30',
            dot: 'bg-amber-400',
            icon: ShieldCheck,
          };

  const StatusIcon = statusMeta.icon;

  return (
    <section
      aria-label="Momentum Horizon"
      className="card-raised p-4 sm:p-5 space-y-4 relative overflow-hidden"
    >
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-20 bg-[var(--accent)]"
        aria-hidden="true"
      />

      <div className="flex items-center justify-between gap-2 relative">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[var(--accent-subtle)] border border-[var(--accent)] flex items-center justify-center text-[var(--accent-ink)]">
            <TrendingUp size={13} />
          </div>
          <span className="font-label-caps">Momentum Horizon</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${statusMeta.bg} ${statusMeta.color} border ${statusMeta.border} inline-flex items-center gap-1.5 shadow-sm`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot} animate-pulse`} />
            <StatusIcon size={10} />
            <span>{statusMeta.label}</span>
          </span>

          <span className="font-data text-xl font-bold text-[var(--tx-primary)]">
            {globalMomentum}
            <span className="text-xs font-normal text-[var(--tx-muted)]">%</span>
          </span>
        </div>
      </div>

      {/* Horizontal Momentum Progress Bar */}
      <div
        className="w-full h-2.5 rounded-full bg-[var(--sf-overlay)] border border-[var(--border-default)] overflow-hidden p-[1px]"
        role="progressbar"
        aria-valuenow={globalMomentum}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Global habit momentum percentage"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-[var(--accent)] to-[var(--accent-ink)] transition-all duration-300 shadow-[0_0_8px_rgba(var(--brand-500-rgb),0.4)]"
          style={{ width: `${Math.min(100, Math.max(0, globalMomentum))}%` }}
        />
      </div>

      {/* 7-Day Trend Velocity Sparkline */}
      <div className="pt-2 relative space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[var(--tx-muted)]">
          <span>7-Day Velocity</span>
          <span>Rolling Sparkline</span>
        </div>
        <svg
          viewBox="0 0 100 30"
          preserveAspectRatio="none"
          className="w-full h-9 overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="horizonArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <polygon points={polygonPoints} fill="url(#horizonArea)" />

          <polyline
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />

          <circle
            cx={lastCoord.x}
            cy={lastCoord.y}
            r="3.5"
            fill="var(--accent)"
            className="animate-pulse"
          />
          <circle
            cx={lastCoord.x}
            cy={lastCoord.y}
            r="1.5"
            fill="#ffffff"
          />
        </svg>
      </div>

      {/* Sub-metrics Row */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-default)] text-xs">
        <div className="flex items-center justify-between bg-[var(--sf-overlay)] rounded-xl px-3 py-2 border border-[var(--border-default)] hover:border-[var(--border-strong)] transition-colors">
          <span className="text-[var(--tx-secondary)] flex items-center gap-1.5 font-medium">
            <CheckCircle2 size={13} className="text-emerald-400" />
            Today
          </span>
          <span className="font-data font-bold text-[var(--tx-primary)]">
            {completionRate}%
          </span>
        </div>

        <div className="flex items-center justify-between bg-[var(--sf-overlay)] rounded-xl px-3 py-2 border border-[var(--border-default)] hover:border-[var(--border-strong)] transition-colors">
          <span className="text-[var(--tx-secondary)] flex items-center gap-1.5 font-medium">
            <Flame size={13} className="text-orange-400 fill-orange-400/20" />
            Peak
          </span>
          <span className="font-data font-bold text-[var(--tx-primary)]">
            {maxStreak}d
          </span>
        </div>
      </div>
    </section>
  );
}
