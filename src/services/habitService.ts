import { nanoid } from 'nanoid';
import { db } from '../db';
import type { Habit, HabitLog, HabitWithStreak, StreakInfo } from '../types';
import { format, subDays, parseISO } from 'date-fns';

// ─── Habit CRUD ──────────────────────────────────────────────
export const habitService = {
  async getAll(): Promise<Habit[]> {
    return db.habits
      .orderBy('order')
      .filter(h => !h.archived)
      .toArray();
  },

  async getAllIncludingArchived(): Promise<Habit[]> {
    return db.habits.orderBy('order').toArray();
  },

  async getById(id: string): Promise<Habit | undefined> {
    return db.habits.get(id);
  },

  async create(data: Omit<Habit, 'id' | 'createdAt' | 'order'>): Promise<Habit> {
    const count = await db.habits.count();
    const habit: Habit = {
      ...data,
      id: nanoid(),
      order: count,
      createdAt: new Date().toISOString(),
    };
    await db.habits.add(habit);
    return habit;
  },

  async update(id: string, data: Partial<Habit>): Promise<void> {
    await db.habits.update(id, data);
  },

  async archive(id: string): Promise<void> {
    await db.habits.update(id, { archived: true });
  },

  async delete(id: string): Promise<void> {
    await db.habits.delete(id);
    await db.habitLogs.where('habitId').equals(id).delete();
  },

  async reorder(ids: string[]): Promise<void> {
    await db.transaction('rw', db.habits, async () => {
      for (let i = 0; i < ids.length; i++) {
        await db.habits.update(ids[i], { order: i });
      }
    });
  },

  // ─── Logs ────────────────────────────────────────────────────
  async getLogsForHabit(habitId: string, fromDate?: string, toDate?: string): Promise<HabitLog[]> {
    const query = db.habitLogs.where('habitId').equals(habitId);
    const logs = await query.toArray();
    if (fromDate && toDate) {
      return logs.filter(l => l.date >= fromDate && l.date <= toDate);
    }
    return logs;
  },

  async getLogForDate(habitId: string, date: string): Promise<HabitLog | undefined> {
    const logs = await db.habitLogs
      .where('habitId')
      .equals(habitId)
      .filter(l => l.date === date)
      .toArray();
    return logs[0];
  },

  async logCompletion(
    habitId: string,
    date: string,
    value: number,
    note?: string,
    isFrozen?: boolean
  ): Promise<HabitLog> {
    // Upsert: delete existing log for this day first
    await db.habitLogs
      .where('habitId')
      .equals(habitId)
      .filter(l => l.date === date)
      .delete();

    const log: HabitLog = {
      id: nanoid(),
      habitId,
      date,
      value,
      note,
      isFrozen,
      timeStamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    await db.habitLogs.add(log);
    return log;
  },

  async removeLog(habitId: string, date: string): Promise<void> {
    await db.habitLogs
      .where('habitId')
      .equals(habitId)
      .filter(l => l.date === date)
      .delete();
  },

  // ─── Streak Calculation ───────────────────────────────────────
  async getStreakInfo(habit: Habit): Promise<StreakInfo> {
    const allLogs = await db.habitLogs.where('habitId').equals(habit.id).toArray();
    const logMap = new Map(allLogs.map(l => [l.date, l]));

    function isDayScheduled(date: Date): boolean {
      if (habit.frequency === 'daily') return true;
      if (habit.frequency === 'weekly') {
        return (habit.frequencyDays ?? []).includes(date.getDay());
      }
      // custom interval — simplified: every N days from startDate
      if (habit.frequency === 'custom' && habit.frequencyInterval) {
        const start = parseISO(habit.startDate);
        const diff = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return diff % habit.frequencyInterval === 0;
      }
      return true;
    }

    function isCompleted(date: Date): boolean {
      const dateStr = format(date, 'yyyy-MM-dd');
      const log = logMap.get(dateStr);
      if (!log) return false;
      if (log.isFrozen) return true; // Freeze token maintains the streak
      if (habit.type === 'boolean') return log.value >= 1;
      return log.value >= habit.targetValue;
    }

    // Calculate current streak
    let current = 0;
    let graceUsed = false;
    let i = 0;
    // Start from today, go backwards
    while (true) {
      const d = subDays(new Date(), i);
      const dStr = format(d, 'yyyy-MM-dd');
      if (habit.startDate && dStr < habit.startDate) break;
      if (isDayScheduled(d)) {
        if (isCompleted(d)) {
          current++;
        } else if (habit.graceDayEnabled && !graceUsed && i > 0) {
          graceUsed = true; // grace day: don't break streak, but only once
        } else {
          if (i === 0) {
            // today not done yet, don't break streak
          } else {
            break;
          }
        }
      }
      i++;
      if (i > 400) break; // safety cap
    }

    // Calculate best streak
    const sortedDates = allLogs
      .filter(l => l.value >= (habit.type === 'boolean' ? 1 : habit.targetValue))
      .map(l => l.date)
      .sort();

    let best = 0;
    let tempStreak = 0;
    let prevDate: string | null = null;

    for (const dateStr of sortedDates) {
      if (prevDate === null) {
        tempStreak = 1;
      } else {
        const prev = parseISO(prevDate);
        const curr = parseISO(dateStr);
        const gap = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        tempStreak = gap === 1 ? tempStreak + 1 : 1;
      }
      if (tempStreak > best) best = tempStreak;
      prevDate = dateStr;
    }

    return { current, best, graceUsed };
  },

  async getHabitsWithStreaks(forDate?: string): Promise<HabitWithStreak[]> {
    const date = forDate ?? format(new Date(), 'yyyy-MM-dd');
    const habits = await habitService.getAll();
    return Promise.all(
      habits.map(async h => {
        const streak = await habitService.getStreakInfo(h);
        const todayLog = await habitService.getLogForDate(h.id, date);
        const from = format(subDays(new Date(), 29), 'yyyy-MM-dd');
        const logs30 = await habitService.getLogsForHabit(h.id, from, date);

        // Count only days the habit was actually scheduled in the window
        const scheduledDays = Array.from({ length: 30 }, (_, i) => {
          const d = subDays(new Date(), 29 - i);
          return habitService.isScheduledForDate(h, format(d, 'yyyy-MM-dd'));
        }).filter(Boolean).length;

        const completionRate30Days = scheduledDays > 0
          ? logs30.filter(l => l.value >= (h.type === 'boolean' ? 1 : h.targetValue)).length / scheduledDays
          : 0;

        return { ...h, streak, todayLog, completionRate30Days };
      })
    );
  },

  isScheduledForDate(habit: Habit, date: string): boolean {
    const d = parseISO(date);
    if (habit.startDate && date < habit.startDate) return false;
    if (habit.endDate && date > habit.endDate) return false;
    if (habit.frequency === 'daily') return true;
    if (habit.frequency === 'weekly') {
      return (habit.frequencyDays ?? []).includes(d.getDay());
    }
    if (habit.frequency === 'custom' && habit.frequencyInterval) {
      const start = parseISO(habit.startDate);
      const diff = Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return diff % habit.frequencyInterval === 0;
    }
    return true;
  },
};
