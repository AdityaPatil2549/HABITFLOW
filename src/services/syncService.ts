// ============================================================
// HabitFlow — Offline-First Sync Engine (Firestore Version)
// ============================================================
import { db as firestore, auth, isFirebaseConfigured } from '@/lib/firebase';
import { db, type SyncQueueItem } from '@/db';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  writeBatch
} from 'firebase/firestore';

// ─── Table Name Mapping (Dexie camelCase → Firestore collection) ─────
const DEXIE_TO_FIRESTORE: Record<string, string> = {
  habits: 'habits',
  habitLogs: 'habit_logs',
  tasks: 'tasks',
  projects: 'projects',
  moods: 'moods',
  userXP: 'user_xp',
  settings: 'settings',
};

const SYNCABLE_TABLES = Object.keys(DEXIE_TO_FIRESTORE);

// ─── Column Name Mapping (camelCase ↔ snake_case per table) ─────────
const COLUMN_MAP: Record<string, Record<string, string>> = {
  habits: { frequencyDays: 'frequency_days', frequencyInterval: 'frequency_interval', targetValue: 'target_value', startDate: 'start_date', endDate: 'end_date', reminderTime: 'reminder_time', reminderDays: 'reminder_days', graceDayEnabled: 'grace_day_enabled', createdAt: 'created_at', updatedAt: 'updated_at', deletedAt: 'deleted_at', userId: 'user_id' },
  habit_logs: { habitId: 'habit_id', isFrozen: 'is_frozen', timeStamp: 'time_stamp', createdAt: 'created_at', updatedAt: 'updated_at', deletedAt: 'deleted_at', userId: 'user_id' },
  tasks: { dueDate: 'due_date', dueTime: 'due_time', projectId: 'project_id', parentId: 'parent_id', recurringInterval: 'recurring_interval', completedAt: 'completed_at', createdAt: 'created_at', updatedAt: 'updated_at', deletedAt: 'deleted_at', userId: 'user_id' },
  projects: { createdAt: 'created_at', updatedAt: 'updated_at', deletedAt: 'deleted_at', userId: 'user_id' },
  moods: { createdAt: 'created_at', updatedAt: 'updated_at', deletedAt: 'deleted_at', userId: 'user_id' },
  user_xp: { levelProgress: 'level_progress', badgesEarned: 'badges_earned', weeklyScore: 'weekly_score', dailyScore: 'daily_score', streakFreezes: 'streak_freezes', unlockedThemes: 'unlocked_themes', lastDailyReset: 'last_daily_reset', lastWeeklyReset: 'last_weekly_reset', lastUpdated: 'last_updated', updatedAt: 'updated_at', userId: 'user_id' },
  settings: { darkMode: 'dark_mode', weekStartsOnMonday: 'week_starts_on_monday', notificationsEnabled: 'notifications_enabled', soundEnabled: 'sound_enabled', hapticEnabled: 'haptic_enabled', morningBriefingTime: 'morning_briefing_time', updatedAt: 'updated_at', userId: 'user_id', googleCalendarSync: 'google_calendar_sync', googleCalendarCompletions: 'google_calendar_completions' },
};

const REVERSE_COLUMN_MAP: Record<string, Record<string, string>> = {};
for (const [table, mapping] of Object.entries(COLUMN_MAP)) {
  REVERSE_COLUMN_MAP[table] = Object.fromEntries(
    Object.entries(mapping).map(([camel, snake]) => [snake, camel])
  );
}

function toFirestoreRow(firestoreTable: string, record: Record<string, any>): Record<string, any> {
  const mapping = COLUMN_MAP[firestoreTable] ?? {};
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    const mappedKey = mapping[key] ?? key;
    result[mappedKey] = value;
  }
  return result;
}

function toDexieRow(firestoreTable: string, record: Record<string, any>): Record<string, any> {
  const mapping = REVERSE_COLUMN_MAP[firestoreTable] ?? {};
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    const mappedKey = mapping[key] ?? key;
    result[mappedKey] = value;
  }
  return result;
}

const CURSOR_PREFIX = 'habitflow_sync_cursor_';
function getSyncCursor(tableName: string): string | null { return localStorage.getItem(`${CURSOR_PREFIX}${tableName}`); }
function setSyncCursor(tableName: string, cursor: string): void { localStorage.setItem(`${CURSOR_PREFIX}${tableName}`, cursor); }

function getDexieTable(dexieTableName: string) { return (db as any)[dexieTableName] as import('dexie').Table; }

function getAuthUserId(): string | null {
  return auth.currentUser?.uid ?? null;
}

class SyncService {
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isSyncing = false;
  private onlineHandler: (() => void) | null = null;
  private focusHandler: (() => void) | null = null;
  private pushTimeout: ReturnType<typeof setTimeout> | null = null;

  async queuePush(tableName: string, record: Record<string, any>, operation: 'upsert' | 'delete'): Promise<void> {
    if (!isFirebaseConfigured()) return;
    const item: SyncQueueItem = {
      table_name: tableName,
      record_id: String(record.id),
      operation,
      payload: operation === 'delete' ? { id: record.id } : { ...record },
      created_at: new Date().toISOString(),
    };
    await db.sync_queue.add(item);
    if (navigator.onLine) {
      if (this.pushTimeout) clearTimeout(this.pushTimeout);
      this.pushTimeout = setTimeout(() => { this.processPushQueue().catch(console.error); }, 1000);
    }
  }

  async processPushQueue(): Promise<void> {
    if (!isFirebaseConfigured()) return;
    const userId = getAuthUserId();
    if (!userId) return;

    const items = await db.sync_queue.orderBy('created_at').toArray();
    if (items.length === 0) return;

    const latest = new Map<string, SyncQueueItem>();
    for (const item of items) {
      const key = `${item.table_name}::${item.record_id}`;
      latest.set(key, item);
    }

    const succeeded: number[] = [];
    
    // Process in batches of 500 (Firestore limit)
    let batch = writeBatch(firestore);
    let batchCount = 0;

    for (const item of latest.values()) {
      try {
        const firestoreTable = DEXIE_TO_FIRESTORE[item.table_name] ?? item.table_name;
        const docRef = doc(firestore, firestoreTable, item.record_id);

        if (item.operation === 'delete') {
          batch.update(docRef, { deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        } else {
          const row = toFirestoreRow(firestoreTable, { ...item.payload, user_id: userId, updated_at: new Date().toISOString() });
          batch.set(docRef, row, { merge: true });
        }
        
        batchCount++;
        
        const allIdsForKey = items.filter(i => i.table_name === item.table_name && i.record_id === item.record_id).map(i => i.id!).filter(Boolean);
        succeeded.push(...allIdsForKey);

        if (batchCount >= 500) {
          await batch.commit();
          batch = writeBatch(firestore);
          batchCount = 0;
        }
      } catch (err) {
        console.error(`[SyncService] Batch prep failed for ${item.table_name}/${item.record_id}:`, err);
      }
    }

    if (batchCount > 0) {
      try {
        await batch.commit();
      } catch (e) {
        console.error('[SyncService] Batch commit failed', e);
        return; // don't delete queue if batch fails
      }
    }

    if (succeeded.length > 0) {
      await db.sync_queue.bulkDelete(succeeded);
    }
  }

  async pullChanges(tableName: string): Promise<number> {
    if (!isFirebaseConfigured()) return 0;
    const userId = getAuthUserId();
    if (!userId) return 0;

    const firestoreTable = DEXIE_TO_FIRESTORE[tableName] ?? tableName;
    const cursor = getSyncCursor(tableName);

    let q = query(collection(firestore, firestoreTable), where('user_id', '==', userId), orderBy('updated_at', 'asc'), limit(500));
    if (cursor) {
      q = query(collection(firestore, firestoreTable), where('user_id', '==', userId), where('updated_at', '>', cursor), orderBy('updated_at', 'asc'), limit(500));
    }

    try {
      const snapshot = await getDocs(q);
      if (snapshot.empty) return 0;

      const table = getDexieTable(tableName);
      let merged = 0;
      let latestCursor = cursor ?? '';

      for (const doc of snapshot.docs) {
        const remoteRow = doc.data();
        const dexieRow = toDexieRow(firestoreTable, remoteRow);
        const remoteUpdatedAt = remoteRow.updated_at ?? remoteRow.created_at ?? '';

        if (remoteUpdatedAt > latestCursor) latestCursor = remoteUpdatedAt;

        if (remoteRow.deleted_at) {
          try { await table.delete(dexieRow.id); } catch {}
          merged++;
          continue;
        }

        const localRow = await table.get(dexieRow.id).catch(() => null);
        if (!localRow) {
          const { userId: _uid, deletedAt: _del, ...cleanRow } = dexieRow;
          await table.add(cleanRow).catch(() => table.put(cleanRow));
          merged++;
        } else {
          const localUpdatedAt = (localRow as any).updatedAt ?? (localRow as any).createdAt ?? '';
          if (remoteUpdatedAt > localUpdatedAt) {
            const { userId: _uid, deletedAt: _del, ...cleanRow } = dexieRow;
            await table.put(cleanRow);
            merged++;
          }
        }
      }

      if (latestCursor) setSyncCursor(tableName, latestCursor);
      return merged;
    } catch (e) {
      console.error(`[SyncService] Pull failed for ${firestoreTable}:`, e);
      return 0;
    }
  }

  async fullSync(): Promise<{ pulled: number; pushed: boolean }> {
    if (this.isSyncing) return { pulled: 0, pushed: false };
    if (!isFirebaseConfigured()) return { pulled: 0, pushed: false };

    this.isSyncing = true;
    let totalPulled = 0;

    try {
      for (const tableName of SYNCABLE_TABLES) {
        const count = await this.pullChanges(tableName);
        totalPulled += count;
      }
      if (totalPulled > 0) window.dispatchEvent(new CustomEvent('habitflow-sync-pulled'));
      await this.processPushQueue();
      return { pulled: totalPulled, pushed: true };
    } catch (err) {
      console.error('[SyncService] Full sync error:', err);
      return { pulled: totalPulled, pushed: false };
    } finally {
      this.isSyncing = false;
    }
  }

  startAutoSync(): void {
    if (this.syncInterval) return;
    
    // We will rely on periodic and focus events instead of realtime channels for Firestore
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) this.fullSync().catch(console.error);
    }, 30_000);

    this.onlineHandler = () => this.fullSync().catch(console.error);
    window.addEventListener('online', this.onlineHandler);

    this.focusHandler = () => {
      if (navigator.onLine && !this.isSyncing) this.fullSync().catch(console.error);
    };
    window.addEventListener('focus', this.focusHandler);

    if (navigator.onLine) this.fullSync().catch(console.error);
  }

  stopAutoSync(): void {
    if (this.syncInterval) { clearInterval(this.syncInterval); this.syncInterval = null; }
    if (this.onlineHandler) { window.removeEventListener('online', this.onlineHandler); this.onlineHandler = null; }
    if (this.focusHandler) { window.removeEventListener('focus', this.focusHandler); this.focusHandler = null; }
  }

  async getPendingCount(): Promise<number> { return db.sync_queue.count(); }

  clearAllCursors(): void {
    for (const tableName of SYNCABLE_TABLES) localStorage.removeItem(`${CURSOR_PREFIX}${tableName}`);
  }
}

export const syncService = new SyncService();
