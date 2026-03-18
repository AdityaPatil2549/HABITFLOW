import { type FC, useState, useEffect } from 'react'
import { Calendar } from '@/shared/components/Calendar'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { useTasks } from '@/features/tasks/hooks/useTasks'
import { useHabitEntries } from '@/features/habits/hooks/useHabits'
import type { Habit } from '@/features/habits/types'
import type { Task } from '@/features/tasks/types'

export const CalendarPage: FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const { habits } = useHabits()
  const { tasks } = useTasks()
  const { entries } = useHabitEntries()
  
  // Create events for calendar
  const [events, setEvents] = useState<Array<{
    date: Date
    type: 'habit' | 'task'
    count: number
  }>>([])

  useEffect(() => {
    const eventsMap = new Map<string, { habit: number, task: number }>()
    
    // Process habit entries
    entries.forEach(entry => {
      const dateKey = entry.date.toISOString().split('T')[0]
      const existing = eventsMap.get(dateKey) || { habit: 0, task: 0 }
      eventsMap.set(dateKey, { ...existing, habit: existing.habit + 1 })
    })
    
    // Process tasks
    tasks.forEach(task => {
      if (task.dueDate) {
        const dateKey = task.dueDate.toISOString().split('T')[0]
        const existing = eventsMap.get(dateKey) || { habit: 0, task: 0 }
        eventsMap.set(dateKey, { ...existing, task: existing.task + 1 })
      }
    })
    
    // Convert to events array
    const calendarEvents = Array.from(eventsMap.entries()).map(([dateStr, counts]) => ({
      date: new Date(dateStr),
      type: counts.habit > counts.task ? 'habit' : 'task',
      count: counts.habit + counts.task
    }))
    
    setEvents(calendarEvents)
  }, [habits, tasks, entries])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">Calendar</h1>
        <p className="text-muted-foreground">
          View your habits and tasks in calendar format
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            events={events}
          />
        </div>

        {/* Selected Date Details */}
        <div className="space-y-4">
          <div className="bg-surface rounded-lg border border-border p-4">
            <h3 className="text-lg font-semibold text-text mb-3">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            
            <div className="space-y-3">
              {/* Habits for selected date */}
              <div>
                <h4 className="text-sm font-medium text-text mb-2">Habits</h4>
                {entries
                  .filter(entry => entry.date.toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0])
                  .map(entry => {
                    const habit = habits.find(h => h.id === entry.habitId)
                    return habit ? (
                      <div key={entry.id} className="p-2 bg-success/10 rounded border border-success/20">
                        <p className="text-sm font-medium text-text">{habit.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.value > 0 ? 'Completed' : 'Not completed'}
                        </p>
                      </div>
                    ) : null
                  })}
                {entries.filter(entry => entry.date.toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0]).length === 0 && (
                  <p className="text-sm text-muted-foreground">No habits for this date</p>
                )}
              </div>

              {/* Tasks for selected date */}
              <div>
                <h4 className="text-sm font-medium text-text mb-2">Tasks</h4>
                {tasks
                  .filter(task => task.dueDate && task.dueDate.toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0])
                  .map(task => (
                    <div key={task.id} className="p-2 bg-warning/10 rounded border border-warning/20">
                      <p className="text-sm font-medium text-text">{task.title}</p>
                      <p className="text-xs text-muted-foreground">Status: {task.status}</p>
                    </div>
                  ))}
                {tasks.filter(task => task.dueDate && task.dueDate.toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0]).length === 0 && (
                  <p className="text-sm text-muted-foreground">No tasks for this date</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
