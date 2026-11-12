import type { Habit, HabitLog } from '@/types';
import { cn } from '@/lib/utils';
import { STATE_SYMBOL, buildContinuityTapeDays } from './continuityUtils';

interface ContinuityTapeProps {
  habit: Pick<Habit, 'id' | 'name' | 'targetValue' | 'graceDayEnabled'>;
  logs: Pick<HabitLog, 'habitId' | 'date' | 'value' | 'isFrozen'>[];
  todayStr?: string;
}

export function ContinuityTape({ habit, logs, todayStr }: ContinuityTapeProps) {
  const cells = buildContinuityTapeDays(habit, logs, todayStr);

  return (
    <div
      className="inline-flex items-center gap-1"
      role="img"
      aria-label={`7-day continuity tape for ${habit.name}: ${cells
        .map(c => STATE_SYMBOL[c.state])
        .join(' ')}`}
    >
      {cells.map(cell => (
        <span
          key={cell.date}
          title={cell.label}
          className={cn(
            'inline-flex items-center justify-center w-4 h-4 text-[11px] leading-none font-mono select-none rounded-[3px]',
            cell.state === 'done' && 'text-[var(--accent-ink)] bg-[var(--accent-subtle)]',
            cell.state === 'comeback' && 'text-[var(--accent-ink)] bg-[var(--accent-subtle)] font-bold',
            cell.state === 'freeze' && 'text-cyan-400 bg-cyan-500/10',
            cell.state === 'grace' && 'text-[var(--tx-secondary)] bg-[var(--sf-overlay)]',
            cell.state === 'pending' && 'text-[var(--tx-muted)]'
          )}
        >
          {STATE_SYMBOL[cell.state]}
        </span>
      ))}
    </div>
  );
}
