# 3. Feature List

## Productivity Core
- **Habit Tracking:** Boolean (Done/Missed), Count (e.g., 5 glasses of water), Duration (e.g., 30 mins reading), Rating (1-5 scale).
- **Task Management:** Standard to-do list, priorities (0-3), labels, due dates, subtasks, projects.
- **Mood Journal:** Daily 1-5 mood score tracking with an optional text journal entry.
- **Weekly Review:** A dedicated workflow to reflect on the past 7 days of performance.

## Gamification & Economy
- **XP & Leveling:** Gain XP for task/habit completions. Level titles unlock over time (`Beginner` -> `Builder` -> `Achiever`).
- **Coins:** Earn spendable currency for maintaining streaks and completing dailies.
- **Shop:** A virtual store to buy cosmetic upgrades.
- **Dynamic Themes:** Unlockable color palettes (Indigo, Cyberpunk, Sunset, etc.) that alter global CSS variables.
- **Streak Freezes:** Consume an item to prevent a streak from resetting when a habit is missed.

## Technology & Platform
- **Offline-First Mode:** 100% functionality without internet access. Data is persisted to IndexedDB.
- **Cloud Sync:** Background, non-blocking sync engine via Supabase.
- **PWA (Progressive Web App):** Installable on Desktop, iOS, and Android.
- **Push Notifications:** Reminders for habits based on scheduled times.

## Social & AI
- **Squads:** Create or join private groups via invite code to see member streaks and completion rates.
- **AI Insights:** Automated correlation detection showing how specific habits impact mood over time.
- **Health Sync:** (Beta) Opt-in integrations to sync pedometer or sleep data.
