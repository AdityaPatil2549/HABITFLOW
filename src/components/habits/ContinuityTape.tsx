import type { Habit, HabitLog } from '@/types';
import { cn } from '@/lib/utils';
import { STATE_SYMBOL, buildContinuityTapeDays } from './continuityUtils';
import { Check, Flame, Shield, Minus } from 'lucide-react';

interface ContinuityTapeProps {
  habit: Pick<Habit, 'id' | 'name' | 'targetValue' | 'graceDayEnabled' | 'color'>;
  logs: Pick<HabitLog, 'habitId' | 'date' | 'value' | 'isFrozen'>[];
  todayStr?: string;
}

export function ContinuityTape({ habit, logs, todayStr }: ContinuityTapeProps) {
  const cells = buildContinuityTapeDays(habit, logs, todayStr);
  const color = habit.color || 'var(--accent)';

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
            'inline-flex items-center justify-center w-3.5 h-3.5 rounded-[4px] select-none transition-all duration-150',
            cell.state === 'done' && 'shadow-sm',
            cell.state === 'comeback' && 'bg-amber-500/20 text-amber-400 border border-amber-500/35 shadow-[0_0_8px_rgba(245,158,11,0.25)]',
            cell.state === 'freeze' && 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 shadow-[0_0_8px_rgba(6,182,212,0.25)]',
            cell.state === 'grace' && 'bg-white/5 border border-white/10 text-[var(--tx-muted)]',
            cell.state === 'pending' && 'bg-white/[0.03] border border-white/10 text-transparent'
          )}
          style={
            cell.state === 'done'
              ? {
                  backgroundColor: color,
                  boxShadow: `0 0 8px 1px ${color}40`,
                }
              : undefined
          }
        >
          {cell.state === 'done' && (
            <Check size={9} className="text-black stroke-[3.5]" />
          )}
          {cell.state === 'comeback' && (
            <Flame size={9} className="fill-amber-400" />
          )}
          {cell.state === 'freeze' && (
            <Shield size={9} className="fill-cyan-400" />
          )}
          {cell.state === 'grace' && (
            <Minus size={9} className="stroke-[2.5]" />
          )}
          {cell.state === 'pending' && (
            <span className="w-1 h-1 rounded-full bg-white/15" />
          )}
        </span>
      ))}
    </div>
  );
}
