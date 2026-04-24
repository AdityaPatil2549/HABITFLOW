import { create } from 'zustand';
import { moodService } from '@/services/moodService';
import type { Mood, MoodScore } from '@/types';
import { format } from 'date-fns';

interface MoodState {
  moods: Mood[];
  todayMood: Mood | null;
  isLoading: boolean;
  loadMoods: () => Promise<void>;
  logMood: (score: MoodScore, note?: string) => Promise<void>;
}

export const useMoodStore = create<MoodState>(set => ({
  moods: [],
  todayMood: null,
  isLoading: false,

  loadMoods: async () => {
    set({ isLoading: true });
    const all = await moodService.getAllMoods();
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const today = all.find(m => m.date === todayStr) || null;
    set({ moods: all, todayMood: today, isLoading: false });
  },

  logMood: async (score: MoodScore, note?: string) => {
    await moodService.logMood(score, note);
    const all = await moodService.getAllMoods();
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const today = all.find(m => m.date === todayStr) || null;
    set({ moods: all, todayMood: today });
  },
}));
