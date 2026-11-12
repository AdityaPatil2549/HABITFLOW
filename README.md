# HabitFlow

> **Offline-first behavioral execution system built as a tactile Swiss Kinetic Instrument.**

HabitFlow helps you execute daily habits, manage tasks, protect streaks with honest continuity mechanics, and track long-term behavioral momentum — with zero account required to start. All core data lives locally in IndexedDB with optional Firebase cloud sync.

---

## Core Architecture & Design System

### Swiss Kinetic Instrument
- **Dual Polarity**: Switches seamlessly between Obsidian Dark (`#0B0B0E`) and Archival Paper Light (`#F4F2ED`), or follows system preference (`dark | light | system`).
- **Signal Ink Cartridges**: Five high-contrast accent inks (`volt`, `crimson`, `cobalt`, `amber`, `obsidian`) applied strictly to active intent and earned proof — no blur glassmorphism, neon shadows, or gradient noise.
- **Bundled Typography**: Uses `@fontsource-variable/geist` and `@fontsource-variable/geist-mono` locally with `tabular-nums` alignment across counters, timers, and heatmaps — zero external font CDN calls and full offline PWA precaching.
- **Kinetics Under 160ms**: Instant, damped micro-interactions (`<= 160ms`) and synthesized Web Audio feedback with switchable acoustic packs (`Mechanical`, `Woodblock`, `Silent`).

### 3-Stage Telemetry Progression
As discipline matures, external noise fades automatically or on demand (`scaffold` -> `instrument` -> `monastic`):
- **Scaffold** (Starter / Levels 1–4): Full XP popups, badges, confetti celebrations, and reward chimes.
- **Instrument** (Level 5+ or selected): Strips celebratory confetti and chimes; retains tactile click feedback and structured telemetry.
- **Monastic**: Pure execution checklist with zero XP clutter or external gamification noise.

---

## 4 Workspaces

1. **Today (`/`) — Daily Execution Instrument**:
   - **Momentum Horizon**, **Tactile Habit Cards** (`■ done`, `═ grace`, `◈ freeze`, `▲ comeback`, `□ pending` Continuity Tape), non-boolean **Habit Steppers** (numeric / duration / rating), chained **Relay Rail** stacks with inline **"Bypass Link Today"** override, **Today's Tasks**, **Mood Pulse**, and **Focus Overlay** Pomodoro timer.
2. **Plan (`/habits`) — Habit Workstation**:
   - Full habit inventory, category filter, stack builder, and slide-over Habit Editor drawer.
3. **Insights (`/insights`) — Analytics & Weekly Review**:
   - Unified hub for Overview metrics, Per-Habit deep dive, 90-day Heatmap Matrix, Habit-Mood Correlations, Task Analytics, AI Coach insights, and the Weekly Review retrospective.
4. **Hub (`/hub/*`) — Tasks, Armory, Squad, Settings & Profile**:
   - **Tasks (`/hub/tasks`)**: Full workstation with priority sorting, projects, and recurring schedules.
   - **Armory (`/hub/shop`)**: Spend earned coins on Signal Ink cartridges, Streak Protection Freezes, and Acoustic Packs.
   - **Squad (`/hub/squad`)**: Opt-in accountability circles with invite codes and daily completion rings.
   - **Settings (`/hub/settings`)** & **Profile (`/hub/profile`)**: Polarity, Ink, Telemetry mode, Audio Pack, Data JSON export/import, and optional Google/Firebase integrations.

---

## Behavioral Mechanics

- **Atomic Momentum Engine (`src/services/momentumEngine.ts`)**: Computes a 4-day half-life exponential decay momentum score (`0–100`), prevents brittle streak resets, awards comeback resilience bonuses after gaps, and sorts stacked chains topologically.
- **Continuity Tape (`src/components/habits/ContinuityTape.tsx`)**: 7-day deterministic status ribbon distinguishing steady completions, single grace bridges, freeze shields, and comeback days.
- **Offline-First Storage & Sync**: Built on Dexie (IndexedDB) with tombstone tracking, starter resurrection guards, and lazy-loaded Firebase Auth/Firestore sync queue (`{ merge: true }`).

---

## Development

```bash
npm install
npm run dev       # Local dev server (Vite)
npm test          # Vitest non-interactive run
npm run lint      # ESLint across src/
npm run build     # tsc + vite production bundle
```
