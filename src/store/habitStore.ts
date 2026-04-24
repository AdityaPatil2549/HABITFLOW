import { create } from 'zustand';
import { habitService } from '../services/habitService';
import type { Habit, HabitWithStreak } from '../types';
import { format } from 'date-fns';
import { useGamificationStore } from './gamificationStore';

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
  unlogHabit: (habitId: string) => Promise<void>;
}

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
    await habitService.logCompletion(habitId, get().selectedDate, value, note);
    await get().loadHabits();

    // Check if we just completed it to award XP
    await useGamificationStore.getState().addXP(10);

    // We could check streaks here
    const updatedHabits = get().habits;
    const h = updatedHabits.find(x => x.id === habitId);
    if (h && h.streak.current > 0) {
      await useGamificationStore.getState().awardStreakBadge(h.streak.current);
    }
  },

  unlogHabit: async habitId => {
    await habitService.removeLog(habitId, get().selectedDate);
    await get().loadHabits();
  },
}));
