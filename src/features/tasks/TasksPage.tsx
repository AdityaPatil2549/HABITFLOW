import { TaskList } from './index'
import { SimpleErrorBoundary } from '@/shared/components/SimpleErrorBoundary'

export const TasksPage: React.FC = () => {
  return (
    <SimpleErrorBoundary>
      <div className="container mx-auto px-4 py-6">
        <TaskList />
      </div>
    </SimpleErrorBoundary>
  )
}
