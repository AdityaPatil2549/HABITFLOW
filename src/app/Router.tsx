import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PageSkeleton } from '@/shared/components/PageSkeleton'
import { Layout } from '@/shared/components/Layout'

// Lazy loaded route components
const Dashboard = lazy(async () => {
  const { DashboardPage } = await import('@/features/dashboard/DashboardPage')
  return { default: DashboardPage }
})
const Habits = lazy(async () => {
  const { HabitsPage } = await import('@/features/habits/HabitsPage')
  return { default: HabitsPage }
})
const Tasks = lazy(async () => {
  const { TasksPage } = await import('@/features/tasks/TasksPage')
  return { default: TasksPage }
})
const Analytics = lazy(async () => {
  const { AnalyticsPage } = await import('@/features/analytics/AnalyticsPage')
  return { default: AnalyticsPage }
})
const Settings = lazy(async () => {
  const { SettingsPage } = await import('@/features/settings/SettingsPageFull')
  return { default: SettingsPage }
})
const Calendar = lazy(async () => {
  const { CalendarPage } = await import('@/features/calendar/CalendarPageSimple')
  return { default: CalendarPage }
})

export const Router: React.FC = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  )
}
