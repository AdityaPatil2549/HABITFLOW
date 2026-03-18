import { type FC, useState, useEffect } from 'react'
import { Calendar } from '@/shared/components/Calendar'
import { useTasks } from '@/features/tasks/hooks/useTasks'

export const CalendarPage: FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const { tasks } = useTasks()
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  // Get tasks due on selected date
  const tasksDueOnSelectedDate = tasks.filter(task => {
    if (!task.dueDate) return false
    const dueDate = new Date(task.dueDate)
    const selectedDateStr = date.toISOString().split('T')[0]
    const dueDateStr = dueDate.toISOString().split('T')[0]
    return selectedDateStr === dueDateStr
  })

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">Calendar</h1>
        <p className="text-muted-foreground">
          View your habits and tasks in calendar format
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Calendar */}
        <div>
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            events={[]}
          />
        </div>

        {/* Tasks due on selected date */}
        <div>
          <h2 className="text-xl font-semibold text-text mb-4">
            Tasks Due on {selectedDate.toLocaleDateString()}
          </h2>
          {tasksDueOnSelectedDate.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No tasks due on this date
            </p>
          ) : (
            <div className="space-y-3">
              {tasksDueOnSelectedDate.map(task => (
                <div key={task.id} className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-text">{task.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Status: {task.status} | Priority: {task.priority}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {task.dueDate && new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {task.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
