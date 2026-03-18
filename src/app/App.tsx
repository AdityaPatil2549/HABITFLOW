import { Suspense } from 'react'
import { Router } from './Router'
import { ThemeProvider } from './providers/ThemeProvider'
import { QueryProvider } from './providers/QueryProvider'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { PageSkeleton } from '@/shared/components/PageSkeleton'

export const App: React.FC = () => {
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
