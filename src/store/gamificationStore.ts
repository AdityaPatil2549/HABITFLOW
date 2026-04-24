import { create } from 'zustand';
import { gamificationService } from '@/services/gamificationService';
import type { UserXP } from '@/types';

interface GamificationState {
  userXP: UserXP | null;
  isLoading: boolean;
  loadXP: () => Promise<void>;
  addXP: (amount: number) => Promise<void>;
  awardStreakBadge: (streak: number) => Promise<void>;
}

export const useGamificationStore = create<GamificationState>(set => ({
  userXP: null,
  isLoading: false,

  loadXP: async () => {
    set({ isLoading: true });
    const xp = await gamificationService.getUserXP();
    set({ userXP: xp, isLoading: false });
  },

  addXP: async (amount: number) => {
    const xp = await gamificationService.addXP(amount);
    set({ userXP: { ...xp } });
  },

  awardStreakBadge: async (streak: number) => {
    const xp = await gamificationService.checkStreakBadges(streak);
    if (xp) set({ userXP: { ...xp } });
  },
}));
