import { TaskList } from './index'
import { Button } from '@/shared/components/ui/Button'
import { Plus } from 'lucide-react'

export const TasksPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text">Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage your tasks</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>
      <TaskList />
    </div>
  )
}
