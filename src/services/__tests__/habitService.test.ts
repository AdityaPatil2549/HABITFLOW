import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
});
