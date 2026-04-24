import Dexie, { type EntityTable } from 'dexie';
import type { Habit, HabitLog, Task, Project, Mood, UserXP, Settings } from '../types';

// ─── Database Class ──────────────────────────────────────────
class HabitFlowDB extends Dexie {
  habits!: EntityTable<Habit, 'id'>;
  habitLogs!: EntityTable<HabitLog, 'id'>;
  tasks!: EntityTable<Task, 'id'>;
  projects!: EntityTable<Project, 'id'>;
  moods!: EntityTable<Mood, 'id'>;
  userXP!: EntityTable<UserXP, 'id'>;
  settings!: EntityTable<Settings, 'id'>;

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
  }
}

export const db = new HabitFlowDB();

// ─── Singleton helpers ───────────────────────────────────────
export async function getOrCreateUserXP(): Promise<UserXP> {
  const existing = await db.userXP.toArray();
  if (existing.length > 0) return existing[0];
  const newXP: UserXP = {
    id: 'singleton',
    total: 0,
    level: 'Beginner',
    levelProgress: 0,
    badgesEarned: [],
    weeklyScore: 0,
    dailyScore: 0,
    lastUpdated: new Date().toISOString(),
  };
  await db.userXP.add(newXP);
  return newXP;
}

export async function getOrCreateSettings(): Promise<Settings> {
  const existing = await db.settings.toArray();
  if (existing.length > 0) return existing[0];
  const defaults: Settings = {
    id: 'singleton',
    theme: 'indigo',
    darkMode: 'system',
    weekStartsOnMonday: true,
    notificationsEnabled: false,
    language: 'en',
  };
  await db.settings.add(defaults);
  return defaults;
}
