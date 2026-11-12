import { describe, it, expect } from 'vitest';
import { momentumEngine } from '../momentumEngine';
import type { Habit } from '../../types';

describe('momentumEngine', () => {
  const baseHabit: Habit = {
    id: 'habit-1',
    name: 'Morning Hydration',
    icon: '💧',
    color: '#10b981',
    category: 'health',
    type: 'boolean',
    frequency: 'daily',
    targetValue: 1,
    startDate: '2026-01-01',
    graceDayEnabled: false,
    archived: false,
    order: 0,
    createdAt: new Date().toISOString(),
  };

  it('calculates 0 momentum and fading trend when no logs exist', () => {
    const result = momentumEngine.calculateHabitMomentum([]);
    expect(result.score).toBe(0);
    expect(result.trend).toBe('fading');
    expect(result.activeDaysLast30).toBe(0);
    expect(result.consistencyRate).toBe(0);
  });

  it('calculates higher momentum for consecutive daily completions', () => {
    const today = '2026-03-10';
    const logs = [
      '2026-03-01',
      '2026-03-02',
      '2026-03-03',
      '2026-03-04',
      '2026-03-05',
      '2026-03-06',
      '2026-03-07',
      '2026-03-08',
      '2026-03-09',
      '2026-03-10',
    ];

    const result = momentumEngine.calculateHabitMomentum(logs, today);
    expect(result.score).toBe(70);
    expect(result.activeDaysLast30).toBe(10);
    expect(result.trend).toBe('steady');
  });

  it('applies exponential smoothing decay when days are missed', () => {
    const today = '2026-03-15';
    // Active only a week ago
    const logs = ['2026-03-01', '2026-03-02', '2026-03-03'];

    const result = momentumEngine.calculateHabitMomentum(logs, today);
    expect(result.score).toBeLessThan(20);
    expect(result.trend).toBe('fading');
  });

  it('awards resilience bonus when returning after an absence', () => {
    const today = '2026-03-10';
    // Missed 4 days between 03-01 and 03-06
    const logs = ['2026-03-01', '2026-03-06', '2026-03-07', '2026-03-10'];

    const result = momentumEngine.calculateHabitMomentum(logs, today);
    expect(result.resilienceBonus).toBeGreaterThan(0);
  });

  it('groups habits by ritual time slot based on reminderTime heuristic', () => {
    const morningHabit: Habit = {
      ...baseHabit,
      id: 'h-morning',
      name: 'Sunrise Yoga',
      reminderTime: '07:30',
    };
    const afternoonHabit: Habit = {
      ...baseHabit,
      id: 'h-afternoon',
      name: 'Midday Walk',
      reminderTime: '13:00',
    };
    const eveningHabit: Habit = {
      ...baseHabit,
      id: 'h-evening',
      name: 'Night Reading',
      reminderTime: '21:00',
    };
    const anytimeHabit: Habit = {
      ...baseHabit,
      id: 'h-anytime',
      name: 'Posture Check',
    };

    const completed = new Set<string>(['h-morning']);
    const groups = momentumEngine.groupHabitsByRitual(
      [morningHabit, afternoonHabit, eveningHabit, anytimeHabit],
      completed
    );

    expect(groups.length).toBe(4);
    const morningGroup = groups.find(g => g.timeSlot === 'morning');
    expect(morningGroup?.completedCount).toBe(1);
    expect(morningGroup?.totalCount).toBe(1);

    const afternoonGroup = groups.find(g => g.timeSlot === 'afternoon');
    expect(afternoonGroup?.completedCount).toBe(0);
    expect(afternoonGroup?.totalCount).toBe(1);
  });

  it('orders stacked habits topologically and computes chain states', () => {
    const habitA: Habit = {
      ...baseHabit,
      id: 'habit-a',
      name: 'Brew Morning Coffee',
    };
    const habitB: Habit = {
      ...baseHabit,
      id: 'habit-b',
      name: '5m Mindfulness Meditation',
      stackAfterHabitId: 'habit-a',
    };
    const habitC: Habit = {
      ...baseHabit,
      id: 'habit-c',
      name: 'Deep Breathwork',
      stackAfterHabitId: 'habit-b',
    };

    // Even if provided in reversed order, sortChainedHabits puts them in dependency order
    const sorted = momentumEngine.sortChainedHabits([habitC, habitA, habitB]);
    expect(sorted.map(h => h.id)).toEqual(['habit-a', 'habit-b', 'habit-c']);

    // Case 1: Nothing completed
    const chain1 = momentumEngine.resolveHabitStack([habitA, habitB, habitC], new Set());
    expect(chain1[0].unlocked).toBe(true); // Root is unlocked
    expect(chain1[0].isPrimed).toBe(false);
    expect(chain1[1].unlocked).toBe(false); // Child is locked
    expect(chain1[1].isLocked).toBe(true);

    // Case 2: Habit A is completed today -> Habit B becomes primed!
    const chain2 = momentumEngine.resolveHabitStack([habitA, habitB, habitC], new Set(['habit-a']));
    expect(chain2[0].isCompletedToday).toBe(true);
    expect(chain2[1].unlocked).toBe(true);
    expect(chain2[1].isPrimed).toBe(true); // Primed!
    expect(chain2[1].isLocked).toBe(false);
    expect(chain2[2].isLocked).toBe(true); // Habit C still locked until Habit B finishes
  });
});
