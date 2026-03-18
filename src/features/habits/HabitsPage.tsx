import { Button } from '@/shared/components/ui/Button'
import { Plus } from 'lucide-react'
import { SimpleErrorBoundary } from '@/shared/components/SimpleErrorBoundary'

export const HabitsPage: React.FC = () => {
  return (
    <SimpleErrorBoundary>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text">Habits</h1>
            <p className="text-muted-foreground mt-1">Track your daily habits</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Habit
          </Button>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          No habits yet. Click "Add Habit" to get started!
        </div>
      </div>
    </SimpleErrorBoundary>
  )
}
