# 1. API Architecture

Because HabitFlow is an offline-first application, there is no traditional REST API that the client blocks on. The frontend talks exclusively to the local IndexedDB (Dexie).

The "API" layer exists purely as a background synchronization mechanism communicating with Supabase.

## 1.1 Synchronization Flow
- **Push:** The `syncService` reads the local `sync_queue` table. It batches `upsert` and `delete` operations and sends them to the Supabase REST endpoint via `supabase.from(table).upsert()`.
- **Pull:** On app load and periodic intervals, the `syncService` requests all records from Supabase where `updated_at > last_sync_timestamp`. These records are merged into the local IndexedDB.
- **Conflict Resolution:** Last-Write-Wins (LWW). Supabase acts as the arbiter. If a local change and a remote change collide on the same UUID, the one with the most recent `updated_at` timestamp is kept.

## 1.2 Table Endpoints (Supabase RPCs / PostgREST)
While not directly queried by the UI, the following endpoints are hit by the background sync service:
- `POST /rest/v1/habits`
- `POST /rest/v1/habit_logs`
- `POST /rest/v1/tasks`
- `POST /rest/v1/moods`
- `POST /rest/v1/user_xp`
- `POST /rest/v1/settings`

---

# 2. Security Architecture

## 2.1 Authentication Flow
HabitFlow uses **Supabase Auth** (GoTrue).
- Users can authenticate via Email/Password or OAuth (Google/GitHub).
- Upon successful authentication, a JWT is issued and stored in local storage.
- The `useAuthStore` monitors the session state via `supabase.auth.onAuthStateChange`.
- **Guest Mode:** Users can skip authentication entirely. In Guest Mode, data is purely local and never synced. If they later create an account, `migrationService.ts` seamlessly associates all local records with their new Supabase `user_id`.

## 2.2 Data Authorization (Row Level Security)
Data privacy is enforced at the database level using Postgres Row Level Security (RLS) in Supabase.
- **Strict Isolation:** A user can only `SELECT`, `INSERT`, `UPDATE`, or `DELETE` rows where `user_id = auth.uid()`.
- **Exception (Squads):** The `squads` and `squad_members` tables have specific RLS policies allowing `SELECT` if a user is a member of that specific squad, enabling basic social accountability features without exposing private habit names or task descriptions.

## 2.3 Threat Model & Encryption
- **Local Data:** Data in IndexedDB is unencrypted by default, matching standard web application security boundaries. It relies on the operating system and browser's inherent sandbox security.
- **In-Transit:** All sync data is transmitted via HTTPS (TLS 1.2+).
- **At-Rest (Cloud):** Supabase encrypts all data at rest on their Postgres instances.
