# 1. Software Architecture Document (SAD)

## 1.1 Overview
HabitFlow operates as an **Offline-First Progressive Web Application (PWA)**. The primary source of truth for all user operations is the local IndexedDB, not the cloud. 

The architecture is strictly decoupled into three layers:
1. **Presentation Layer (React):** Renders UI based on Zustand state.
2. **State & Orchestration Layer (Zustand Stores):** Handles business logic, interacts with the local database, and updates the UI synchronously.
3. **Data Layer (Dexie + Supabase):** 
   - *Dexie* handles synchronous-feeling local I/O.
   - *Supabase* handles asynchronous background replication and authentication.

## 1.2 The Offline-First Paradigm
When a user marks a habit as complete:
1. The UI calls `habitStore.logHabit()`.
2. The store immediately updates the local IndexedDB via Dexie.
3. Dexie responds in <5ms. The UI updates instantly.
4. Concurrently, a trigger inserts a record into the local `sync_queue` table.
5. The background `syncService` (if online) reads the queue and PUSHes the change to Supabase.
6. If the push succeeds, the item is removed from the queue. If it fails (or the user is offline), it remains in the queue for the next retry cycle.

---

# 2. Folder Structure

```
src/
├── assets/         # Static images, SVG icons, and 3D Emoji assets
├── components/     # React Components
│   ├── analytics/  # Recharts implementation for data viz
│   ├── common/     # Reusable UI (Toast, ErrorBoundary, IconRenderer)
│   ├── dashboard/  # Dashboard specific widgets (MoodWidget, TasksWidget)
│   ├── focus/      # Focus mode overlays
│   ├── habits/     # Habit CRUD and specific UI elements
│   ├── layout/     # App shells, Navigation, ReloadPrompt
│   ├── onboarding/ # First-time user setup wizards
│   └── ui/         # Base design system components (buttons, inputs)
├── db/             # Dexie database schemas and singleton initializers
├── hooks/          # Custom React hooks (e.g., useTheme, useNetwork)
├── lib/            # Library configurations (e.g., Supabase client setup)
├── pages/          # React Router top-level view components
├── services/       # Background singletons (Sync, Sound, Notifications, Health)
├── store/          # Zustand state managers (Auth, Habit, Task, Mood)
├── types/          # Global TypeScript interfaces and type definitions
└── utils/          # Pure utility functions (Date math, formatting)
```

---

# 3. Frontend Architecture

## Component Strategy
- **Smart vs. Dumb Components:** `Pages` and large `Widgets` (like `TasksWidget`) are "smart" and connect directly to Zustand stores. Small `ui` components (like `Badge.tsx` or `Button.tsx`) are purely presentational.
- **Styling:** We use Tailwind CSS configured with CSS variables for dynamic theming. Glassmorphism is implemented via custom `.glass-card` CSS classes in `index.css`.
- **Dynamic Assets:** Due to the premium visual requirement, standard vector icons are replaced by `public/3d-icons/` (Microsoft Fluent Emojis) mapped via `IconRenderer.tsx`.

---

# 4. State Management Guide

HabitFlow uses **Zustand** due to its un-opinionated, boilerplate-free approach, which is critical for rapid iterations compared to Redux.

## Core Stores
1. **useAuthStore:** Manages the user's Supabase session and guest-mode toggles.
2. **useHabitStore:** Manages habit definitions, logs, and calculates streaks dynamically based on the local database state.
3. **useTaskStore:** Manages the hierarchical task tree (projects, parent tasks, subtasks).
4. **useMoodStore:** Manages daily mood tracking data.
5. **useModalStore:** Controls the global visibility of overlays like the QuickAdd Modal, avoiding deep prop-drilling for standard UI interactions.

## Store Hydration
Stores do *not* automatically hydrate from the database on import. They export a `loadX()` method (e.g., `loadHabits()`) which is called on application boot in `App.tsx` and immediately after the `syncService` completes a background pull from the cloud.
