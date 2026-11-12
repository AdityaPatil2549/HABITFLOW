import { describe, it, expect } from 'vitest';
import { buildContinuityTapeDays } from '../continuityUtils';

describe('ContinuityTape - buildContinuityTapeDays', () => {
  const today = '2026-11-12'; // T-0

  it('returns 7 pending cells when there are no logs', () => {
    const cells = buildContinuityTapeDays(
      { id: 'h1', targetValue: 1, graceDayEnabled: false },
      [],
      today
    );

    expect(cells).toHaveLength(7);
    expect(cells.map(c => c.date)).toEqual([
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
      '2026-11-09',
      '2026-11-10',
      '2026-11-11',
      '2026-11-12',
    ]);
    expect(cells.every(c => c.state === 'pending')).toBe(true);
  });

  it('marks comeback after a missed gap and uses grace bridge once when enabled', () => {
    const logs = [
      { habitId: 'h1', date: '2026-11-05', value: 1 }, // T-7 done
      { habitId: 'h1', date: '2026-11-06', value: 1 }, // T-6 done
      // T-5 (2026-11-07) missed -> grace bridge
      { habitId: 'h1', date: '2026-11-08', value: 1 }, // T-4 comeback
      // T-3 (2026-11-09) missed -> grace bridge
      // T-2 (2026-11-10) missed again -> pending (no double grace)
      { habitId: 'h1', date: '2026-11-11', value: 1 }, // T-1 comeback
      { habitId: 'h1', date: '2026-11-12', value: 1 }, // T-0 done
    ];

    const cells = buildContinuityTapeDays(
      { id: 'h1', targetValue: 1, graceDayEnabled: true },
      logs,
      today
    );

    expect(cells.map(c => c.state)).toEqual([
      'done',
      'grace',
      'comeback',
      'grace',
      'pending',
      'comeback',
      'done',
    ]);
  });

  it('renders freeze state on frozen logs without triggering comeback next day', () => {
    const logs = [
      { habitId: 'h1', date: '2026-11-06', value: 1 },
      { habitId: 'h1', date: '2026-11-07', value: 0, isFrozen: true },
      { habitId: 'h1', date: '2026-11-08', value: 1 },
    ];

    const cells = buildContinuityTapeDays(
      { id: 'h1', targetValue: 1, graceDayEnabled: false },
      logs,
      today
    );

    expect(cells[0].state).toBe('done');
    expect(cells[1].state).toBe('freeze');
    expect(cells[2].state).toBe('done');
    expect(cells[3].state).toBe('pending');
  });

  it('enforces numeric targetValue and ignores other habits logs', () => {
    const logs = [
      { habitId: 'other', date: '2026-11-10', value: 100 },
      { habitId: 'h2', date: '2026-11-11', value: 15 }, // below target 30
      { habitId: 'h2', date: '2026-11-12', value: 30 }, // meets target 30
    ];

    const cells = buildContinuityTapeDays(
      { id: 'h2', targetValue: 30, graceDayEnabled: false },
      logs,
      today
    );

    expect(cells[4].state).toBe('pending'); // 11-10 belongs to other habit
    expect(cells[5].state).toBe('pending'); // 15 < 30
    expect(cells[6].state).toBe('comeback'); // completed after missed prior day
  });
});
