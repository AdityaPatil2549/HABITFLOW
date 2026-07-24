# 1. User Journeys & Flows

## Core Loop: The Daily Check-in
1. **Trigger:** Push notification at 8:00 AM (configured via settings) or intrinsic motivation to check daily goals.
2. **Action:** User opens HabitFlow (PWA or Desktop).
3. **Experience:** 
   - Instant load via IndexedDB (Offline-first).
   - The user is greeted by the unified Dashboard showing today's tasks, pending habits, and a mood tracker.
4. **Completion:** 
   - User marks "Drink 2L Water" as complete.
   - Haptic and audio feedback triggers (`soundService.playSuccess()`).
   - XP is calculated and awarded instantly. Confetti animation fires on the screen.
5. **Reflection:** User logs a mood of "4" and writes a quick journal entry about their morning.
6. **Background:** `syncService` queues the habit and mood logs, pushing them silently to Supabase.

---

# 2. Design System & Guidelines

HabitFlow relies on a premium, high-aesthetic design system that completely avoids the "corporate dashboard" look.

## 2.1 Core Aesthetics
- **Glassmorphism:** The foundational visual style. Cards use `.glass-card` containing `backdrop-filter: blur(16px)`, `background: rgba(255, 255, 255, 0.05)`, and glowing 1px borders to simulate frosted glass.
- **Micro-interactions:** Heavy use of Framer Motion for spring-based physics. Hover states feature slight scaling (`hover:scale-105`) and tilting (`hover:-rotate-2`).
- **Typography:** Inter or system default sans-serif, with heavy emphasis on varied font weights (tracking tight on bold headers).

## 2.2 Iconography (3D Emojis)
Instead of flat SVG icons (Lucide/Heroicons), HabitFlow uses premium **Microsoft Fluent 3D Emojis**. 
- Assets are stored in `public/3d-icons/`.
- Rendered via `IconRenderer.tsx` with dynamic fallbacks to Lucide if a 3D asset is missing.

## 2.3 Dynamic Themes
Themes are driven by global CSS variables injected into the root HTML element.
- `indigo`: The default deep purple/blue palette.
- `cyberpunk`: High-contrast neon pinks and yellows on pitch black.
- `emerald`: Natural greens and soft mint accents.

---

# 3. Functional Specifications

## 3.1 Habit Module (`HabitStore`)
- **Boolean Habits:** Simple binary completion.
- **Count Habits:** Requires `currentValue >= targetValue` to mark as completed.
- **Duration Habits:** Integrates a local timer (or manual input) to track minutes spent.
- **Streak Calculation:** Streaks are calculated dynamically based on historical `habitLogs`. If a day is missed but `isFrozen == true` (grace day used), the streak does not reset.

## 3.2 Task Module (`TaskStore`)
- **Hierarchy:** Tasks can have a `parentId`, allowing infinite nesting (subtasks). 
- **Recurring:** Supports standard cron-like recursion (Daily, Weekly, Monthly). When a recurring task is marked complete, the current task is finalized, and a future duplicate is generated based on the rule.

## 3.3 AI Insights Engine
The engine scans historical data (min 14 days) to find correlations.
- **Formula:** Uses a basic Pearson correlation coefficient comparing the boolean completion vector of a habit against the 1-5 scalar vector of the daily mood score.
- **Output:** E.g., "On days you complete *Morning Run*, your mood is typically 30% higher than average."
