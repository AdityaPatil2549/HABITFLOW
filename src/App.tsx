import './index.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { Layout } from './components/layout/Layout';
import { notificationService } from './services/notificationService';
import { soundService } from './services/soundService';
import { Dashboard } from './pages/Dashboard';
import { ReloadPrompt } from './components/layout/ReloadPrompt';
import { FocusOverlay } from './components/focus/FocusOverlay';
import { OnboardingWizard, useOnboarding } from './components/onboarding/OnboardingWizard';
import { ToastProvider } from './components/common/Toast';
import { getOrCreateSettings } from './db';
import { gamificationService } from './services/gamificationService';
import { useModalStore } from './store/modalStore';
import { QuickAddModalFixed } from './components/habits/QuickAddModalFixed';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useAuthStore } from './store/authStore';
import { syncService } from './services/syncService';
import { migrateLocalDataToCloud } from './services/migrationService';
import { pushNotificationService } from './services/pushNotificationService';
import { startHealthSyncPolling } from './services/healthSyncService';
import { useHabitStore } from './store/habitStore';
import { useTaskStore } from './store/taskStore';
import { useMoodStore } from './store/moodStore';

const HabitsPage = lazy(() => import('./pages/HabitsPage').then(m => ({ default: m.HabitsPage })));
const TasksPage = lazy(() => import('./pages/TasksPage').then(m => ({ default: m.TasksPage })));
const AnalyticsPage = lazy(() =>
  import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage }))
);
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage }))
);
const WeeklyReviewPage = lazy(() =>
  import('./pages/WeeklyReviewPage').then(m => ({ default: m.WeeklyReviewPage }))
);
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })));
const ShopPage = lazy(() => import('./pages/ShopPage').then(m => ({ default: m.ShopPage })));
const SquadPage = lazy(() => import('./pages/SquadPage').then(m => ({ default: m.SquadPage })));
const GardenPage = lazy(() => import('./pages/GardenPage').then(m => ({ default: m.GardenPage })));

function App() {
  const { show: showOnboarding, complete: completeOnboarding } = useOnboarding();
  const { initialize: initAuth, user, isGuest } = useAuthStore();

  // Initialize Supabase auth on app boot
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Health sync polling — only starts if the user has opted in via Settings
  useEffect(() => {
    getOrCreateSettings().then(settings => {
      if (settings.healthSyncEnabled) {
        startHealthSyncPolling();
      }
    });
  }, []);

  // Start/stop sync engine based on auth state
  useEffect(() => {
    if (user && !isGuest) {
      // Migrate local data to cloud (idempotent — runs once per user)
      migrateLocalDataToCloud(user.id).catch(console.error);
      // Start auto-sync
      syncService.startAutoSync();
    } else {
      syncService.stopAutoSync();
    }

    // Initialize Web Push Notifications
    pushNotificationService.initialize();

    return () => syncService.stopAutoSync();
  }, [user, isGuest]);

  useEffect(() => {
    getOrCreateSettings().then(settings => {
      const root = document.documentElement;
      if (settings.darkMode === 'light') {
        root.classList.add('light');
      } else if (settings.darkMode === 'system') {
        const preferLight = window.matchMedia('(prefers-color-scheme: light)').matches;
        root.classList.toggle('light', preferLight);
      } else {
        root.classList.remove('light');
      }
      if (settings.theme) {
        if (settings.theme === 'indigo') root.removeAttribute('data-theme');
        else root.setAttribute('data-theme', settings.theme);
      }
      soundService.setEnabled(settings.soundEnabled !== false, settings.hapticEnabled !== false);
    });
  }, []);

  useEffect(() => {
    notificationService.start();
    return () => notificationService.stop();
  }, []);

  // Listen for sync events to reload the UI when background changes arrive
  useEffect(() => {
    const handleSync = () => {
      useHabitStore.getState().loadHabits();
      useTaskStore.getState().loadTasks();
      useMoodStore.getState().loadMoods();
    };
    window.addEventListener('habitflow-sync-pulled', handleSync);
    return () => window.removeEventListener('habitflow-sync-pulled', handleSync);
  }, []);

  async function handleOnboardingComplete() {
    await gamificationService.addXP(10);
    completeOnboarding();
  }

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center text-[var(--text-muted)]">
              Loading...
            </div>
          }
        >
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="habits" element={<HabitsPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="review" element={<WeeklyReviewPage />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="squad" element={<SquadPage />} />
              <Route path="garden" element={<GardenPage />} />
            </Route>
          </Routes>
        </Suspense>
        <ModalContainer />
      </ErrorBoundary>
      <ReloadPrompt />
      <FocusOverlay />
      <ToastProvider />
      {showOnboarding && <OnboardingWizard onComplete={handleOnboardingComplete} />}
    </BrowserRouter>
  );
}

/**
 * ModalContainer renders QuickAddModalFixed directly into the React tree.
 * No createPortal needed — the native <dialog> element uses showModal() to
 * place itself in the browser's top layer automatically.
 */
function ModalContainer() {
  const quickAddOpen = useModalStore(s => s.quickAddOpen);
  if (!quickAddOpen) return null;
  return <QuickAddModalFixed onClose={() => useModalStore.getState().setQuickAddOpen(false)} />;
}

export default App;
