import { create } from 'zustand';
import { habitService } from '../services/habitService';
import type { Habit, HabitWithStreak } from '../types';
import { format } from 'date-fns';
import { useGamificationStore } from './gamificationStore';
import { soundService } from '../services/soundService';
import { calendarService } from '../services/calendarService';
import { getOrCreateSettings } from '../db';
import { getHabitEmoji } from '../lib/emoji';

interface HabitStore {
  habits: HabitWithStreak[];
  loading: boolean;
  selectedDate: string;
  // Actions
  setSelectedDate: (date: string) => void;
  loadHabits: () => Promise<void>;
  addHabit: (data: Omit<Habit, 'id' | 'createdAt' | 'order'>) => Promise<void>;
  updateHabit: (id: string, data: Partial<Habit>) => Promise<void>;
  archiveHabit: (id: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  logHabit: (habitId: string, value: number, note?: string) => Promise<void>;
  incrementHabit: (habitId: string, delta?: number) => Promise<void>;
  applyFreeze: (habitId: string) => Promise<void>;
  unlogHabit: (habitId: string) => Promise<void>;
  reorderHabits: (orderedIds: string[]) => Promise<void>;
}

// Serializes concurrent reorder DB writes (race condition fix)
let reorderLock: Promise<unknown> = Promise.resolve();

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],
  loading: false,
  selectedDate: format(new Date(), 'yyyy-MM-dd'),

  setSelectedDate: date => set({ selectedDate: date }),

  loadHabits: async () => {
    set({ loading: true });
    try {
      const rawHabits = await habitService.getHabitsWithStreaks(get().selectedDate);
      const habits = rawHabits.map(h => ({
        ...h,
        icon: getHabitEmoji(h.icon),
      }));
      set({ habits, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addHabit: async data => {
    await habitService.create(data);
    await get().loadHabits();
  },

  updateHabit: async (id, data) => {
    await habitService.update(id, data);
    await get().loadHabits();
  },

  archiveHabit: async id => {
    await habitService.archive(id);
    await get().loadHabits();
  },

  deleteHabit: async id => {
    await habitService.delete(id);
    await get().loadHabits();
  },

  logHabit: async (habitId, value, note) => {
    try {
      const prev = get().habits.find(x => x.id === habitId);
      const target = prev?.targetValue || 1;
      const wasDone = (prev?.todayLog?.value ?? 0) >= target;

      await habitService.logCompletion(habitId, get().selectedDate, value, note);
      soundService.playTick();
      soundService.haptic([30]);
      await get().loadHabits();

      // Mark completion in Google Calendar & Gamification only when newly completed
      const h = get().habits.find(x => x.id === habitId);
      const isNowDone = value >= (h?.targetValue || 1);

      if (h && !wasDone && isNowDone) {
        await useGamificationStore.getState().recordHabitCompletion(habitId, h.streak.current);

        getOrCreateSettings().then(settings => {
          if (settings.googleCalendarCompletions) {
            calendarService
              .markHabitDoneInCalendar(h.name, h.icon, get().selectedDate)
              .catch(console.error);
          }
        });
      }
    } catch (err) {
      console.error('Failed to log habit:', err);
      await get().loadHabits(); // Reload to reset UI state
    }
  },

  incrementHabit: async (habitId, delta = 1) => {
    try {
      const prev = get().habits.find(x => x.id === habitId);
      const target = prev?.targetValue || 1;
      const wasDone = (prev?.todayLog?.value ?? 0) >= target;

      const updatedLog = await habitService.incrementLog(habitId, get().selectedDate, delta);
      if (delta >= 0) {
        soundService.playTick();
        soundService.haptic([30]);
      } else {
        soundService.playUncheck();
      }
      await get().loadHabits();

      const h = get().habits.find(x => x.id === habitId);
      const newVal = updatedLog?.value ?? 0;
      const isNowDone = newVal >= (h?.targetValue || 1);

      if (h && !wasDone && isNowDone) {
        await useGamificationStore.getState().recordHabitCompletion(habitId, h.streak.current);

        getOrCreateSettings().then(settings => {
          if (settings.googleCalendarCompletions) {
            calendarService
              .markHabitDoneInCalendar(h.name, h.icon, get().selectedDate)
              .catch(console.error);
          }
        });
      }
    } catch (err) {
      console.error('Failed to increment habit:', err);
      await get().loadHabits();
    }
  },

  applyFreeze: async habitId => {
    const { gamificationService } = await import('../services/gamificationService');
    const afforded = await gamificationService.useStreakFreeze();
    if (!afforded) {
      console.warn('[HabitStore] No streak freezes left to apply');
      return; // Let the UI handle the message
    }
    await habitService.logCompletion(habitId, get().selectedDate, -1, 'Used Streak Freeze', true);
    await get().loadHabits();
  },

  unlogHabit: async habitId => {
    await habitService.removeLog(habitId, get().selectedDate);
    await get().loadHabits();
  },

  reorderHabits: async orderedIds => {
    // Optimistic update (instant UI feedback)
    const current = get().habits;
    const reordered = orderedIds
      .map((id, idx) => {
        const h = current.find(x => x.id === id);
        return h ? { ...h, order: idx } : null;
      })
      .filter(Boolean) as typeof current;
    set({ habits: reordered });

    // Serialize DB writes: queue on module-level lock to prevent race conditions
    // from rapid back-to-back drag operations
    reorderLock = reorderLock.then(() => habitService.reorder(orderedIds)).catch(console.error);
    await reorderLock;
  },
}));
