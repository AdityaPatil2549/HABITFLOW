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
import './index.css';

function App() {
  const { show: showOnboarding, complete: completeOnboarding } = useOnboarding();

  useEffect(() => {
    getOrCreateSettings().then(settings => {
      const root = document.documentElement;
      if (settings.darkMode) {
        root.classList.toggle('light', settings.darkMode === 'light');
      }
      if (settings.theme) {
        if (settings.theme === 'indigo') root.removeAttribute('data-theme');
        else root.setAttribute('data-theme', settings.theme);
      }
      soundService.setEnabled(
        settings.soundEnabled !== false,
        settings.hapticEnabled !== false
      );
    });
  }, []);

  useEffect(() => {
    notificationService.start();
    return () => notificationService.stop();
  }, []);

  async function handleOnboardingComplete() {
    await gamificationService.addXP(10);
    completeOnboarding();
  }

  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center text-[var(--text-muted)]">
            Loading...
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="habits" element={<HabitsPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="review" element={<WeeklyReviewPage />} />
          </Route>
        </Routes>
      </Suspense>
      <ReloadPrompt />
      <FocusOverlay />
      <ToastProvider />
      {showOnboarding && <OnboardingWizard onComplete={handleOnboardingComplete} />}
    </BrowserRouter>
  );
}

export default App;
