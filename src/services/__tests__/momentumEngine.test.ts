import { describe, it, expect } from 'vitest';
import { momentumEngine } from '../momentumEngine';

describe('Atomic Momentum Engine', () => {
  it('returns 0 momentum for empty logs', () => {
    const result = momentumEngine.calculateHabitMomentum([]);
    expect(result.score).toBe(0);
    expect(result.trend).toBe('fading');
  });

  it('calculates surging momentum for consistent recent completions', () => {
    const dates = [
      '2026-11-01',
      '2026-11-02',
      '2026-11-03',
    ];
    const result = momentumEngine.calculateHabitMomentum(dates, '2026-11-03');
    expect(result.score).toBeGreaterThan(50);
    expect(result.activeDaysLast30).toBe(3);
  });

  it('rewards resilience with a bonus when user returns after a gap', () => {
    const datesWithComeback = [
      '2026-10-20',
      '2026-10-21',
      '2026-10-25', // 4-day gap (comeback!)
    ];
    const result = momentumEngine.calculateHabitMomentum(datesWithComeback, '2026-10-25');
    expect(result.resilienceBonus).toBeGreaterThan(0);
  });
});
