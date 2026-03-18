import { Suspense, useEffect } from 'react'
import { Router } from './Router'
import { ThemeProvider } from './providers/ThemeProvider'
import { QueryProvider } from './providers/QueryProvider'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { PageSkeleton } from '@/shared/components/PageSkeleton'
import { seedDatabase } from '@/db/seed'

export const App: React.FC = () => {
  useEffect(() => {
    // Seed database with sample data on first load
    seedDatabase().catch(console.error)
  }, [])

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryProvider>
          <Suspense fallback={<PageSkeleton />}>
            <Router />
          </Suspense>
        </QueryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
