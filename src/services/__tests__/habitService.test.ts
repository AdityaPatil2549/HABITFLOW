import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../syncService', () => ({
  syncService: {
    syncAll: vi.fn().mockResolvedValue(undefined),
    queuePush: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../lib/firebase', () => ({
  auth: null,
  db: null,
  analytics: null,
  perf: null,
  isFirebaseConfigured: () => false,
}));

import { habitService } from '../habitService';
import { db } from '../../db';

describe('Habit Service - getStreakInfo', () => {
  beforeEach(async () => {
    await db.habits.clear();
    await db.habitLogs.clear();
  });

  it('should return 0 streak for empty logs', async () => {
    const habit = await habitService.create({
      name: 'Test',
      frequency: 'daily',
      type: 'boolean',
      targetValue: 1,
    } as any);
    const streak = await habitService.getStreakInfo(habit);
    expect(streak.current).toBe(0);
    expect(streak.best).toBe(0);
  });

  it('should calculate a simple daily streak correctly', async () => {
    const habit = await habitService.create({
      name: 'Test',
      frequency: 'daily',
      type: 'boolean',
      targetValue: 1,
    } as any);

    // Generate dates relative to today to avoid fake timers breaking IndexedDB
    const today = new Date();
    const d1 = new Date(today);
    d1.setDate(today.getDate() - 2);
    const d2 = new Date(today);
    d2.setDate(today.getDate() - 1);
    const d3 = new Date(today);

    const fmt = (d: Date) => d.toISOString().split('T')[0];

    await habitService.logCompletion(habit.id, fmt(d1), 1);
    await habitService.logCompletion(habit.id, fmt(d2), 1);
    await habitService.logCompletion(habit.id, fmt(d3), 1);

    const streak = await habitService.getStreakInfo(habit);
    expect(streak.current).toBe(3);
  });

  it('isScheduledForDate should identify daily habits', () => {
    const habit = { frequency: 'daily' } as any;
    expect(habitService.isScheduledForDate(habit, '2023-10-01')).toBe(true);
  });

  it('should log completion and then unlog completion correctly', async () => {
    const habit = await habitService.create({
      name: 'Unlog Test Habit',
      frequency: 'daily',
      type: 'boolean',
      targetValue: 1,
    } as any);

    const dateStr = '2026-11-04';
    await habitService.logCompletion(habit.id, dateStr, 1);
    let log = await habitService.getLogForDate(habit.id, dateStr);
    expect(log).toBeDefined();
    expect(log?.value).toBe(1);

    await habitService.removeLog(habit.id, dateStr);
    log = await habitService.getLogForDate(habit.id, dateStr);
    expect(log).toBeUndefined();
  });

  it('should update habit properties accurately', async () => {
    const habit = await habitService.create({
      name: 'Initial Name',
      frequency: 'daily',
      type: 'boolean',
      targetValue: 1,
      color: '#10B981',
    } as any);

    await habitService.update(habit.id, { name: 'Updated Name', color: '#6366F1' });
    const fetched = await habitService.getById(habit.id);
    expect(fetched?.name).toBe('Updated Name');
    expect(fetched?.color).toBe('#6366F1');
  });

  it('should archive and unarchive habit correctly', async () => {
    const habit = await habitService.create({
      name: 'Archive Test',
      frequency: 'daily',
      type: 'boolean',
      targetValue: 1,
      archived: false,
    } as any);

    await habitService.archive(habit.id);
    let fetched = await habitService.getById(habit.id);
    expect(fetched?.archived).toBe(true);

    await habitService.update(habit.id, { archived: false });
    fetched = await habitService.getById(habit.id);
    expect(fetched?.archived).toBe(false);
  });

  it('should delete habit and its associated logs', async () => {
    const habit = await habitService.create({
      name: 'Delete Test',
      frequency: 'daily',
      type: 'boolean',
      targetValue: 1,
    } as any);

    await habitService.logCompletion(habit.id, '2026-11-04', 1);
    await habitService.delete(habit.id);

    const fetched = await habitService.getById(habit.id);
    expect(fetched).toBeUndefined();

    const logs = await habitService.getLogsForHabit(habit.id);
    expect(logs.length).toBe(0);
  });

  it('isScheduledForDate should correctly filter weekly scheduled days', () => {
    // 2026-11-04 is Wednesday (day 3)
    const habit = { frequency: 'weekly', frequencyDays: [1, 3, 5] } as any; // Mon, Wed, Fri
    expect(habitService.isScheduledForDate(habit, '2026-11-04')).toBe(true);

    // 2026-11-06 is Friday (day 5)
    expect(habitService.isScheduledForDate(habit, '2026-11-06')).toBe(true);

    // 2026-11-05 is Thursday (day 4)
    expect(habitService.isScheduledForDate(habit, '2026-11-05')).toBe(false);
  });
});
