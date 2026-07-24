# Team Structure & Operations

## 1. Core Roles

### 1.1 Product & Design
- **Product Manager:** Defines the roadmap, prioritizes features (e.g., Squads vs. AI Coach), and conducts user interviews.
- **UX/UI Designer:** Owns the Glassmorphism design system. Ensures the app remains aesthetically stunning and highly usable.

### 1.2 Engineering
- **Frontend Engineer (React/WebGL):** Focuses on the complex UI interactions, Framer Motion animations, and React Three Fiber rendering.
- **Backend/Data Engineer:** Manages the Supabase infrastructure, IndexedDB synchronization logic, and database migrations.
- **AI Engineer:** Tunes the AI Coach prompts, evaluates model performance, and builds the pipeline for local WebGPU inference.

## 2. Agile Methodology
- **Sprints:** 2-week cycles.
- **Tools:** Linear for issue tracking, GitHub for version control, Figma for design.
- **Meetings:** 
  - Daily asynchronous standups via Slack.
  - Bi-weekly sprint planning and retro.

## 3. Onboarding
New team members must:
1. Read the `00_Project_Charter` and `01_Vision_Document`.
2. Familiarize themselves with the `docs/` hierarchy.
3. Understand the core principles of Offline-First Architecture (Dexie.js) and the Glassmorphism Design System before committing any code.
