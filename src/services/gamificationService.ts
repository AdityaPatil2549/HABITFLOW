import { db, getOrCreateUserXP } from '@/db';
import type { UserXP, Badge, Level } from '@/types';
import { format, startOfWeek } from 'date-fns';

// --- Gamification Logic & Constants ---
export const XP_PER_HABIT = 10;
export const XP_PER_TASK = 20;

const LEVEL_THRESHOLDS = [
  { xpThreshold: 0, title: 'Beginner' as Level },
  { xpThreshold: 500, title: 'Builder' as Level },
  { xpThreshold: 1500, title: 'Achiever' as Level },
  { xpThreshold: 3000, title: 'Champion' as Level },
  { xpThreshold: 6000, title: 'Grandmaster' as Level },
];

/**
 * Calculates level information from total XP.
 * - numericLevel: Every 100 XP = 1 level (Level 1 starts at 0 XP)
 * - levelProgress: 0-99 representing XP progress within current level
 * - level: Title string based on XP thresholds (Beginner < 500, Builder < 1500, etc.)
 * - nextXP: Total XP needed to reach the next numeric level
 */
export function calculateStats(totalXP: number): {
  level: Level;
  levelProgress: number;
  numericLevel: number;
  nextXP: number;
} {
  // Numeric level: Level 1 = 0-100XP. Level 2 = 101-200XP.
  let numericLevel = Math.floor((totalXP - 1) / 100) + 1;
  if (totalXP === 0) numericLevel = 1;
  
  let levelProgress = totalXP === 0 ? 0 : totalXP % 100;
  if (totalXP > 0 && levelProgress === 0) levelProgress = 100;
  
  const nextXP = numericLevel * 100;

  // Title calculation based on totalXP thresholds
  let currentTitle: Level = 'Beginner';
  for (const t of LEVEL_THRESHOLDS) {
    if (totalXP >= t.xpThreshold) {
      currentTitle = t.title;
    }
  }

  return { level: currentTitle, levelProgress, numericLevel, nextXP };
}

export const gamificationService = {
  async getUserXP(): Promise<UserXP> {
    return getOrCreateUserXP();
  },

  async addXP(amount: number): Promise<UserXP> {
    const userXP = await getOrCreateUserXP();

    // ── Auto-reset daily / weekly scores ────────────────────────
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const thisMonday = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

    if (userXP.lastDailyReset !== todayStr) {
      userXP.dailyScore = 0;
      userXP.lastDailyReset = todayStr;
    }
    if (userXP.lastWeeklyReset !== thisMonday) {
      userXP.weeklyScore = 0;
      userXP.lastWeeklyReset = thisMonday;
    }

    // ── Apply XP and Coins ───────────────────────────────────────
    userXP.total += amount;
    userXP.dailyScore += amount;
    userXP.weeklyScore += amount;
    userXP.lastUpdated = new Date().toISOString();

    // Earn coins based on XP amount (roughly 1 coin per 2 XP)
    const coinsEarned = Math.max(1, Math.floor(amount / 2));
    userXP.coins = (userXP.coins || 0) + coinsEarned;

    const stats = calculateStats(userXP.total);
    userXP.level = stats.level;
    userXP.levelProgress = stats.levelProgress;

    await db.userXP.put(userXP);

    // Notify listeners so UI updates instantly
    window.dispatchEvent(new CustomEvent('xp-updated'));

    // Return the updated object
    return userXP;
  },

  async recordHabitCompletion(_habitId: string): Promise<{
    xpGained: number;
    coinsGained: number;
    newTotal: number;
    badgesUnlocked: Badge[];
  }> {
    const previousXP = await getOrCreateUserXP();
    const prevStats = calculateStats(previousXP.total);

    // Add XP & Coins
    const userXP = await this.addXP(XP_PER_HABIT);

    // Squad Sync
    try {
      const mySquadId = localStorage.getItem('habitflow_my_squad_id');
      if (mySquadId) {
        // Just trigger a fake squad sync to simulate social progress
        const d = new Date().toISOString();
        localStorage.setItem(`squad_sync_${mySquadId}`, d);
      }
    } catch {
      // Ignored
    }

    const newStats = calculateStats(userXP.total);
    const badgesUnlocked: Badge[] = [];

    // Check Level Up Badge
    if (newStats.numericLevel > prevStats.numericLevel) {
      const bId = `level_${newStats.numericLevel}`;
      if (!userXP.badgesEarned.some(b => b.id === bId)) {
        const badge: Badge = {
          id: bId,
          name: `Level ${newStats.numericLevel}`,
          description: `Reached Level ${newStats.numericLevel}`,
          icon: '⭐',
          earnedAt: new Date().toISOString(),
        };
        userXP.badgesEarned.push(badge);
        badgesUnlocked.push(badge);
        await db.userXP.put(userXP);
      }
    }

    return {
      xpGained: XP_PER_HABIT,
      coinsGained: Math.floor(XP_PER_HABIT / 2),
      newTotal: userXP.total,
      badgesUnlocked,
    };
  },

  async recordTaskCompletion(): Promise<{ xpGained: number; coinsGained: number }> {
    await this.addXP(XP_PER_TASK);
    return { xpGained: XP_PER_TASK, coinsGained: Math.floor(XP_PER_TASK / 2) };
  },

  async awardBadge(
    id: string,
    name: string,
    description: string,
    icon: string
  ): Promise<UserXP | null> {
    const userXP = await getOrCreateUserXP();

    // Deduplicate by stable id instead of name to prevent re-awards after renames
    const hasBadge = userXP.badgesEarned?.some(b => b.id === id);
    if (hasBadge) return null; // Already earned

    const newBadge: Badge = {
      id,
      name,
      description,
      icon,
      earnedAt: new Date().toISOString(),
    };

    if (!userXP.badgesEarned) userXP.badgesEarned = [];
    userXP.badgesEarned.push(newBadge);

    await db.userXP.put(userXP);
    return userXP;
  },

  async checkStreakBadges(streak: number): Promise<UserXP | null> {
    let xp: UserXP | null = null;
    if (streak >= 3) {
      const res = await this.awardBadge('streak_3', 'Streak Novice', 'Hit a 3-day streak on any habit', '🔥');
      if (res) xp = res;
    }
    if (streak >= 7) {
      const res = await this.awardBadge('streak_7', 'Consistency Key', 'Hit a 7-day streak', '⭐');
      if (res) xp = res;
    }
    if (streak >= 30) {
      const res = await this.awardBadge('streak_30', 'Unstoppable', 'Hit a 30-day streak', '🚀');
      if (res) xp = res;
    }
    if (streak >= 100) {
      const res = await this.awardBadge('streak_100', 'Legend', 'Achieved a 100-day streak — extraordinary!', '🏆');
      if (res) xp = res;
    }
    return xp;
  },

  async buyStreakFreeze(cost: number): Promise<boolean> {
    const userXP = await getOrCreateUserXP();
    if ((userXP.coins || 0) < cost) return false;
    userXP.coins = (userXP.coins || 0) - cost;
    userXP.streakFreezes = (userXP.streakFreezes || 0) + 1;
    await db.userXP.put(userXP);
    return true;
  },

  async useStreakFreeze(): Promise<boolean> {
    const userXP = await getOrCreateUserXP();
    if ((userXP.streakFreezes || 0) <= 0) return false;
    userXP.streakFreezes -= 1;
    await db.userXP.put(userXP);
    return true;
  },

  async buyTheme(themeId: string, cost: number): Promise<boolean> {
    const userXP = await getOrCreateUserXP();
    if ((userXP.coins || 0) < cost) return false;
    if (userXP.unlockedThemes?.includes(themeId)) return false;

    userXP.coins = (userXP.coins || 0) - cost;
    if (!userXP.unlockedThemes)
      userXP.unlockedThemes = ['indigo'];
    userXP.unlockedThemes.push(themeId);

    await db.userXP.put(userXP);
    return true;
  },
};
