import { create } from 'zustand';
import { habitService } from '../services/habitService';
import type { Habit, HabitWithStreak } from '../types';
import { format } from 'date-fns';
import { useGamificationStore } from './gamificationStore';
import { soundService } from '../services/soundService';
import { calendarService } from '../services/calendarService';
import { getOrCreateSettings } from '../db';

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
      const habits = await habitService.getHabitsWithStreaks(get().selectedDate);
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
      await habitService.logCompletion(habitId, get().selectedDate, value, note);
      soundService.playTick();
      soundService.haptic([30]);
      await get().loadHabits();

      // Mark completion in Google Calendar (if enabled)
      const h = get().habits.find(x => x.id === habitId);

      if (h) {
        // Record completion for Gamification (XP, level up, milestones)
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

  applyFreeze: async habitId => {
    const FREEZE_COST = 10; // coins per freeze use
    const { spendCoins } = await import('../services/coinService').then(m => ({
      spendCoins: m.coinService.spendCoins,
    }));
    const afforded = await spendCoins(FREEZE_COST);
    if (!afforded) {
      console.warn('[HabitStore] Not enough coins to apply streak freeze');
      return; // Let the UI handle the message via consumeFreeze in gamificationStore
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
