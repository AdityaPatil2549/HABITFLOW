/**
 * Atomic Momentum Engine (100% Client-Side / Offline)
 * Features:
 * 1. Half-life exponential decay momentum calculation (eliminates brittle streak resets).
 * 2. Habit Stacking DAG (Chaining: Habit A unlocks Habit B).
 * 3. Chronotype time-slotting (Morning, Afternoon, Evening routines).
 */

import { db } from '../db';
import type { Habit } from '../types';
import { format, differenceInDays, parseISO } from 'date-fns';

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
  isPrimed: boolean;
  isLocked: boolean;
  parentId?: string;
  parentHabit?: Habit;
  children: Habit[];
  chainDepth: number;
  chainTotal: number;
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

      // Check explicit habit metadata or fall back to reminder time heuristic
      const legacyRoutine = (h as Habit & { routine?: string }).routine;
      const explicitSlot = h.timeOfDay || legacyRoutine;
      if (explicitSlot && explicitSlot in groups) {
        groups[explicitSlot as DailyRitualGroup['timeSlot']].push(h);
      } else if (h.reminderTime) {
        const hour = parseInt(h.reminderTime.split(':')[0], 10);
        if (hour < 12) groups.morning.push(h);
        else if (hour < 17) groups.afternoon.push(h);
        else groups.evening.push(h);
      } else {
        groups.anytime.push(h);
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
        const rawList = groups[cfg.slot];
        const list = this.sortChainedHabits(rawList);
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
   * Topologically sorts habits so that chained habits immediately follow their parent
   */
  sortChainedHabits(habits: Habit[]): Habit[] {
    const byId = new Map(habits.map(h => [h.id, h]));
    const childrenMap = new Map<string, Habit[]>();

    for (const h of habits) {
      if (h.stackAfterHabitId && byId.has(h.stackAfterHabitId)) {
        const list = childrenMap.get(h.stackAfterHabitId) || [];
        list.push(h);
        childrenMap.set(h.stackAfterHabitId, list);
      }
    }

    const result: Habit[] = [];
    const visited = new Set<string>();

    function addNodeAndDescendants(habit: Habit) {
      if (visited.has(habit.id)) return;
      visited.add(habit.id);
      result.push(habit);
      const children = childrenMap.get(habit.id) || [];
      for (const child of children) {
        addNodeAndDescendants(child);
      }
    }

    // 1. First add roots (habits with no parent or whose parent is outside this set)
    for (const h of habits) {
      if (!h.stackAfterHabitId || !byId.has(h.stackAfterHabitId)) {
        addNodeAndDescendants(h);
      }
    }

    // 2. Safety pass for any circular dependencies
    for (const h of habits) {
      if (!visited.has(h.id)) {
        addNodeAndDescendants(h);
      }
    }

    return result;
  },

  /**
   * Resolves a Habit Stacking chain DAG to determine unlocked order and priming states
   */
  resolveHabitStack(habits: Habit[], completedHabitIds: Set<string>): HabitChainNode[] {
    const habitMap = new Map(habits.map(h => [h.id, h]));
    const childrenMap = new Map<string, Habit[]>();

    for (const h of habits) {
      if (h.stackAfterHabitId && habitMap.has(h.stackAfterHabitId)) {
        const list = childrenMap.get(h.stackAfterHabitId) || [];
        list.push(h);
        childrenMap.set(h.stackAfterHabitId, list);
      }
    }

    const sorted = this.sortChainedHabits(habits);
    const nodes: HabitChainNode[] = [];

    for (let i = 0; i < sorted.length; i++) {
      const habit = sorted[i];
      const parentId = habit.stackAfterHabitId;
      const parentHabit = parentId ? habitMap.get(parentId) : undefined;
      const isParentCompleted = !parentId || !parentHabit || completedHabitIds.has(parentId);
      const isCompletedToday = completedHabitIds.has(habit.id);
      const children = childrenMap.get(habit.id) || [];

      // Calculate chain depth
      let depth = 0;
      let currParent = parentHabit;
      const seen = new Set<string>([habit.id]);
      while (currParent && !seen.has(currParent.id)) {
        depth++;
        seen.add(currParent.id);
        currParent = currParent.stackAfterHabitId ? habitMap.get(currParent.stackAfterHabitId) : undefined;
      }

      nodes.push({
        habit,
        isCompletedToday,
        order: i,
        unlocked: isParentCompleted,
        isPrimed: isParentCompleted && !isCompletedToday && Boolean(parentId && parentHabit),
        isLocked: !isParentCompleted && Boolean(parentId && parentHabit),
        parentId,
        parentHabit,
        children,
        chainDepth: depth,
        chainTotal: children.length + depth + 1,
        nextInChain: children[0]?.id,
      });
    }

    return nodes;
  },
};

export default momentumEngine;
