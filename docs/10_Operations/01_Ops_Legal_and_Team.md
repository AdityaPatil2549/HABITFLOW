# 1. Operations & Maintenance

HabitFlow is designed to be low-maintenance due to its offline-first architecture, but standard operational procedures apply for the cloud sync infrastructure.

## 1.1 Incident Response Plan
Since user data is primarily stored in local IndexedDB, a cloud outage (e.g., Supabase downtime) is classified as a **Tier 2 (Degraded)** incident rather than a Tier 1 (Critical) outage.
- **User Impact during outage:** Users can continue to use the app, complete habits, and earn XP perfectly normally. The only degraded functionality is cross-device syncing and squad leaderboards.
- **Response:** The `syncService` will automatically queue all changes locally and perform exponential backoff retries until the cloud service is restored.

## 1.2 Disaster Recovery
- **Local DB Corruption:** If IndexedDB is corrupted by the browser, the user can wipe site data and log back in; the `syncService` will perform a full pull from Supabase.
- **Cloud DB Loss:** Supabase performs daily automated backups with Point-in-Time Recovery (PITR) enabled.

---

# 2. Legal Policies

*(Note: These are structural placeholders and do not constitute actual legal advice.)*

## 2.1 Privacy Policy
**Core Tenet:** We do not sell user data.
- HabitFlow processes habits, tasks, and mood journals.
- Users may opt into "Guest Mode" where no data is ever transmitted to our servers.
- When an account is created, data is securely synced to Supabase (AWS hosted) solely for the purpose of multi-device access.

## 2.2 Terms of Service
- Defines acceptable use, particularly regarding Squad invites and community features.
- Outlines the virtual economy (Coins, XP) clarifying that these hold no real-world monetary value and are strictly for in-app cosmetic upgrades (Themes, Avatars).

## 2.3 Open Source Licenses
HabitFlow relies on several open-source libraries (MIT/Apache 2.0). A generated `licenses.txt` file is bundled with the production build to ensure compliance with libraries such as React, TailwindCSS, Zustand, and Dexie.js.

---

# 3. Team & Contributor Guide

## 3.1 Git Workflow
We use a standard Feature Branch workflow.
1. Branch from `main` using the format `feature/your-feature-name` or `bugfix/issue-description`.
2. Commit frequently using conventional commit messages (`feat:`, `fix:`, `chore:`).
3. Open a Pull Request against `main`.

## 3.2 Code Review Checklist
Before merging, all PRs must pass the following criteria:
- [ ] No direct Dexie calls from React components (must route through a Zustand store or a Service).
- [ ] Zustand stores must properly push mutations to the `sync_queue`.
- [ ] UI must adhere to the Design System (Tailwind tokens, `.glass-card`). No hardcoded colors.
- [ ] 3D Emojis must be used via `IconRenderer` with proper fallback logic.
- [ ] Vitest test coverage must remain above 80% for store logic.

## 3.3 Onboarding
New developers should begin by reading `docs/04_Architecture/01_Architecture_and_Frontend.md` and `docs/05_Database/01_Database_and_Sync.md` to understand the offline-first data flow, as it differs significantly from traditional React/REST applications.
