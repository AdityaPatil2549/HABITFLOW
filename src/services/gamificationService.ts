import { db, getOrCreateUserXP } from '@/db';
import type { UserXP, Badge, Level } from '@/types';
import { nanoid } from 'nanoid';
import { format } from 'date-fns';

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

export function calculateStats(totalXP: number): {
  level: Level;
  levelProgress: number;
  numericLevel: number;
  nextXP: number;
} {
  // Numeric level: Every 100 XP is a level. Level 1 = 0XP. Level 2 = 100XP.
  const numericLevel = Math.floor(totalXP / 100) + 1;
  const xpCurrentLevel = totalXP % 100;
  const levelProgress = xpCurrentLevel; // because 100 XP per level means % is just the remainder
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
    const thisMonday = format(
      (() => {
        const d = new Date();
        const day = d.getDay(); // 0=Sun
        const diff = (day === 0 ? -6 : 1 - day);
        d.setDate(d.getDate() + diff);
        return d;
      })(),
      'yyyy-MM-dd'
    );

    if ((userXP as any).lastDailyReset !== todayStr) {
      userXP.dailyScore = 0;
      (userXP as any).lastDailyReset = todayStr;
    }
    if ((userXP as any).lastWeeklyReset !== thisMonday) {
      userXP.weeklyScore = 0;
      (userXP as any).lastWeeklyReset = thisMonday;
    }
    // ─────────────────────────────────────────────────────────────

    userXP.total += amount;
    userXP.dailyScore += amount;
    userXP.weeklyScore += amount;

    const { level, levelProgress } = calculateStats(userXP.total);
    userXP.level = level;
    userXP.levelProgress = levelProgress;
    userXP.lastUpdated = new Date().toISOString();

    await db.userXP.put(userXP);
    return userXP;
  },

  async awardBadge(name: string, description: string, icon: string): Promise<UserXP | null> {
    const userXP = await getOrCreateUserXP();

    // Convert current items to array to check if badge exists
    const hasBadge = userXP.badgesEarned?.some(b => b.name === name);
    if (hasBadge) return null; // Already earned

    const newBadge: Badge = {
      id: nanoid(),
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
    // Check and award streak badges automatically
    if (streak === 3)
      return this.awardBadge('Streak Novice', 'Hit a 3-day streak on any habit', '🔥');
    if (streak === 7) return this.awardBadge('Consistency Key', 'Hit a 7-day streak', '⭐');
    if (streak === 30) return this.awardBadge('Unstoppable', 'Hit a 30-day streak', '🚀');
    return null;
  },

  async buyStreakFreeze(cost: number): Promise<boolean> {
    const userXP = await getOrCreateUserXP();
    if (userXP.total < cost) return false;
    // Deducting XP could lower numeric level, but we keep the title simple
    userXP.total -= cost;
    userXP.streakFreezes = (userXP.streakFreezes || 0) + 1;
    const { level, levelProgress } = calculateStats(userXP.total);
    userXP.level = level;
    userXP.levelProgress = levelProgress;
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
    if (userXP.total < cost) return false;
    if (userXP.unlockedThemes?.includes(themeId)) return false;

    userXP.total -= cost;
    if (!userXP.unlockedThemes) userXP.unlockedThemes = ['indigo', 'violet', 'emerald', 'rose', 'amber'];
    userXP.unlockedThemes.push(themeId);
    
    const { level, levelProgress } = calculateStats(userXP.total);
    userXP.level = level;
    userXP.levelProgress = levelProgress;
    
    await db.userXP.put(userXP);
    return true;
  },
};
