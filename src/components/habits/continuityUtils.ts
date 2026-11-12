import { format, parseISO, subDays } from 'date-fns';
import type { Habit, HabitLog } from '@/types';

export type ContinuityState = 'done' | 'grace' | 'freeze' | 'comeback' | 'pending';

export interface ContinuityDayCell {
  date: string;
  state: ContinuityState;
  label: string;
}

export const STATE_SYMBOL: Record<ContinuityState, string> = {
  done: '■',
  grace: '═',
  freeze: '◈',
  comeback: '▲',
  pending: '□',
};

const STATE_TEXT: Record<ContinuityState, string> = {
  done: 'Completed',
  grace: 'Grace bridge',
  freeze: 'Continuity shield freeze',
  comeback: 'Comeback completion',
  pending: 'Pending / missed',
};

/**
 * Maps a habit's last 7 days ending on `todayStr` into geometric Continuity Tape cells.
 * Symbols: ■ (done), ═ (grace), ◈ (freeze), ▲ (comeback after a missed gap), □ (pending).
 */
export function buildContinuityTapeDays(
  habit: Pick<Habit, 'id' | 'targetValue' | 'graceDayEnabled'>,
  logs: Pick<HabitLog, 'habitId' | 'date' | 'value' | 'isFrozen'>[],
  todayStr: string = format(new Date(), 'yyyy-MM-dd')
): ContinuityDayCell[] {
  const target = habit.targetValue || 1;
  const todayDate = parseISO(todayStr);
  const byDate = new Map<string, Pick<HabitLog, 'habitId' | 'date' | 'value' | 'isFrozen'>>();

  for (const log of logs) {
    if (log.habitId !== habit.id) continue;
    const existing = byDate.get(log.date);
    if (!existing || log.value > existing.value || log.isFrozen) {
      byDate.set(log.date, log);
    }
  }

  // Inspect one day prior (T-7) to distinguish comeback vs steady done on T-6
  const priorDateStr = format(subDays(todayDate, 7), 'yyyy-MM-dd');
  const priorLog = byDate.get(priorDateStr);
  let missedPriorDay =
    !(priorLog && !priorLog.isFrozen && priorLog.value >= target) && !priorLog?.isFrozen;

  const cells: ContinuityDayCell[] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const dateStr = format(subDays(todayDate, offset), 'yyyy-MM-dd');
    const log = byDate.get(dateStr);

    let state: ContinuityState;
    if (log?.isFrozen) {
      state = 'freeze';
      missedPriorDay = false;
    } else if (log && log.value >= target) {
      state = missedPriorDay && offset < 6 ? 'comeback' : 'done';
      missedPriorDay = false;
    } else if (offset > 0 && habit.graceDayEnabled && !missedPriorDay) {
      // Single past missed day with grace enabled bridges seamlessly once
      state = 'grace';
      missedPriorDay = true;
    } else {
      state = 'pending';
      missedPriorDay = true;
    }

    cells.push({
      date: dateStr,
      state,
      label: `${dateStr}: ${STATE_TEXT[state]}`,
    });
  }

  return cells;
}

