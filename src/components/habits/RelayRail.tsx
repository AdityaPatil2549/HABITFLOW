import { cn } from '@/lib/utils';

interface RelayRailProps {
  active: boolean;
  primed?: boolean;
  locked?: boolean;
}

/**
 * 2px vertical Swiss circuit connector rendering Habit Stacking DAG dependencies
 * between a parent habit and its chained child habit.
 */
export function RelayRail({ active, primed = false, locked = false }: RelayRailProps) {
  return (
    <div className="flex items-center pl-7 py-0.5" aria-hidden="true">
      <div
        className={cn(
          'w-[2px] h-4 transition-colors duration-150',
          active
            ? 'bg-[var(--accent)]'
            : primed
              ? 'bg-[var(--accent)] opacity-75'
              : locked
                ? 'bg-[var(--border-default)]'
                : 'bg-[var(--border-strong)]'
        )}
      />
      <span
        className={cn(
          'ml-2 text-[10px] font-mono uppercase tracking-wider',
          active
            ? 'text-[var(--accent-ink)]'
            : primed
              ? 'text-[var(--tx-primary)]'
              : 'text-[var(--tx-muted)]'
        )}
      >
        {active ? 'linked' : primed ? 'primed' : 'queued'}
      </span>
    </div>
  );
}

