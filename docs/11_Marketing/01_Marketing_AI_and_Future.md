# 1. Branding & Marketing Strategy

## 1.1 Brand Identity
- **Name:** HabitFlow
- **Voice:** Encouraging, modern, sophisticated, and slightly playful (video game undertones without the childish aesthetic).
- **Keywords:** Offline-First, Privacy, Gamification, Glassmorphism, Productivity Operating System.

## 1.2 Target SEO Strategy
- Long-tail keywords focusing on the intersection of ADHD and productivity (e.g., "Best ADHD task manager with gamification").
- Keywords targeting users burned out by existing SaaS constraints (e.g., "Offline-first habit tracker," "Habit tracker with no subscription").

---

# 2. AI System Design

HabitFlow leverages on-device AI algorithms (and eventual cloud LLM integrations) to provide personalized coaching without violating user privacy.

## 2.1 Correlation Engine (Local)
The app runs a statistical analysis algorithm against the local Dexie database to calculate Pearson correlation coefficients between boolean habit completions and scalar mood ratings (1-5).
- **Privacy:** This data never leaves the device. The insights are generated purely via client-side JavaScript.
- **Output:** Intelligent tooltips on the Analytics dashboard.

## 2.2 Future Cloud AI (Opt-in)
For users who opt-in, anonymized weekly summaries can be pushed to a specialized prompt endpoint.
- **Prompt Architecture:** "You are a highly empathetic productivity coach. Analyze the following 7-day completion matrix and mood scores to provide a single, actionable tip."
- **Retrieval:** Insights are stored in the `ai_insights` table and presented natively within the app as "Weekly Coaching Briefs."

---

# 3. Feature Backlog (Future Architecture)

As HabitFlow scales, the following technical and product features are prioritized for development:

## 3.1 Social Accountability (Squads v2)
- Real-time presence indicators via Supabase WebSockets (e.g., "John is currently in a Focus Session").
- Multiplayer live task-list sharing.

## 3.2 Advanced Analytics
- Year-in-Pixel generation for mood logs.
- GitHub-style contribution heatmaps.

## 3.3 Platform Expansions
- Standalone Electron/Tauri desktop wrappers for global keyboard shortcut support.
- Native React Native application utilizing SQLite instead of Dexie for local storage, connecting to the exact same Supabase backend.
