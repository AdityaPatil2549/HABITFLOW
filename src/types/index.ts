// ============================================================
// HabitFlow — Core TypeScript Types
// ============================================================

export type HabitType = 'boolean' | 'count' | 'duration' | 'rating';
export type HabitFrequency = 'daily' | 'weekly' | 'custom';
export type Priority = 0 | 1 | 2 | 3;
export type MoodScore = 1 | 2 | 3 | 4 | 5;
export type Theme =
  | 'indigo'
  | 'violet'
  | 'emerald'
  | 'rose'
  | 'amber'
  | 'neon'
  | 'cyberpunk'
  | 'sunset';
export type Level = 'Beginner' | 'Builder' | 'Achiever' | 'Champion' | 'Grandmaster';

// ─── Habit ───────────────────────────────────────────────────
export interface Habit {
  id: string;
  user_id?: string; // Supabase user ID (null for guest)
  name: string;
  icon: string; // emoji
  color: string; // hex or tailwind color
  category: string;
  type: HabitType;
  frequency: HabitFrequency;
  frequencyDays?: number[]; // 0=Sun..6=Sat for weekly
  frequencyInterval?: number; // for custom (every N days)
  targetValue: number;
  unit?: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD optional
  reminderTime?: string; // HH:MM
  reminderDays?: number[];
  graceDayEnabled: boolean;
  archived: boolean;
  order: number;
  createdAt: string; // ISO
  updated_at?: string; // ISO — used by sync engine
  deleted_at?: string; // ISO — soft delete for sync
}

// ─── Habit Log ───────────────────────────────────────────────
export interface HabitLog {
  id: string;
  user_id?: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  value: number; // 1 for boolean, actual count/duration/rating
  note?: string;
  mood?: MoodScore;
  isFrozen?: boolean;
  timeStamp: string; // ISO
  createdAt: string; // ISO
  updated_at?: string;
  deleted_at?: string;
}

// ─── Task ────────────────────────────────────────────────────
export type RecurringRule = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface Task {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  priority: Priority;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  labels: string[];
  projectId?: string;
  parentId?: string;
  recurring: RecurringRule;
  recurringInterval?: number;
  completed: boolean;
  completedAt?: string;
  order: number;
  createdAt: string;
  updated_at?: string;
  deleted_at?: string;
}

// ─── Project ─────────────────────────────────────────────────
export interface Project {
  id: string;
  name: string;
  color: string;
  icon: string;
  description?: string;
  archived: boolean;
  order: number;
  createdAt: string;
}

// ─── Mood ────────────────────────────────────────────────────
export interface Mood {
  id: string;
  user_id?: string;
  date: string; // YYYY-MM-DD
  score: MoodScore;
  note?: string;
  createdAt: string;
  updated_at?: string;
  deleted_at?: string;
}

// ─── User XP / Gamification ──────────────────────────────────
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export interface UserXP {
  id: string; // always 'singleton'
  total: number;
  level: Level;
  levelProgress: number; // 0-100 within current level
  badgesEarned: Badge[];
  weeklyScore: number;
  dailyScore: number;
  streakFreezes: number;
  unlockedThemes: string[];
  lastDailyReset?: string;
  lastWeeklyReset?: string;
  lastUpdated: string;
}

// ─── Settings ────────────────────────────────────────────────
export interface Settings {
  id: string; // always 'singleton'
  user_id?: string;
  theme: Theme;
  darkMode: 'system' | 'dark' | 'light';
  weekStartsOnMonday: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  morningBriefingTime?: string; // HH:MM
  language: string;
  googleCalendarSync?: boolean;
  googleCalendarCompletions?: boolean;
  updated_at?: string;
}

// ─── Computed / UI ───────────────────────────────────────────
export interface StreakInfo {
  current: number;
  best: number;
  graceUsed: boolean;
}

export interface HabitWithStreak extends Habit {
  streak: StreakInfo;
  todayLog?: HabitLog;
  completionRate30Days: number;
}

export interface DashboardStats {
  totalHabitsToday: number;
  completedHabitsToday: number;
  completionPercent: number;
  dailyScore: number;
  topStreaks: HabitWithStreak[];
  tasksToday: Task[];
}

// ─── Sync Queue ──────────────────────────────────────────────
export interface SyncQueueItem {
  id?: number; // auto-incremented
  table_name: string;
  record_id: string;
  operation: 'upsert' | 'delete';
  payload: Record<string, unknown>;
  created_at: string;
}
