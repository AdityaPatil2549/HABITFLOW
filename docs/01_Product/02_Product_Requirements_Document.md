# 2. Product Requirements Document (PRD)

## Objectives
- Build a best-in-class, local-first productivity web application.
- Seamlessly integrate habit tracking, task management, and mood journaling.
- Provide a robust gamification system that incentivizes consistency without causing burnout.
- Achieve a highly polished, aesthetic user interface using Tailwind CSS and glassmorphism.

## Scope
**In-Scope:**
- Local-first IndexedDB storage via Dexie.
- Supabase cloud synchronization for multi-device support.
- Progressive Web App (PWA) configuration for native-like installation.
- Complex habit scheduling (daily, weekly, custom intervals).
- Nested task management (parent/child relationships).
- Mood and journaling system.
- Gamification economy (XP, levels, coins, cosmetic shop).
- Squads (social accountability groups).

**Out-of-Scope (for Version 1.0):**
- Real-time multiplayer collaborative task editing.
- Full calendar replacement (e.g., meeting scheduling, inviting attendees).
- Native iOS/Android app store deployment (relying on PWA initially).

## Success Metrics
- **Performance:** App Time-to-Interactive (TTI) < 1.5s on desktop.
- **Engagement:** DAU/MAU ratio > 25%.
- **Retention:** Day-30 retention > 15%.
- **Sync Reliability:** 99.9% successful background sync resolution with zero data loss during offline-to-online transitions.

## User Stories
1. *As a busy professional, I want to manage my daily to-do list alongside my health habits in one dashboard, so I don't have to switch between apps.*
2. *As a student, I want to earn XP and unlock themes for studying consistently, so I stay motivated throughout the semester.*
3. *As a user with an unstable internet connection, I want the app to load instantly and save my data offline, so my productivity is never blocked by a loading spinner.*
4. *As someone looking to improve my mental health, I want to see a chart showing how my sleep habit affects my daily mood score, so I can make informed lifestyle changes.*

## Key Features
- **Dashboard:** Unified daily view of tasks, habits, and mood.
- **Habit Engine:** Supports Boolean, Count, Duration, and Rating types.
- **Task Engine:** Supports Due dates, Priorities, Labels, Subtasks, and Recurring rules.
- **AI Analytics:** Correlation detection between completed habits and mood scores.
- **The Shop:** A cosmetic store utilizing earned coins to buy UI Themes, Badges, and Avatars.
- **Grace Days (Streak Freezes):** Protects user streaks from breaking due to illness or planned rest.

## Constraints
- **Data Privacy:** All data must be fundamentally structured to work locally. Cloud sync is an optional enhancement layer, meaning all database schema decisions must prioritize IndexedDB constraints.
- **Design Language:** Must adhere strictly to the established Glassmorphism design system; standard flat-UI components are not permitted for core layout structures.
