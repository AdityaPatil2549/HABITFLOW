// ============================================================
// HabitFlow — Local → Cloud Migration Service
// ============================================================
// When a guest user signs in for the first time, this service
// reads all local Dexie data, tags each record with user_id,
// and batch-upserts everything to Supabase.
// ============================================================

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { db } from '@/db';

// ─── Table / Column Mapping (mirrors syncService) ───────────────────
const DEXIE_TO_SUPABASE: Record<string, string> = {
  habits: 'habits',
  habitLogs: 'habit_logs',
  tasks: 'tasks',
  projects: 'projects',
  moods: 'moods',
  userXP: 'user_xp',
  settings: 'settings',
};

const COLUMN_MAP: Record<string, Record<string, string>> = {
  habits: {
    frequencyDays: 'frequency_days',
    frequencyInterval: 'frequency_interval',
    targetValue: 'target_value',
    startDate: 'start_date',
    endDate: 'end_date',
    reminderTime: 'reminder_time',
    reminderDays: 'reminder_days',
    graceDayEnabled: 'grace_day_enabled',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    userId: 'user_id',
  },
  habit_logs: {
    habitId: 'habit_id',
    isFrozen: 'is_frozen',
    timeStamp: 'time_stamp',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    userId: 'user_id',
  },
  tasks: {
    dueDate: 'due_date',
    dueTime: 'due_time',
    projectId: 'project_id',
    parentId: 'parent_id',
    recurringInterval: 'recurring_interval',
    completedAt: 'completed_at',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    userId: 'user_id',
  },
  projects: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    userId: 'user_id',
  },
  moods: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    userId: 'user_id',
  },
  user_xp: {
    levelProgress: 'level_progress',
    badgesEarned: 'badges_earned',
    weeklyScore: 'weekly_score',
    dailyScore: 'daily_score',
    streakFreezes: 'streak_freezes',
    unlockedThemes: 'unlocked_themes',
    lastDailyReset: 'last_daily_reset',
    lastWeeklyReset: 'last_weekly_reset',
    lastUpdated: 'last_updated',
    updatedAt: 'updated_at',
    userId: 'user_id',
  },
  settings: {
    darkMode: 'dark_mode',
    weekStartsOnMonday: 'week_starts_on_monday',
    notificationsEnabled: 'notifications_enabled',
    soundEnabled: 'sound_enabled',
    hapticEnabled: 'haptic_enabled',
    morningBriefingTime: 'morning_briefing_time',
    updatedAt: 'updated_at',
    userId: 'user_id',
    googleCalendarSync: 'google_calendar_sync',
    googleCalendarCompletions: 'google_calendar_completions',
  },
};

// ─── Helpers ────────────────────────────────────────────────────────
function toSupabaseRow(
  supabaseTable: string,
  record: Record<string, any>,
): Record<string, any> {
  const mapping = COLUMN_MAP[supabaseTable] ?? {};
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(record)) {
    const mappedKey = mapping[key] ?? key;
    result[mappedKey] = value;
  }
  return result;
}

function getDexieTable(dexieTableName: string) {
  return (db as any)[dexieTableName] as import('dexie').Table;
}

const MIGRATION_FLAG = 'habitflow_migration_done';

// ─── Migration Progress ─────────────────────────────────────────────
export interface MigrationProgress {
  total: number;
  synced: number;
}

// ─── Main Migration Function ────────────────────────────────────────
/**
 * Upload all local Dexie data to Supabase for a newly signed-in user.
 *
 * - Reads every syncable Dexie table
 * - Tags each record with `user_id` and `updated_at`
 * - Batch upserts to the corresponding Supabase table
 * - Skips tables with no local data
 * - Returns progress for UI display
 *
 * This is idempotent: if it has already run for this user, it returns immediately.
 */
export async function migrateLocalDataToCloud(
  userId: string,
): Promise<MigrationProgress> {
  const progress: MigrationProgress = { total: 0, synced: 0 };

  if (!isSupabaseConfigured()) {
    console.warn('[MigrationService] Supabase not configured — skipping migration.');
    return progress;
  }

  // Guard: skip if migration already completed for this user
  const flag = localStorage.getItem(MIGRATION_FLAG);
  if (flag === userId) {
    console.info('[MigrationService] Migration already completed for this user.');
    return progress;
  }

  const now = new Date().toISOString();
  const dexieTableNames = Object.keys(DEXIE_TO_SUPABASE);

  // First pass: count total records
  for (const dexieTableName of dexieTableNames) {
    const table = getDexieTable(dexieTableName);
    const count = await table.count();
    progress.total += count;
  }

  if (progress.total === 0) {
    console.info('[MigrationService] No local data to migrate.');
    localStorage.setItem(MIGRATION_FLAG, userId);
    return progress;
  }

  // Second pass: migrate each table
  for (const dexieTableName of dexieTableNames) {
    const table = getDexieTable(dexieTableName);
    const records = await table.toArray();

    if (records.length === 0) continue;

    const supabaseTable = DEXIE_TO_SUPABASE[dexieTableName];

    // Convert all records to Supabase format with user_id
    const rows = records.map((record: Record<string, any>) =>
      toSupabaseRow(supabaseTable, {
        ...record,
        user_id: userId,
        updated_at: now,
      }),
    );

    // Batch upsert in chunks of 100 to avoid payload limits
    const BATCH_SIZE = 100;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);

      try {
        const { error } = await supabase
          .from(supabaseTable)
          .upsert(batch, { onConflict: 'id' });

        if (error) {
          console.error(
            `[MigrationService] Failed to migrate batch for ${supabaseTable}:`,
            error,
          );
          // Continue with next batch — partial migration is better than none
        } else {
          progress.synced += batch.length;
        }
      } catch (err) {
        console.error(
          `[MigrationService] Network error migrating ${supabaseTable}:`,
          err,
        );
      }
    }
  }

  // Mark migration as complete for this user
  if (progress.synced > 0) {
    localStorage.setItem(MIGRATION_FLAG, userId);
  }

  console.info(
    `[MigrationService] Migration complete: ${progress.synced}/${progress.total} records synced.`,
  );

  return progress;
}

/**
 * Reset the migration flag (e.g. when user signs out).
 * Next sign-in will re-run migration if there's local data.
 */
export function resetMigrationFlag(): void {
  localStorage.removeItem(MIGRATION_FLAG);
}
