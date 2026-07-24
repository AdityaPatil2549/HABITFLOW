import Dexie, { type EntityTable } from 'dexie';
import type {
  Habit,
  HabitLog,
  Task,
  Project,
  Mood,
  UserXP,
  Settings,
  ShopPurchase,
  AIInsight,
} from '../types';

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

    // v5: Drop ai_insights to safely change its primary key
    this.version(5).stores({
      ai_insights: null,
    });

    // v6: Recreate ai_insights with string UUID primary key
    this.version(6).stores({
      ai_insights: 'id, type, created_at, read',
    });

    // v7: Copy data to temp tables with string primary keys
    this.version(7).stores({
      userXP_temp: 'id',
      settings_temp: 'id',
    }).upgrade(async tx => {
      const xp = await tx.table('userXP').toArray();
      if (xp.length > 0) {
        xp[0].id = 'singleton';
        await tx.table('userXP_temp').put(xp[0]);
      }
      const settings = await tx.table('settings').toArray();
      if (settings.length > 0) {
        settings[0].id = 'singleton';
        await tx.table('settings_temp').put(settings[0]);
      }
    });

    // v8: Recreate userXP and settings with string primary keys and restore data
    this.version(8).stores({
      userXP: 'id',
      settings: 'id',
    }).upgrade(async tx => {
      const xp = await tx.table('userXP_temp').toArray();
      if (xp.length > 0) await tx.table('userXP').put(xp[0]);
      const settings = await tx.table('settings_temp').toArray();
      if (settings.length > 0) await tx.table('settings').put(settings[0]);
    });

    // v9: Clean up temp tables
    this.version(9).stores({
      userXP_temp: null,
      settings_temp: null,
    });

    // v10: Add deleted_at index to all syncable tables
    this.version(10).stores({
      habits: '++id, name, category, type, frequency, archived, createdAt, order, deleted_at',
      habitLogs: '++id, habitId, date, [habitId+date], createdAt, deleted_at',
      tasks: '++id, title, priority, dueDate, projectId, parentId, completed, createdAt, order, deleted_at',
      projects: '++id, name, archived, order, createdAt, deleted_at',
      moods: '++id, date, score, createdAt, deleted_at',
    });
  }
}

export const db = new HabitFlowDB();

// ─── Singleton helpers ───────────────────────────────────────
export async function getOrCreateUserXP(): Promise<UserXP> {
  try {
    const user = await db.userXP.get('singleton').catch(() => null);
    if (user) {
      let needsUpdate = false;
      if (!user.unlockedThemes) {
        user.unlockedThemes = ['indigo'];
        needsUpdate = true;
      }
      if (user.coins === undefined || user.coins === null) {
        user.coins = 0;
        needsUpdate = true;
      }
      if (needsUpdate) {
        await db.userXP.update(user.id, { unlockedThemes: user.unlockedThemes, coins: user.coins }).catch(() => null);
      }
      return user;
    }
  } catch (err) {
    console.warn('Failed to get userXP from Dexie, returning default', err);
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
    streakFreezes: 0,
    unlockedThemes: ['indigo'],
    lastUpdated: new Date().toISOString(),
  };
  try {
    await db.userXP.add(newXP).catch(() => null);
  } catch { /* ignore */ }
  return newXP;
}

export async function getOrCreateSettings(): Promise<Settings> {
  try {
    const existing = await db.settings.get('singleton').catch(() => null);
    if (existing) return existing;
  } catch { /* ignore */ }
  const defaults: Settings = {
    id: 'singleton',
    theme: 'indigo',
    darkMode: 'dark',
    weekStartsOnMonday: true,
    notificationsEnabled: false,
    soundEnabled: true,
    hapticEnabled: true,
    language: 'en',
    dashboardLayout: ['header', 'stats', 'tasks', 'habits', 'mood'],
  };
  try {
    await db.settings.add(defaults).catch(() => null);
  } catch { /* ignore */ }
  return defaults;
}
