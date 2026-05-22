// ============================================================
// HabitFlow — Offline-First Sync Engine
// ============================================================
// Strategy:
//   1. ALL writes go to Dexie FIRST (instant, offline-capable)
//   2. SyncService queues changes and pushes to Supabase in background
//   3. On app launch / tab focus, pull remote changes newer than last cursor
//   4. Conflict resolution: last-write-wins based on updated_at
//   5. Failed pushes stay in sync_queue and retry on reconnection
// ============================================================

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { db, type SyncQueueItem } from '@/db';

// ─── Table Name Mapping (Dexie camelCase → Supabase snake_case) ─────
const DEXIE_TO_SUPABASE: Record<string, string> = {
  habits: 'habits',
  habitLogs: 'habit_logs',
  tasks: 'tasks',
  projects: 'projects',
  moods: 'moods',
  userXP: 'user_xp',
  settings: 'settings',
};

const SUPABASE_TO_DEXIE: Record<string, string> = Object.fromEntries(
  Object.entries(DEXIE_TO_SUPABASE).map(([k, v]) => [v, k]),
);

// All Dexie table names that participate in sync
const SYNCABLE_TABLES = Object.keys(DEXIE_TO_SUPABASE);

// ─── Column Name Mapping (camelCase ↔ snake_case per table) ─────────
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

// Build reverse maps for each table (snake_case → camelCase)
const REVERSE_COLUMN_MAP: Record<string, Record<string, string>> = {};
for (const [table, mapping] of Object.entries(COLUMN_MAP)) {
  REVERSE_COLUMN_MAP[table] = Object.fromEntries(
    Object.entries(mapping).map(([camel, snake]) => [snake, camel]),
  );
}

// ─── Column Mapping Helpers ─────────────────────────────────────────
function toSupabaseRow(supabaseTable: string, record: Record<string, any>): Record<string, any> {
  const mapping = COLUMN_MAP[supabaseTable] ?? {};
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(record)) {
    const mappedKey = mapping[key] ?? key;
    result[mappedKey] = value;
  }
  return result;
}

function toDexieRow(supabaseTable: string, record: Record<string, any>): Record<string, any> {
  const mapping = REVERSE_COLUMN_MAP[supabaseTable] ?? {};
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(record)) {
    const mappedKey = mapping[key] ?? key;
    result[mappedKey] = value;
  }
  return result;
}

// ─── Sync Cursor Persistence (localStorage) ─────────────────────────
const CURSOR_PREFIX = 'habitflow_sync_cursor_';

function getSyncCursor(tableName: string): string | null {
  return localStorage.getItem(`${CURSOR_PREFIX}${tableName}`);
}

function setSyncCursor(tableName: string, cursor: string): void {
  localStorage.setItem(`${CURSOR_PREFIX}${tableName}`, cursor);
}

// ─── Helpers ────────────────────────────────────────────────────────
function getDexieTable(dexieTableName: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (db as any)[dexieTableName] as import('dexie').Table;
}

function getUserId(): string | null {
  // Lazily check auth state without importing the store at module level
  // to avoid circular dependency issues. The Supabase client caches session.
  try {
    const raw = localStorage.getItem('sb-session');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.user?.id ?? null;
    }
  } catch {
    // ignore
  }
  return null;
}

async function getAuthUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// ─── Sync Service Class ─────────────────────────────────────────────
class SyncService {
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isSyncing = false;
  private onlineHandler: (() => void) | null = null;
  private focusHandler: (() => void) | null = null;

  // ── Queue a change for push ────────────────────────────────────
  async queuePush(
    tableName: string,
    record: Record<string, any>,
    operation: 'upsert' | 'delete',
  ): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const item: SyncQueueItem = {
      table_name: tableName,
      record_id: String(record.id),
      operation,
      payload: operation === 'delete' ? { id: record.id } : { ...record },
      created_at: new Date().toISOString(),
    };

    await db.sync_queue.add(item);

    // Attempt an immediate push if online
    if (navigator.onLine) {
      this.processPushQueue().catch(console.error);
    }
  }

  // ── Process the push queue ─────────────────────────────────────
  async processPushQueue(): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const userId = await getAuthUserId();
    if (!userId) return; // Not authenticated — nothing to push

    const items = await db.sync_queue.orderBy('created_at').toArray();
    if (items.length === 0) return;

    // De-duplicate: keep only the latest operation per (table_name, record_id)
    const latest = new Map<string, SyncQueueItem>();
    for (const item of items) {
      const key = `${item.table_name}::${item.record_id}`;
      latest.set(key, item);
    }

    const succeeded: number[] = [];

    for (const item of latest.values()) {
      try {
        const supabaseTable = DEXIE_TO_SUPABASE[item.table_name] ?? item.table_name;

        if (item.operation === 'delete') {
          // Soft delete: set deleted_at
          const { error } = await supabase
            .from(supabaseTable)
            .update({
              deleted_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.record_id)
            .eq('user_id', userId);

          if (error) throw error;
        } else {
          // Upsert
          const row = toSupabaseRow(supabaseTable, {
            ...item.payload,
            user_id: userId,
            updated_at: new Date().toISOString(),
          });

          const { error } = await supabase.from(supabaseTable).upsert(row, {
            onConflict: 'id',
          });

          if (error) throw error;
        }

        // Collect all queue IDs for this (table, record) so we remove dupes too
        const allIdsForKey = items
          .filter((i) => i.table_name === item.table_name && i.record_id === item.record_id)
          .map((i) => i.id!)
          .filter(Boolean);
        succeeded.push(...allIdsForKey);
      } catch (err) {
        console.error(`[SyncService] Push failed for ${item.table_name}/${item.record_id}:`, err);
        // Leave in queue for retry
      }
    }

    // Remove successfully pushed items
    if (succeeded.length > 0) {
      await db.sync_queue.bulkDelete(succeeded);
    }
  }

  // ── Pull remote changes for a single table ────────────────────
  async pullChanges(tableName: string): Promise<number> {
    if (!isSupabaseConfigured()) return 0;

    const userId = await getAuthUserId();
    if (!userId) return 0;

    const supabaseTable = DEXIE_TO_SUPABASE[tableName] ?? tableName;
    const cursor = getSyncCursor(tableName);

    let query = supabase
      .from(supabaseTable)
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: true })
      .limit(500);

    if (cursor) {
      query = query.gt('updated_at', cursor);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`[SyncService] Pull failed for ${supabaseTable}:`, error);
      return 0;
    }

    if (!data || data.length === 0) return 0;

    const table = getDexieTable(tableName);
    let merged = 0;
    let latestCursor = cursor ?? '';

    for (const remoteRow of data) {
      const dexieRow = toDexieRow(supabaseTable, remoteRow);
      const remoteUpdatedAt = remoteRow.updated_at ?? remoteRow.created_at ?? '';

      // Track latest cursor
      if (remoteUpdatedAt > latestCursor) {
        latestCursor = remoteUpdatedAt;
      }

      // Handle soft deletes: remove locally if deleted remotely
      if (remoteRow.deleted_at) {
        try {
          await table.delete(dexieRow.id);
        } catch {
          // May not exist locally — that's fine
        }
        merged++;
        continue;
      }

      // Last-write-wins merge
      const localRow = await table.get(dexieRow.id).catch(() => null);

      if (!localRow) {
        // No local copy — insert
        // Remove sync-only fields before storing in Dexie
        const { userId: _uid, deletedAt: _del, updatedAt: _upd, ...cleanRow } = dexieRow;
        await table.add(cleanRow).catch(() => {
          // Might fail if ID collision — try put instead
          return table.put(cleanRow);
        });
        merged++;
      } else {
        // Compare updated_at: remote wins if newer
        const localUpdatedAt = (localRow as any).updatedAt ?? (localRow as any).createdAt ?? '';
        if (remoteUpdatedAt > localUpdatedAt) {
          const { userId: _uid, deletedAt: _del, updatedAt: _upd, ...cleanRow } = dexieRow;
          await table.put(cleanRow);
          merged++;
        }
      }
    }

    // Persist cursor
    if (latestCursor) {
      setSyncCursor(tableName, latestCursor);
    }

    return merged;
  }

  // ── Full Sync (pull all, then push) ───────────────────────────
  async fullSync(): Promise<{ pulled: number; pushed: boolean }> {
    if (this.isSyncing) return { pulled: 0, pushed: false };
    if (!isSupabaseConfigured()) return { pulled: 0, pushed: false };

    this.isSyncing = true;
    let totalPulled = 0;

    try {
      // Pull from all tables
      for (const tableName of SYNCABLE_TABLES) {
        const count = await this.pullChanges(tableName);
        totalPulled += count;
      }

      // Push queued changes
      await this.processPushQueue();

      return { pulled: totalPulled, pushed: true };
    } catch (err) {
      console.error('[SyncService] Full sync error:', err);
      return { pulled: totalPulled, pushed: false };
    } finally {
      this.isSyncing = false;
    }
  }

  // ── Auto Sync (online/offline listeners + periodic) ───────────
  startAutoSync(): void {
    // Don't double-start
    if (this.syncInterval) return;

    // Periodic sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.fullSync().catch(console.error);
      }
    }, 30_000);

    // Sync immediately when coming back online
    this.onlineHandler = () => {
      this.fullSync().catch(console.error);
    };
    window.addEventListener('online', this.onlineHandler);

    // Sync on tab focus (user returning to app)
    this.focusHandler = () => {
      if (navigator.onLine && !this.isSyncing) {
        this.fullSync().catch(console.error);
      }
    };
    window.addEventListener('focus', this.focusHandler);

    // Initial sync on start
    if (navigator.onLine) {
      this.fullSync().catch(console.error);
    }
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
      this.onlineHandler = null;
    }

    if (this.focusHandler) {
      window.removeEventListener('focus', this.focusHandler);
      this.focusHandler = null;
    }
  }

  // ── Queue size (for UI indicators) ────────────────────────────
  async getPendingCount(): Promise<number> {
    return db.sync_queue.count();
  }

  // ── Clear all sync cursors (force re-download) ────────────────
  clearAllCursors(): void {
    for (const tableName of SYNCABLE_TABLES) {
      localStorage.removeItem(`${CURSOR_PREFIX}${tableName}`);
    }
  }
}

export const syncService = new SyncService();
