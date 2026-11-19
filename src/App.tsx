import './index.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { format } from 'date-fns';
import { Layout } from './components/layout/Layout';
import { notificationService } from './services/notificationService';
import { soundService } from './services/soundService';
import { Dashboard } from './pages/Dashboard';
import { ReloadPrompt } from './components/layout/ReloadPrompt';
import { FocusOverlay } from './components/focus/FocusOverlay';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { useOnboarding } from './components/onboarding/useOnboarding';
import { ToastProvider } from './components/common/Toast';
import { getOrCreateSettings, getOrCreateUserXP } from './db';
import { applyAppearanceToDocument, resolvePolarityMode, resolveTelemetryMode } from './lib/theme';
import { calculateStats } from './services/gamificationService';
import { gamificationService } from './services/gamificationService';
import { ScrollToTop } from './components/ui/ScrollToTop';
import { useModalStore } from './store/modalStore';
import { QuickAddModalFixed } from './components/habits/QuickAddModalFixed';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useAuthStore } from './store/authStore';
import { syncService } from './services/syncService';
import { migrateLocalDataToCloud } from './services/migrationService';
import { pushNotificationService } from './services/pushNotificationService';
import { startHealthSyncPolling } from './services/healthSyncService';
import { analyticsService } from './services/analyticsService';
import { remoteConfigService } from './services/remoteConfigService';
import { crashlyticsService } from './services/crashlyticsService';
import { mlService } from './services/mlService';
import { useHabitStore } from './store/habitStore';
import { useTaskStore } from './store/taskStore';
import { useMoodStore } from './store/moodStore';

const HabitsPage = lazy(() => import('./pages/HabitsPage').then(m => ({ default: m.HabitsPage })));
const TasksPage = lazy(() => import('./pages/TasksPage').then(m => ({ default: m.TasksPage })));
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage }))
);
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage }))
);
const InsightsPage = lazy(() =>
  import('./pages/InsightsPage').then(m => ({ default: m.InsightsPage }))
);
const HubPage = lazy(() =>
  import('./pages/HubPage').then(m => ({ default: m.HubPage }))
);
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })));
const ShopPage = lazy(() => import('./pages/ShopPage').then(m => ({ default: m.ShopPage })));
const SquadPage = lazy(() => import('./pages/SquadPage').then(m => ({ default: m.SquadPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));

function App() {
  const { show: showOnboarding, complete: completeOnboarding } = useOnboarding();
  const { initialize: initAuth, user, isGuest } = useAuthStore();

  // Initialize Firebase auth and Remote Config on app boot
  useEffect(() => {
    initAuth();
    remoteConfigService.init().catch(console.warn);
    crashlyticsService.init();
    mlService.init().catch(console.warn);
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
      migrateLocalDataToCloud(user.uid).catch(console.error);
      // Start auto-sync
      syncService.startAutoSync();
      // Initialize Web Push Notifications (FCM)
      pushNotificationService.initialize();
      // Track sign-in event
      analyticsService.trackSignIn('google');
    } else {
      syncService.stopAutoSync();
    }

    return () => syncService.stopAutoSync();
  }, [user, isGuest]);

  useEffect(() => {
    let cleanupSystemListener: (() => void) | undefined;

    const syncAppearance = async () => {
      const [settings, xp] = await Promise.all([getOrCreateSettings(), getOrCreateUserXP()]);
      const polarity = resolvePolarityMode(settings);
      const numericLevel = calculateStats(xp.total).numericLevel;
      const telemetryMode = resolveTelemetryMode(settings, numericLevel);
      applyAppearanceToDocument(polarity, settings.theme);
      soundService.setEnabled(settings.soundEnabled !== false, settings.hapticEnabled !== false);
      soundService.setTelemetryMode(telemetryMode);

      cleanupSystemListener?.();
      cleanupSystemListener = undefined;

      if (polarity === 'system' && typeof window !== 'undefined' && window.matchMedia) {
        const mq = window.matchMedia('(prefers-color-scheme: light)');
        const onChange = () => applyAppearanceToDocument('system', settings.theme);
        mq.addEventListener?.('change', onChange);
        cleanupSystemListener = () => mq.removeEventListener?.('change', onChange);
      }
    };

    syncAppearance();
    window.addEventListener('habitflow-appearance-changed', syncAppearance);

    return () => {
      window.removeEventListener('habitflow-appearance-changed', syncAppearance);
      cleanupSystemListener?.();
    };
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

  // Midnight rollover & window focus listener to keep selectedDate accurate
  useEffect(() => {
    const checkDateRollover = () => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const currentSelected = useHabitStore.getState().selectedDate;
      if (currentSelected !== todayStr) {
        useHabitStore.getState().setSelectedDate(todayStr);
        useHabitStore.getState().loadHabits();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkDateRollover();
      }
    };

    const interval = setInterval(checkDateRollover, 60000);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', checkDateRollover);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', checkDateRollover);
    };
  }, []);

  async function handleOnboardingComplete() {
    await gamificationService.addXP(100);
    completeOnboarding();
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="min-h-[100dvh] flex items-center justify-center text-[var(--text-muted)]">
              Loading...
            </div>
          }
        >
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="habits" element={<HabitsPage />} />
              <Route path="habits/:id" element={<HabitsPage />} />
              <Route path="insights" element={<InsightsPage />} />
              <Route path="hub" element={<HubPage />} />
              <Route path="hub/profile" element={<ProfilePage />} />
              <Route path="hub/shop" element={<ShopPage />} />
              <Route path="hub/squad" element={<SquadPage />} />
              <Route path="hub/tasks" element={<TasksPage />} />
              <Route path="hub/settings" element={<SettingsPage />} />
              <Route path="privacy" element={<PrivacyPage />} />
              <Route path="terms" element={<TermsPage />} />
              {/* Backward-compatible route redirects */}
              <Route path="dashboard" element={<Navigate to="/" replace />} />
              <Route path="analytics" element={<Navigate to="/insights" replace />} />
              <Route path="review" element={<Navigate to="/insights?tab=review" replace />} />
              <Route path="profile" element={<Navigate to="/hub/profile" replace />} />
              <Route path="shop" element={<Navigate to="/hub/shop" replace />} />
              <Route path="squad" element={<Navigate to="/hub/squad" replace />} />
              <Route path="tasks" element={<Navigate to="/hub/tasks" replace />} />
              <Route path="settings" element={<Navigate to="/hub/settings" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
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
