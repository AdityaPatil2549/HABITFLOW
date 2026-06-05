import { create } from 'zustand';
import { gamificationService } from '@/services/gamificationService';
import type { UserXP } from '@/types';
import { queueAchievement, checkStreakMilestone } from '@/components/ui/AchievementToast';

interface GamificationState {
  userXP: UserXP | null;
  isLoading: boolean;
  loadXP: () => Promise<void>;
  addXP: (amount: number) => Promise<void>;
  awardStreakBadge: (streak: number) => Promise<void>;
  buyFreeze: (cost: number) => Promise<boolean>;
  consumeFreeze: () => Promise<boolean>;
  unlockTheme: (themeId: string, cost: number) => Promise<boolean>;
  recordHabitCompletion: (habitId: string, streak: number) => Promise<void>;
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

  recordHabitCompletion: async (habitId: string, streak: number) => {
    const result = await gamificationService.recordHabitCompletion(habitId);
    
    // Level Up / Badge toasts
    result.badgesUnlocked.forEach(badge => {
      queueAchievement({
        title: badge.name,
        description: badge.description,
        icon: badge.icon,
        type: badge.id.startsWith('level') ? 'level_up' : 'badge',
      });
    });

    // Check custom streak milestones
    const milestone = checkStreakMilestone(streak);
    if (milestone) {
      queueAchievement({
        title: milestone.title,
        description: milestone.description,
        icon: milestone.icon,
        type: 'milestone',
      });
    }

    await get().loadXP();
  },

  buyFreeze: async (cost: number) => {
    const success = await gamificationService.buyStreakFreeze(cost);
    if (success) await get().loadXP();
    return success;
  },

  consumeFreeze: async () => {
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
