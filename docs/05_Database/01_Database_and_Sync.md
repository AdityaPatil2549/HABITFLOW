# 1. Database Design (Dexie schema)

HabitFlow relies on Dexie.js, a wrapper for IndexedDB, as its primary database. The database is highly relational despite existing in a NoSQL local environment.

## Versioning & Migrations
The database schema is strictly versioned in `src/db/index.ts`. All structural changes (adding tables, changing primary keys, adding indices) require a version bump and an `.upgrade()` block to prevent data loss for existing users during updates.

---

# 2. Schema Documentation & Data Dictionary

### Table: `habits`
Stores habit definitions.
- `id` (string): Primary Key (UUID).
- `name` (string): User-friendly title.
- `type` (HabitType): `boolean`, `count`, `duration`, or `rating`.
- `frequency` (HabitFrequency): `daily`, `weekly`, `custom`.
- `order` (number): Used for UI drag-and-drop sorting.
- `deleted_at` (string): ISO timestamp for soft deletes (required for sync engine).

### Table: `habitLogs`
Stores the actual execution/completion records of habits.
- `id` (string): Primary Key (UUID).
- `habitId` (string): Foreign Key to `habits.id`.
- `date` (string): The logical day of the log (YYYY-MM-DD).
- `value` (number): The numeric value of the completion (1 for boolean, 45 for 45 minutes of duration, etc.).
- `isFrozen` (boolean): True if the user applied a "Streak Freeze" to this day to prevent a broken streak.
- **Indices:** `[habitId+date]` compound index for highly optimized lookups during streak calculation.

### Table: `tasks`
Stores all to-do items and subtasks.
- `id` (string): Primary Key (UUID).
- `title` (string): The task description.
- `priority` (number): 0 (Low) to 3 (Highest).
- `dueDate` (string): ISO Date string (optional).
- `parentId` (string): Foreign Key to another `tasks.id`. If present, this task is a subtask.
- `completed` (boolean): Checkbox state.

### Table: `moods`
Stores daily mood logging.
- `id` (string): Primary Key (UUID).
- `date` (string): YYYY-MM-DD.
- `score` (number): 1 (Terrible) to 5 (Excellent).
- `note` (string): Optional journal entry.

### Table: `userXP` (Singleton)
A single row table tracking the user's gamification state.
- `id` (string): Hardcoded to `'singleton'`.
- `total` (number): All-time XP earned.
- `level` (string): Current rank.
- `coins` (number): Spendable currency in the Shop.
- `unlockedThemes` (string[]): List of CSS themes the user has purchased or unlocked.

### Table: `settings` (Singleton)
A single row table tracking app configurations.
- `id` (string): Hardcoded to `'singleton'`.
- `theme` (Theme): The currently active CSS theme.
- `soundEnabled` (boolean): Toggles audio feedback.

---

# 3. Sync Queue Architecture

To ensure 100% offline capability without data loss, HabitFlow uses an optimistic offline-first sync pattern.

### Table: `sync_queue`
Whenever a user mutates data (create, update, delete) via the Zustand stores, two things happen simultaneously:
1. The target table (e.g., `habits`) is updated locally.
2. A record is inserted into `sync_queue` containing the mutation payload.

```typescript
export interface SyncQueueItem {
  id?: number; 
  table_name: string; // e.g. "habits"
  record_id: string; // e.g. "uuid-1234"
  operation: 'upsert' | 'delete';
  payload: Record<string, unknown>; // The actual row data
  created_at: string;
}
```

### Flow Control:
- When the app is online, the `syncService` polls the `sync_queue` table.
- It attempts to push the oldest records to the Supabase REST API in batches.
- If Supabase returns a 200/201, the item is deleted from the local `sync_queue`.
- If the network request fails, the item remains in the `sync_queue` to be retried on the next polling cycle or when the `online` event fires in the browser.
- **Conflict Resolution:** Last-Write-Wins (LWW) based on the `updated_at` timestamp. Soft deletes (`deleted_at`) are used to ensure deleted records propagate correctly across devices rather than being resurrected by an older client.
