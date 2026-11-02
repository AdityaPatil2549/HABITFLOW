/**
 * Atomic Momentum Engine (100% Client-Side / Offline)
 * Features:
 * 1. Half-life exponential decay momentum calculation (eliminates brittle streak resets).
 * 2. Habit Stacking DAG (Chaining: Habit A unlocks Habit B).
 * 3. Chronotype time-slotting (Morning, Afternoon, Evening routines).
 */

import { db } from '../db';
import type { Habit } from '../types';
import { format, subDays, differenceInDays, parseISO } from 'date-fns';

export interface MomentumMetrics {
  score: number; // 0 - 100
  trend: 'surging' | 'steady' | 'recovering' | 'fading';
  activeDaysLast30: number;
  consistencyRate: number; // 0.0 - 1.0
  resilienceBonus: number; // extra points for coming back after missing a day
}

export interface HabitChainNode {
  habit: Habit;
  isCompletedToday: boolean;
  order: number;
  unlocked: boolean;
  nextInChain?: string; // habitId
}

export interface DailyRitualGroup {
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'anytime';
  label: string;
  icon: string;
  habits: Habit[];
  completedCount: number;
  totalCount: number;
}

const HALF_LIFE_DAYS = 4;
const LAMBDA = Math.LN2 / HALF_LIFE_DAYS; // ~0.1733

export const momentumEngine = {
  /**
   * Computes the exponential smoothing momentum score (0-100) for a habit
   */
  calculateHabitMomentum(logDates: string[], todayStr: string = format(new Date(), 'yyyy-MM-dd')): MomentumMetrics {
    if (!logDates || logDates.length === 0) {
      return {
        score: 0,
        trend: 'fading',
        activeDaysLast30: 0,
        consistencyRate: 0,
        resilienceBonus: 0,
      };
    }

    const sortedDates = Array.from(new Set(logDates)).sort();
    const today = parseISO(todayStr);

    let momentum = 0;
    let prevDate: Date | null = null;
    let comebackCount = 0;
    let activeInLast30 = 0;

    for (const dStr of sortedDates) {
      const d = parseISO(dStr);
      const daysSinceStart = differenceInDays(today, d);

      if (daysSinceStart <= 30 && daysSinceStart >= 0) {
        activeInLast30++;
      }

      if (prevDate) {
        const gap = differenceInDays(d, prevDate);
        // Exponential decay over the gap
        momentum = momentum * Math.exp(-LAMBDA * gap);

        // Resilience reward: if user missed 2+ days and returned, grant a bonus!
        if (gap >= 2 && gap <= 7) {
          comebackCount++;
          momentum = Math.min(100, momentum + 8);
        }
      }

      // Boost from completion
      const gain = (100 - momentum) * 0.28;
      momentum = Math.min(100, momentum + gain);
      prevDate = d;
    }

    // Decay from last active date to today
    if (prevDate) {
      const daysSinceLast = differenceInDays(today, prevDate);
      if (daysSinceLast > 0) {
        momentum = momentum * Math.exp(-LAMBDA * daysSinceLast);
      }
    }

    const roundedScore = Math.round(momentum);

    // Trend calculation
    let trend: MomentumMetrics['trend'] = 'steady';
    if (roundedScore > 75) trend = 'surging';
    else if (comebackCount > 0 && roundedScore >= 40) trend = 'recovering';
    else if (roundedScore < 30) trend = 'fading';

    return {
      score: roundedScore,
      trend,
      activeDaysLast30: activeInLast30,
      consistencyRate: Math.min(1, Math.round((activeInLast30 / 30) * 100) / 100),
      resilienceBonus: comebackCount * 5,
    };
  },

  /**
   * Computes the global momentum score across all active habits
   */
  async calculateGlobalMomentum(): Promise<number> {
    const habits = await db.habits.filter(h => !h.archived).toArray();
    if (habits.length === 0) return 0;

    const logs = await db.habitLogs.toArray();
    const logsByHabit = new Map<string, string[]>();

    for (const log of logs) {
      if (!logsByHabit.has(log.habitId)) {
        logsByHabit.set(log.habitId, []);
      }
      logsByHabit.get(log.habitId)!.push(log.date);
    }

    let totalScore = 0;
    for (const habit of habits) {
      const habitLogs = logsByHabit.get(habit.id) || [];
      const metrics = this.calculateHabitMomentum(habitLogs);
      totalScore += metrics.score;
    }

    return Math.round(totalScore / habits.length);
  },

  /**
   * Resolves habits into chronological Daily Rituals (Morning, Afternoon, Evening, Anytime)
   */
  groupHabitsByRitual(habits: Habit[], completedHabitIds: Set<string>): DailyRitualGroup[] {
    const groups: Record<DailyRitualGroup['timeSlot'], Habit[]> = {
      morning: [],
      afternoon: [],
      evening: [],
      anytime: [],
    };

    for (const h of habits) {
      if (h.archived) continue;

      // Check habit metadata, frequency, or reminder times to slot into ritual
      const timeOfDay = (h as any).timeOfDay || (h as any).routine || 'anytime';
      if (timeOfDay in groups) {
        groups[timeOfDay as DailyRitualGroup['timeSlot']].push(h);
      } else {
        // Heuristic: based on reminder time if set
        if (h.reminderTime) {
          const hour = parseInt(h.reminderTime.split(':')[0], 10);
          if (hour < 12) groups.morning.push(h);
          else if (hour < 17) groups.afternoon.push(h);
          else groups.evening.push(h);
        } else {
          groups.anytime.push(h);
        }
      }
    }

    const configs: Array<{ slot: DailyRitualGroup['timeSlot']; label: string; icon: string }> = [
      { slot: 'morning', label: 'Morning Activation', icon: 'Sunrise' },
      { slot: 'afternoon', label: 'Afternoon Focus', icon: 'Sun' },
      { slot: 'evening', label: 'Evening Wind-Down', icon: 'Moon' },
      { slot: 'anytime', label: 'Anytime Rituals', icon: 'Sparkles' },
    ];

    return configs
      .map(cfg => {
        const list = groups[cfg.slot];
        const completedCount = list.filter(h => completedHabitIds.has(h.id)).length;
        return {
          timeSlot: cfg.slot,
          label: cfg.label,
          icon: cfg.icon,
          habits: list,
          completedCount,
          totalCount: list.length,
        };
      })
      .filter(g => g.totalCount > 0);
  },

  /**
   * Resolves a Habit Stacking chain DAG to determine unlocked order
   */
  resolveHabitStack(habits: Habit[], completedHabitIds: Set<string>): HabitChainNode[] {
    const nodes: HabitChainNode[] = [];
    const habitMap = new Map(habits.map(h => [h.id, h]));

    // Find roots (habits with no parent/stack dependency)
    let orderIndex = 0;
    for (const habit of habits) {
      const parentId = (habit as any).stackAfterHabitId;
      const isParentCompleted = !parentId || completedHabitIds.has(parentId);

      nodes.push({
        habit,
        isCompletedToday: completedHabitIds.has(habit.id),
        order: orderIndex++,
        unlocked: isParentCompleted,
        nextInChain: (habit as any).nextHabitId,
      });
    }

    return nodes;
  },
};

export default momentumEngine;
