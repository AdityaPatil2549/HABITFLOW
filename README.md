# 🔥 HabitFlow

> **Build powerful daily routines. Track streaks. Level up your life.**

A premium, offline-first habit tracker and productivity app built with React, TypeScript, and IndexedDB. No account required — your data lives entirely on your device.

**🌐 Live Demo:** [habitflow-murex.vercel.app](https://habitflow-murex.vercel.app)

---

## ✨ Features

### 🎯 Core Habit Tracking
- Create habits with custom **icons, colors, categories, and frequencies** (daily, weekly, specific days)
- **Boolean** (done/not done) and **quantitative** (e.g., drink 8 glasses) habit types
- **Retroactive logging** — tap any of the last 7 days to log past habits
- **30-day streak history drawer** — click any habit name to see a colored completion grid
- **Calendar month view** — switch between List and Calendar mode to visualize habit completion across the month
- **Drag & drop reordering** of habits

### ⚡ Focus Mode
- Dedicated **Focus Mode** with a Pomodoro-style session timer
- Tracks which habit or task you're focusing on
- Persistent across navigation — timer stays running in the sidebar

### ✅ Task Management
- Full task system with **projects, subtasks, priorities (0–3), and due dates**
- **Priority color-coding** — urgent tasks have red borders/backgrounds, high has orange, medium has blue, and low stays neutral
- Recurring task support
- Overdue task highlights

### 🏆 Gamification
- **XP system** — earn XP for completing habits and tasks
- **Levels & badges** — unlock real earned badges (not hardcoded fakes)
- **Streak Freezes** — buy with XP to protect streaks when life happens
- **Theme unlocks** — spend XP to unlock Cyberpunk, Sunset Glow, Neon Pink themes

### 📊 Analytics & Review
- **Activity heatmap** (365-day GitHub-style grid)
- **Weekly trend chart** with sparkline
- **Weekly Review page** with adaptive headline based on your actual performance:
  - 🔥 *"You crushed it this week!"* — ≥70% habits on track
  - 💪 *"Building momentum!"* — ≥40%
  - 🌧️ *"Tough week — let's reset."* — struggling
  - 🌱 *"Let's get started!"* — no habits yet
- Best habit and "needs attention" habit callouts

### 🔔 Smart Notifications
- **Streak at-risk warning** — after 6 PM, a banner appears if any streaks are in danger tonight
- Push notification reminders (browser permission required)
- Per-habit reminder time picker

### 🎨 UI & Customization
- **8 color themes** — Indigo, Violet, Emerald, Rose, Amber, Neon Pink, Cyberpunk, Sunset Glow
- **Dark / Light mode toggle** in the sidebar (persisted)
- **Habit Templates Library** — 8 curated packs (Morning Routine, Fitness, Mental Health, etc.)
- **Onboarding wizard** for new users
- **Mood check-in** on the Dashboard (😢 → 😄 scale, tracked over time)
- Fully responsive — works on mobile and desktop

### ⌨️ Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `N` | New habit |
| `T` | New task |
| `F` | Toggle Focus Mode |
| `H` | Go to Habits |
| `D` | Go to Dashboard |
| `A` | Go to Analytics |
| `P` | Go to Profile |
| `Ctrl+K` | Open search |
| `ESC` | Close modals / dismiss confirm dialogs |

### 💾 Data & Privacy
- **100% offline-first** — all data stored in IndexedDB (Dexie.js) on your device
- **Export to JSON** — full backup of all habits, logs, tasks, XP
- **Export to CSV** — habit logs for spreadsheet analysis
- **Import from JSON** — restore a backup
- **PWA installable** — install to home screen like a native app, works offline

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS v4 |
| Database | Dexie.js (IndexedDB wrapper) |
| State | Zustand |
| Animations | Framer Motion |
| Icons | Lucide React |
| Charts | D3.js |
| Drag & Drop | @hello-pangea/dnd |
| PWA | vite-plugin-pwa (Workbox) |
| Routing | React Router v7 |
| Testing | Vitest + Testing Library |

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- npm

### Install & Run

```bash
# Clone the repo
git clone https://github.com/AdityaPatil2549/HABITFLOW.git
cd HABITFLOW/habitflow

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Other Commands

```bash
npm run build      # Production build (TypeScript check + Vite bundle)
npm run preview    # Preview production build locally
npm run lint       # ESLint check
npm run format     # Prettier format
npm run test       # Run unit tests (Vitest)
```

---

## 📱 User Guide

### 1. First Launch — Onboarding
On first visit, an onboarding wizard walks you through:
- Setting your name and avatar
- Choosing your first habits from curated templates
- Understanding the XP and streak system

### 2. Creating a Habit
1. Go to **Habits** (`H` key or sidebar)
2. Click **Add Habit** (or press `N`)
3. Fill in: name, icon, color, category, frequency, type (boolean/quantitative)
4. Optionally set a **reminder time** (browser notification)
5. Click 🔥 **Create Habit**

**Or** click **✨ Templates** to pick from 8 pre-built habit packs.

### 3. Logging a Habit
- Click the **circle button** on the left of any habit card to log it for today
- For quantitative habits, a modal lets you enter your value
- Use the **date strip** at the top of the Habits page to log for the past 6 days

### 4. Viewing Streak History
- Click the **habit name** (it becomes underlined on hover)
- A **30-day colored grid** slides open below showing your completion history

### 5. Calendar View
- Click the **Calendar** toggle in the top-right of the Habits page
- Navigate months with the `‹` `›` arrows
- Each day shows colored dots for scheduled habits
- Tap any past day to switch to list view for that date

### 6. Tasks
1. Go to **Tasks** (`T` key to create, or sidebar)
2. Tasks are color-coded by priority:
   - 🔴 **Urgent** — red border + background
   - 🟠 **High** — orange
   - 🔵 **Medium** — blue
   - ⚪ **Low** — subtle
3. Tap a task to expand subtasks

### 7. Focus Mode
- Click **⏱ Focus Mode** in the sidebar, or press `F`
- Select which habit/task you're working on
- A timer session starts — XP bonus on completion

### 8. Profile & Gamification
- Visit **Profile** to see your XP, level, badges, and themes
- Buy **Streak Freezes** (500 XP each) to protect streaks
- Unlock **color themes** with XP — equip them in Settings

### 9. Weekly Review
- Every Sunday (or any time), visit **Weekly Review** from the sidebar
- Get an adaptive headline + your best/struggling habits
- Share your milestone as an image card

### 10. Dark/Light Mode
- Click the **Sun/Moon toggle** in the sidebar footer
- Preference is saved and persists across sessions

### 11. Backup & Restore
1. Go to **Settings → Data**
2. Click **Export JSON** for a full backup
3. Click **Export CSV** for habit logs in spreadsheet format
4. Use **Import JSON** to restore from a backup file

---

## 📁 Project Structure

```
src/
├── components/
│   ├── common/          # Toast, IconRenderer, shared UI
│   ├── gamification/    # BadgesLibrary, ShareCard, XP components
│   ├── habits/          # LogHabitModal, HabitForm, TemplatesLibrary
│   └── layout/          # Layout, Sidebar, SearchOverlay
├── hooks/
│   └── useKeyboardShortcuts.ts
├── pages/
│   ├── Dashboard.tsx
│   ├── HabitsPage.tsx
│   ├── TasksPage.tsx
│   ├── AnalyticsPage.tsx
│   ├── WeeklyReviewPage.tsx
│   ├── ProfilePage.tsx
│   └── SettingsPage.tsx
├── services/
│   ├── habitService.ts      # Streak calculation, scheduling logic
│   ├── gamificationService.ts
│   ├── notificationService.ts
│   ├── soundService.ts
│   └── moodService.ts
├── store/                   # Zustand stores
│   ├── habitStore.ts
│   ├── taskStore.ts
│   ├── gamificationStore.ts
│   ├── focusStore.ts
│   ├── moodStore.ts
│   └── profileStore.ts
├── db.ts                    # Dexie.js database schema
├── types.ts                 # TypeScript type definitions
└── App.tsx                  # Router + providers
```

---

## 🌐 Deployment

The app is deployed on **Vercel** with automatic deployments on every push to `main`.

**Live URL:** [https://habitflow-murex.vercel.app](https://habitflow-murex.vercel.app)

To deploy your own fork:
1. Fork the repo
2. Import to [Vercel](https://vercel.com)
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. No environment variables needed — fully client-side

---

## 🤝 Contributing

This is a personal project but PRs are welcome! Please:
1. Fork and create a feature branch
2. Run `npm run lint` and `npm run test` before submitting
3. Keep commits clean and descriptive

---

## 📄 License

MIT — free to use, modify, and distribute.

---

<div align="center">
  Made with ❤️ and ☕ by <a href="https://github.com/AdityaPatil2549">Aditya Patil</a>
</div>
