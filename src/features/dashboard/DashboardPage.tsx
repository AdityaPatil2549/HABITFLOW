import { motion } from 'framer-motion'
import { Target, CheckSquare, TrendingUp, Award, BarChart3, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { containerVariants, fadeIn } from '@/shared/utils/motionVariants'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'
import { Calendar as CalendarComponent } from '@/shared/components/Calendar'
import { useHabits } from '../habits/hooks/useHabits'
import { useTasks } from '../tasks/hooks/useTasks'
import { useHabitEntries } from '../habits/hooks/useHabits'

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { habits } = useHabits()
  const { tasks } = useTasks()
  const { entries } = useHabitEntries()

  const handleAddHabit = () => {
    navigate('/habits?action=add')
  }

  const handleAddTask = () => {
    navigate('/tasks?action=add')
  }

  const handleViewAnalytics = () => {
    navigate('/analytics')
  }

  const handleViewCalendar = () => {
    navigate('/calendar')
  }

  // Create events for calendar
  const calendarEvents = [
    ...entries.map(entry => ({
      date: entry.date,
      type: 'habit' as const,
      count: 1
    })),
    ...tasks.filter(task => task.dueDate).map(task => ({
      date: task.dueDate!,
      type: 'task' as const,
      count: 1
    }))
  ]

  return (
    <motion.div
      className="container mx-auto px-4 py-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeIn} className="mb-8">
        <h1 className="text-3xl font-bold text-text">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Track your progress and build better habits
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <motion.div variants={fadeIn} className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-text mb-4">Calendar</h2>
          <CalendarComponent
            events={calendarEvents}
            className="w-full"
          />
        </motion.div>

        {/* Quick Stats */}
        <motion.div variants={fadeIn} className="space-y-4">
          <h2 className="text-xl font-semibold text-text mb-4">Quick Stats</h2>
          
          <div className="grid gap-4">
            <motion.div variants={fadeIn} className="rounded-lg border border-border bg-surface p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Habits</p>
                  <p className="mt-2 text-3xl font-bold text-text">{habits.length}</p>
                </div>
                <div className="rounded-full bg-brand-100 p-3 dark:bg-brand-900">
                  <Target className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeIn} className="rounded-lg border border-border bg-surface p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tasks Today</p>
                  <p className="mt-2 text-3xl font-bold text-text">{tasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === new Date().toDateString()).length}</p>
                </div>
                <div className="rounded-full bg-success/10 p-3">
                  <CheckSquare className="h-6 w-6 text-success" />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={fadeIn} className="lg:col-span-3">
          <h2 className="text-xl font-semibold text-text mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Button onClick={handleAddHabit} className="w-full">
              <Target className="mr-2 h-4 w-4" />
              Add Habit
            </Button>
            <Button variant="secondary" onClick={handleAddTask} className="w-full">
              <CheckSquare className="mr-2 h-4 w-4" />
              Add Task
            </Button>
            <Button variant="outline" onClick={handleViewAnalytics} className="w-full">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
            <Button variant="outline" onClick={handleViewCalendar} className="w-full">
              <Calendar className="mr-2 h-4 w-4" />
              View Calendar
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div variants={fadeIn} className="mt-8">
        <h2 className="text-xl font-semibold text-text mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-success/10 p-2">
                <CheckSquare className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="font-medium text-text">Completed Morning Meditation</p>
                <p className="text-sm text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <Badge variant="success">+1 streak</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-brand-100 p-2 dark:bg-brand-900">
                <Target className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="font-medium text-text">New habit created: Read 30 minutes</p>
                <p className="text-sm text-muted-foreground">5 hours ago</p>
              </div>
            </div>
            <Badge variant="primary">New</Badge>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
