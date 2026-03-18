import { HabitList } from './index'
import { SimpleErrorBoundary } from '@/shared/components/SimpleErrorBoundary'

export const HabitsPage: React.FC = () => {
  return (
    <SimpleErrorBoundary>
      <div className="container mx-auto px-4 py-6">
        <HabitList />
      </div>
    </SimpleErrorBoundary>
  )
}
