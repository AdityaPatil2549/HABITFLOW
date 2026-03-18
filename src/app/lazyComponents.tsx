import { lazy, Suspense, type ComponentType } from 'react'
import { PageSkeleton } from '@/shared/components/PageSkeleton'

// Lazy load feature pages for code splitting
export const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'))
export const HabitsPage = lazy(() => import('@/features/habits/HabitsPage'))
export const TasksPage = lazy(() => import('@/features/tasks/TasksPage'))
export const AnalyticsPage = lazy(() => import('@/features/analytics/AnalyticsPage'))
export const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'))

// Lazy load heavy components
export const AnalyticsDashboard = lazy(() => import('@/features/analytics/components/AnalyticsDashboard'))
export const GamificationDashboard = lazy(() => import('@/features/gamification/components/GamificationDashboard'))

// HOC for lazy loading with suspense
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function LazyComponent(props: P) {
    return (
      <Suspense fallback={fallback || <PageSkeleton />}>
        <Component {...props} />
      </Suspense>
    )
  }
}

// Preload function for critical routes
export const preloadRoute = (route: string) => {
  const preloaders: Record<string, () => Promise<void>> = {
    '/': async () => {
      await import('@/features/dashboard/DashboardPage')
    },
    '/habits': async () => {
      await import('@/features/habits/HabitsPage')
    },
    '/tasks': async () => {
      await import('@/features/tasks/TasksPage')
    },
    '/analytics': async () => {
      await import('@/features/analytics/AnalyticsPage')
    },
    '/settings': async () => {
      await import('@/features/settings/SettingsPage')
    },
  }
  
  const preloader = preloaders[route]
  if (preloader) {
    preloader()
  }
}
