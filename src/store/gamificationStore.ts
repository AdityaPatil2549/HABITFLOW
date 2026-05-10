import { create } from 'zustand';
import { gamificationService } from '@/services/gamificationService';
import type { UserXP } from '@/types';

interface GamificationState {
  userXP: UserXP | null;
  isLoading: boolean;
  loadXP: () => Promise<void>;
  addXP: (amount: number) => Promise<void>;
  awardStreakBadge: (streak: number) => Promise<void>;
  buyFreeze: (cost: number) => Promise<boolean>;
  unlockTheme: (themeId: string, cost: number) => Promise<boolean>;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
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

  buyFreeze: async (cost: number) => {
    const success = await gamificationService.buyStreakFreeze(cost);
    if (success) await get().loadXP();
    return success;
  },

  useFreeze: async () => {
    const success = await gamificationService.useStreakFreeze();
    if (success) await get().loadXP();
    return success;
  },

  unlockTheme: async (themeId: string, cost: number) => {
    const success = await gamificationService.buyTheme(themeId, cost);
    if (success) await get().loadXP();
    return success;
  },
}));
