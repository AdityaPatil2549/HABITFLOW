import { type FC } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Target, CheckSquare, Flame, BarChart3, PieChart } from 'lucide-react'
import { containerVariants } from '@/shared/utils/motionVariants'
import { cn } from '@/shared/utils/cn'
import { CompletionChart } from './CompletionChart'
import { CategoryChart } from './CategoryChart'
import { StreakChart } from './StreakChart'
import { 
  useHabitCompletionData, 
  useHabitCategoryData, 
  useStreakData,
  useTaskAnalyticsData 
} from '../hooks/useAnalytics'

interface AnalyticsDashboardProps {
  className?: string
}

export const AnalyticsDashboard: FC<AnalyticsDashboardProps> = ({ className }) => {
  const { data: completionData, isLoading: completionLoading } = useHabitCompletionData(30)
  const { data: categoryData, isLoading: categoryLoading } = useHabitCategoryData()
  const { data: streakData, isLoading: streakLoading } = useStreakData()
  const { data: taskData, isLoading: taskLoading } = useTaskAnalyticsData()

  // Calculate overall stats
  const avgCompletionRate = completionData.length > 0
    ? completionData.reduce((sum, day) => sum + day.completionRate, 0) / completionData.length
    : 0

  const currentStreak = streakData.find(d => d.range === '31+')?.count || 
                       streakData.find(d => d.range === '8-30')?.count || 
                       streakData.find(d => d.range === '1-7')?.count || 0

  return (
    <motion.div
      className={cn('space-y-6', className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-text">Analytics</h2>
        <p className="text-muted-foreground">
          Track your progress and insights
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Completion</p>
              <p className="mt-2 text-3xl font-bold text-text">
                {Math.round(avgCompletionRate)}%
              </p>
            </div>
            <div className="rounded-full bg-brand-100 p-3 dark:bg-brand-900">
              <TrendingUp className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Habits</p>
              <p className="mt-2 text-3xl font-bold text-text">
                {categoryData.reduce((sum, cat) => sum + cat.count, 0)}
              </p>
            </div>
            <div className="rounded-full bg-success/10 p-3">
              <Target className="h-6 w-6 text-success" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Streaks</p>
              <p className="mt-2 text-3xl font-bold text-text">{currentStreak}</p>
            </div>
            <div className="rounded-full bg-warning/10 p-3">
              <Flame className="h-6 w-6 text-warning" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tasks Completed</p>
              <p className="mt-2 text-3xl font-bold text-text">{taskData.monthCompleted}</p>
            </div>
            <div className="rounded-full bg-info/10 p-3">
              <CheckSquare className="h-6 w-6 text-info" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Completion Trend */}
        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text">30-Day Completion Trend</h3>
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </div>
          {completionLoading ? (
            <div className="h-64 bg-muted rounded animate-pulse" />
          ) : (
            <CompletionChart data={completionData} height={250} />
          )}
        </div>

        {/* Category Distribution */}
        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text">Habit Categories</h3>
            <PieChart className="h-5 w-5 text-muted-foreground" />
          </div>
          {categoryLoading ? (
            <div className="h-64 bg-muted rounded animate-pulse" />
          ) : (
            <CategoryChart data={categoryData} height={250} />
          )}
        </div>

        {/* Streak Distribution */}
        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text">Streak Distribution</h3>
            <Flame className="h-5 w-5 text-muted-foreground" />
          </div>
          {streakLoading ? (
            <div className="h-64 bg-muted rounded animate-pulse" />
          ) : (
            <StreakChart data={streakData} height={250} />
          )}
        </div>

        {/* Task Analytics */}
        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text">Task Analytics</h3>
            <CheckSquare className="h-5 w-5 text-muted-foreground" />
          </div>
          {taskLoading ? (
            <div className="h-64 bg-muted rounded animate-pulse" />
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Tasks</span>
                <span className="font-semibold">{taskData.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Completed This Month</span>
                <span className="font-semibold text-success">{taskData.monthCompleted}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Due Today</span>
                <span className="font-semibold text-warning">{taskData.dueToday}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Overdue</span>
                <span className="font-semibold text-danger">{taskData.overdue}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Monthly Completion Rate</span>
                <span className="font-semibold">{Math.round(taskData.monthCompletionRate)}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
