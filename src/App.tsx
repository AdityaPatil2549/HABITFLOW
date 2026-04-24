import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { Layout } from './components/layout/Layout';
import { notificationService } from './services/notificationService';
import { Dashboard } from './pages/Dashboard';
import { ReloadPrompt } from './components/layout/ReloadPrompt';
import { getOrCreateSettings } from './db';

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
import './index.css';

function App() {
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
    });
  }, []);

  // Start the notification service daemon
  useEffect(() => {
    notificationService.start();
    return () => notificationService.stop();
  }, []);

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
          </Route>
        </Routes>
      </Suspense>
      <ReloadPrompt />
    </BrowserRouter>
  );
}

export default App;
