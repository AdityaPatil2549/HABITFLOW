-- ============================================================
-- HabitFlow — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor (supabase.com → SQL Editor)
-- ============================================================

-- ─── Profiles ────────────────────────────────────────────────
-- Automatically created when a user signs up via trigger
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null default '',
  bio text default '',
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', '')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─── Habits ──────────────────────────────────────────────────
create table if not exists public.habits (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  icon text not null default '✅',
  color text not null default '#6366f1',
  category text not null default 'General',
  type text not null default 'boolean',
  frequency text not null default 'daily',
  frequency_days integer[] default '{}',
  frequency_interval integer,
  target_value numeric not null default 1,
  unit text,
  start_date text not null,
  end_date text,
  reminder_time text,
  reminder_days integer[] default '{}',
  grace_day_enabled boolean not null default false,
  archived boolean not null default false,
  "order" integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz  -- soft delete
);

create index idx_habits_user on public.habits(user_id);
create index idx_habits_updated on public.habits(user_id, updated_at);

alter table public.habits enable row level security;

create policy "Users can CRUD their own habits"
  on public.habits for all using (auth.uid() = user_id);


-- ─── Habit Logs ──────────────────────────────────────────────
create table if not exists public.habit_logs (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  habit_id text not null,
  date text not null,
  value numeric not null default 0,
  note text,
  mood integer,
  is_frozen boolean default false,
  time_stamp timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create index idx_habit_logs_user on public.habit_logs(user_id);
create index idx_habit_logs_habit_date on public.habit_logs(habit_id, date);
create index idx_habit_logs_updated on public.habit_logs(user_id, updated_at);

alter table public.habit_logs enable row level security;

create policy "Users can CRUD their own habit logs"
  on public.habit_logs for all using (auth.uid() = user_id);


-- ─── Tasks ───────────────────────────────────────────────────
create table if not exists public.tasks (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  priority integer not null default 1,
  due_date text,
  due_time text,
  labels text[] default '{}',
  project_id text,
  parent_id text,
  recurring text not null default 'none',
  recurring_interval integer,
  completed boolean not null default false,
  completed_at text,
  "order" integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create index idx_tasks_user on public.tasks(user_id);
create index idx_tasks_updated on public.tasks(user_id, updated_at);

alter table public.tasks enable row level security;

create policy "Users can CRUD their own tasks"
  on public.tasks for all using (auth.uid() = user_id);


-- ─── User XP / Gamification ─────────────────────────────────
create table if not exists public.user_xp (
  id text primary key default 'singleton',
  user_id uuid references auth.users on delete cascade not null unique,
  total integer not null default 0,
  level text not null default 'Beginner',
  level_progress numeric not null default 0,
  badges_earned jsonb not null default '[]',
  weekly_score integer not null default 0,
  daily_score integer not null default 0,
  streak_freezes integer not null default 3,
  unlocked_themes text[] default '{indigo,violet,emerald,rose,amber}',
  last_daily_reset text,
  last_weekly_reset text,
  last_updated timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_user_xp_user on public.user_xp(user_id);

alter table public.user_xp enable row level security;

create policy "Users can CRUD their own XP"
  on public.user_xp for all using (auth.uid() = user_id);


-- ─── Settings ────────────────────────────────────────────────
create table if not exists public.settings (
  id text primary key default 'singleton',
  user_id uuid references auth.users on delete cascade not null unique,
  theme text not null default 'indigo',
  dark_mode text not null default 'system',
  week_starts_on_monday boolean not null default true,
  notifications_enabled boolean not null default false,
  sound_enabled boolean not null default true,
  haptic_enabled boolean not null default true,
  morning_briefing_time text,
  language text not null default 'en',
  google_calendar_sync boolean not null default false,
  google_calendar_completions boolean not null default false,
  updated_at timestamptz default now()
);

create index idx_settings_user on public.settings(user_id);

alter table public.settings enable row level security;

create policy "Users can CRUD their own settings"
  on public.settings for all using (auth.uid() = user_id);


-- ─── Moods ───────────────────────────────────────────────────
create table if not exists public.moods (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  date text not null,
  score integer not null,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create index idx_moods_user on public.moods(user_id);
create index idx_moods_updated on public.moods(user_id, updated_at);

alter table public.moods enable row level security;

create policy "Users can CRUD their own moods"
  on public.moods for all using (auth.uid() = user_id);


-- ─── Sync Metadata ──────────────────────────────────────────
-- Tracks the last sync timestamp per table per user
create table if not exists public.sync_metadata (
  user_id uuid references auth.users on delete cascade not null,
  table_name text not null,
  last_synced_at timestamptz not null default '1970-01-01T00:00:00Z',
  primary key (user_id, table_name)
);

alter table public.sync_metadata enable row level security;

create policy "Users can CRUD their own sync metadata"
  on public.sync_metadata for all using (auth.uid() = user_id);


-- ─── Auto-update updated_at trigger ─────────────────────────
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to all tables
create trigger habits_updated_at before update on public.habits
  for each row execute procedure public.update_updated_at();
create trigger habit_logs_updated_at before update on public.habit_logs
  for each row execute procedure public.update_updated_at();
create trigger tasks_updated_at before update on public.tasks
  for each row execute procedure public.update_updated_at();
create trigger user_xp_updated_at before update on public.user_xp
  for each row execute procedure public.update_updated_at();
create trigger settings_updated_at before update on public.settings
  for each row execute procedure public.update_updated_at();
create trigger moods_updated_at before update on public.moods
  for each row execute procedure public.update_updated_at();
create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.update_updated_at();


-- --- Squads --------------------------------------------------
create table if not exists public.squads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  owner_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now()
);

alter table public.squads enable row level security;

create policy "Users can view all squads" on public.squads for select using (true);
create policy "Users can insert squads" on public.squads for insert with check (auth.uid() = owner_id);
create policy "Owner can delete squad" on public.squads for delete using (auth.uid() = owner_id);

-- --- Squad Members -------------------------------------------
create table if not exists public.squad_members (
  squad_id uuid references public.squads(id) on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  streak integer not null default 0,
  completion_today integer not null default 0,
  joined_at timestamptz default now(),
  primary key (squad_id, user_id)
);

alter table public.squad_members enable row level security;

create policy "Users can view squad members" on public.squad_members for select using (true);
create policy "Users can join squads" on public.squad_members for insert with check (auth.uid() = user_id);
create policy "Users can update their own progress" on public.squad_members for update using (auth.uid() = user_id);
create policy "Users can leave squads" on public.squad_members for delete using (auth.uid() = user_id);
