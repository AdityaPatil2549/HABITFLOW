import Dexie, { type EntityTable } from 'dexie';
import type { Habit, HabitLog, Task, Project, Mood, UserXP, Settings, ShopPurchase, AIInsight } from '../types';

// ─── Sync Queue Item ─────────────────────────────────────────
export interface SyncQueueItem {
  id?: number;
  table_name: string;
  record_id: string;
  operation: 'upsert' | 'delete';
  payload: any;
  created_at: string;
}

// ─── Database Class ──────────────────────────────────────────
class HabitFlowDB extends Dexie {
  habits!: EntityTable<Habit, 'id'>;
  habitLogs!: EntityTable<HabitLog, 'id'>;
  tasks!: EntityTable<Task, 'id'>;
  projects!: EntityTable<Project, 'id'>;
  moods!: EntityTable<Mood, 'id'>;
  userXP!: EntityTable<UserXP, 'id'>;
  settings!: EntityTable<Settings, 'id'>;
  sync_queue!: EntityTable<SyncQueueItem, 'id'>;
  shop_purchases!: EntityTable<ShopPurchase, 'id'>;
  ai_insights!: EntityTable<AIInsight, 'id'>;

  constructor() {
    super('HabitFlowDB');

    this.version(1).stores({
      habits: '++id, name, category, type, frequency, archived, createdAt, order',
      habitLogs: '++id, habitId, date, createdAt',
      tasks: '++id, title, priority, dueDate, projectId, parentId, completed, createdAt, order',
      projects: '++id, name, archived, order, createdAt',
      moods: '++id, date, score, createdAt',
      userXP: '++id',
      settings: '++id',
    });

    // v2: Add compound index for faster habit log queries by habitId+date
    this.version(2).stores({
      habitLogs: '++id, habitId, date, [habitId+date], createdAt',
    });

    // v3: Add sync_queue table for offline-first push queue
    this.version(3).stores({
      sync_queue: '++id, table_name, record_id, created_at',
    });

    // v4: Add shop_purchases and ai_insights tables
    this.version(4).stores({
      shop_purchases: '++id, item_id, purchased_at',
      ai_insights: '++id, type, created_at, read',
    });
  }
}

export const db = new HabitFlowDB();

// ─── Singleton helpers ───────────────────────────────────────
export async function getOrCreateUserXP(): Promise<UserXP> {
  const user = await db.userXP.get('singleton');
  if (user) {
    let needsUpdate = false;
    if (!user.unlockedThemes) {
      user.unlockedThemes = ['indigo', 'violet', 'emerald', 'rose', 'amber'];
      needsUpdate = true;
    }
    if (user.coins === undefined || user.coins === null) {
      user.coins = 0;
      needsUpdate = true;
    }
    if (needsUpdate) {
      await db.userXP.update(user.id, { unlockedThemes: user.unlockedThemes, coins: user.coins });
    }
    return user;
  }
  const newXP: UserXP = {
    id: 'singleton',
    total: 0,
    coins: 0,
    level: 'Beginner',
    levelProgress: 0,
    badgesEarned: [],
    weeklyScore: 0,
    dailyScore: 0,
    streakFreezes: 3,
    unlockedThemes: ['indigo', 'violet', 'emerald', 'rose', 'amber'],
    lastUpdated: new Date().toISOString(),
  };
  await db.userXP.add(newXP);
  return newXP;
}

export async function getOrCreateSettings(): Promise<Settings> {
  const existing = await db.settings.get('singleton');
  if (existing) return existing;
  const defaults: Settings = {
    id: 'singleton',
    theme: 'indigo',
    darkMode: 'system',
    weekStartsOnMonday: true,
    notificationsEnabled: false,
    soundEnabled: true,
    hapticEnabled: true,
    language: 'en',
  };
  await db.settings.add(defaults);
  return defaults;
}
