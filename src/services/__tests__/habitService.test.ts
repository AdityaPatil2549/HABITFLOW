import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../syncService', () => ({
  syncService: {
    syncAll: vi.fn().mockResolvedValue(undefined),
    queuePush: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../lib/firebase', () => ({
  getAuthInstance: vi.fn().mockResolvedValue(null),
  getFirestoreInstance: vi.fn().mockResolvedValue(null),
  getAnalyticsInstance: vi.fn().mockResolvedValue(null),
  getPerformanceInstance: vi.fn().mockResolvedValue(null),
  isFirebaseConfigured: () => false,
}));

import { habitService } from '../habitService';
import { syncService } from '../syncService';
import { db } from '../../db';
import type { Habit } from '../../types';

function makeMockHabit(overrides: Partial<Omit<Habit, 'id' | 'createdAt' | 'order'>> = {}): Omit<Habit, 'id' | 'createdAt' | 'order'> {
  return {
    name: 'Test',
    icon: 'Target',
    color: '#22c55e',
    category: 'General',
    type: 'boolean',
    frequency: 'daily',
    targetValue: 1,
    startDate: '2026-01-01',
    graceDayEnabled: false,
    archived: false,
    ...overrides,
  };
}

describe('Habit Service - getStreakInfo', () => {
  beforeEach(async () => {
    await db.habits.clear();
    await db.habitLogs.clear();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should return 0 streak for empty logs', async () => {
    const habit = await habitService.create(makeMockHabit());
    const streak = await habitService.getStreakInfo(habit);
    expect(streak.current).toBe(0);
    expect(streak.best).toBe(0);
  });

  it('should calculate a simple daily streak correctly', async () => {
    const habit = await habitService.create(makeMockHabit());

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
    const habit = {
      ...makeMockHabit({ frequency: 'daily', startDate: '2020-01-01' }),
      id: 'test',
      createdAt: '',
      order: 0,
    };
    expect(habitService.isScheduledForDate(habit, '2023-10-01')).toBe(true);
  });

  it('should log completion and then unlog completion correctly', async () => {
    const habit = await habitService.create(makeMockHabit({ name: 'Unlog Test Habit' }));

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
    const habit = await habitService.create(makeMockHabit({ name: 'Initial Name', color: '#10B981' }));

    await habitService.update(habit.id, { name: 'Updated Name', color: '#6366F1' });
    const fetched = await habitService.getById(habit.id);
    expect(fetched?.name).toBe('Updated Name');
    expect(fetched?.color).toBe('#6366F1');
  });

  it('should archive and unarchive habit correctly', async () => {
    const habit = await habitService.create(makeMockHabit({ name: 'Archive Test', archived: false }));

    await habitService.archive(habit.id);
    let fetched = await habitService.getById(habit.id);
    expect(fetched?.archived).toBe(true);

    await habitService.update(habit.id, { archived: false });
    fetched = await habitService.getById(habit.id);
    expect(fetched?.archived).toBe(false);
  });

  it('should delete habit and its associated logs', async () => {
    const habit = await habitService.create(makeMockHabit({ name: 'Delete Test' }));

    await habitService.logCompletion(habit.id, '2026-11-04', 1);
    await habitService.delete(habit.id);

    const fetched = await habitService.getById(habit.id);
    expect(fetched).toBeUndefined();

    const logs = await habitService.getLogsForHabit(habit.id);
    expect(logs.length).toBe(0);
  });

  it('isScheduledForDate should correctly filter weekly scheduled days', () => {
    // 2026-11-04 is Wednesday (day 3)
    const habit = {
      ...makeMockHabit({ frequency: 'weekly', frequencyDays: [1, 3, 5] }),
      id: 'test-weekly',
      createdAt: '',
      order: 0,
    }; // Mon, Wed, Fri
    expect(habitService.isScheduledForDate(habit, '2026-11-04')).toBe(true);

    // 2026-11-06 is Friday (day 5)
    expect(habitService.isScheduledForDate(habit, '2026-11-06')).toBe(true);

    // 2026-11-05 is Thursday (day 4)
    expect(habitService.isScheduledForDate(habit, '2026-11-05')).toBe(false);
  });

  it('removeLog should queue a delete tombstone in syncService with real log ID', async () => {
    const habit = await habitService.create(makeMockHabit({ name: 'Tombstone Test' }));

    const dateStr = '2026-11-04';
    const createdLog = await habitService.logCompletion(habit.id, dateStr, 1);
    vi.mocked(syncService.queuePush).mockClear();

    await habitService.removeLog(habit.id, dateStr);

    expect(syncService.queuePush).toHaveBeenCalledWith(
      'habitLogs',
      { id: createdLog.id, habitId: habit.id, date: dateStr },
      'delete'
    );
  });

  it('should not resurrect starter habits after user deletes all habits', async () => {
    const firstLoad = await habitService.getAll();
    expect(firstLoad.length).toBe(3);

    for (const h of firstLoad) {
      await habitService.delete(h.id);
    }

    const afterDelete = await habitService.getAll();
    expect(afterDelete.length).toBe(0);
  });

  it('incrementLog should add delta without resetting count habits and preserve primary log ID', async () => {
    const habit = await habitService.create(
      makeMockHabit({
        name: 'Drink 8 glasses',
        type: 'count',
        targetValue: 8,
      })
    );

    const dateStr = '2026-11-04';
    const log1 = await habitService.incrementLog(habit.id, dateStr, 1);
    expect(log1?.value).toBe(1);

    const log2 = await habitService.incrementLog(habit.id, dateStr, 1);
    expect(log2?.value).toBe(2);
    expect(log2?.id).toBe(log1?.id);

    const log3 = await habitService.incrementLog(habit.id, dateStr, -1);
    expect(log3?.value).toBe(1);

    const log4 = await habitService.incrementLog(habit.id, dateStr, -1);
    expect(log4).toBeNull();
    expect(await habitService.getLogForDate(habit.id, dateStr)).toBeUndefined();
  });
});
