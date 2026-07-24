# 1. Testing Strategy

HabitFlow requires a rigorous testing strategy to ensure that offline capabilities and complex state interactions do not regress.

## 1.1 Unit Testing
- **Framework:** Vitest + React Testing Library.
- **Scope:** 
  - Pure utility functions (e.g., date calculations, streak algorithms).
  - Isolated UI components (e.g., verifying `IconRenderer` outputs the correct `img` tags and fallbacks).
  - Zustand stores (mocking Dexie to ensure state mutates correctly).

## 1.2 Integration Testing
- **Scope:** Testing the interaction between the React UI, Zustand stores, and the local Dexie database.
- **Example:** Verifying that clicking a habit checkbox correctly increments the XP store, updates the habit log, and inserts a record into the `sync_queue`.

## 1.3 End-to-End (E2E) Browser Testing
- **Framework:** Puppeteer / Playwright.
- **Scope:** Full browser automation to verify critical user journeys across all 9 primary routes.
- **Focus:** Validating that custom CSS (Glassmorphism, Tailwind variables) renders without console errors (e.g., verifying CSP headers allow remote fonts).

---

# 2. DevOps & CI/CD Pipeline

## 2.1 Environments
- **Local Development:** Runs on `localhost:5173` pointing to a local Supabase instance or a staging Supabase project.
- **Production:** Hosted via a modern CDN (e.g., Vercel, Netlify, or Cloudflare Pages) providing edge caching and SSL.

## 2.2 Continuous Integration (CI)
Upon pushing to the `main` branch, the CI pipeline (e.g., GitHub Actions) executes the following jobs:
1. **Linting:** `npm run lint` (ESLint + Prettier).
2. **Type Checking:** `tsc --noEmit`.
3. **Testing:** `vitest run`.
4. **Build:** `vite build` (generates the static HTML/JS/CSS bundle).

## 2.3 Continuous Deployment (CD)
- If the CI pipeline passes, the static build artifact (`/dist`) is automatically deployed to the production CDN.
- The PWA manifest (`vite-plugin-pwa`) handles cache invalidation on the client-side, prompting active users to reload the page to receive the new version without data loss.
