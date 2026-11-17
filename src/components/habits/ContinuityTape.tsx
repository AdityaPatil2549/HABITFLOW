import type { Habit, HabitLog } from '@/types';
import { cn } from '@/lib/utils';
import { STATE_SYMBOL, buildContinuityTapeDays } from './continuityUtils';

interface ContinuityTapeProps {
  habit: Pick<Habit, 'id' | 'name' | 'targetValue' | 'graceDayEnabled' | 'color'>;
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
            'inline-flex items-center justify-center w-4 h-4 text-[11px] leading-none font-mono select-none rounded-[4px] transition-all duration-100',
            cell.state === 'done' && !habit.color && 'text-[var(--accent-ink)] bg-[var(--accent-subtle)]',
            cell.state === 'comeback' && 'text-amber-400 bg-amber-500/20 font-bold border border-amber-500/30',
            cell.state === 'freeze' && 'text-cyan-300 bg-cyan-500/20 border border-cyan-500/30',
            cell.state === 'grace' && 'text-[var(--tx-secondary)] bg-[var(--sf-overlay)] border border-[var(--border-default)]',
            cell.state === 'pending' && 'text-[var(--tx-muted)] bg-[var(--sf-dim)] opacity-40'
          )}
          style={
            cell.state === 'done' && habit.color
              ? {
                  color: habit.color,
                  backgroundColor: `${habit.color}22`,
                  border: `1px solid ${habit.color}40`,
                }
              : undefined
          }
        >
          {STATE_SYMBOL[cell.state]}
        </span>
      ))}
    </div>
  );
}
