import { type FC } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Clock, Calendar, TrendingUp, Target } from 'lucide-react'
import { useMemo } from 'react'

interface ProductivityInsightsProps {
  className?: string
}

export const ProductivityInsights: FC<ProductivityInsightsProps> = ({ className }) => {
  // Mock insights data - in real app this would be calculated from actual data
  const insights = useMemo(() => ({
    bestTimeOfDay: {
      hour: '9:00 AM',
      completionRate: 85,
    },
    bestDayOfWeek: {
      day: 'Tuesday',
      completionRate: 78,
    },
    worstDayOfWeek: {
      day: 'Sunday',
      completionRate: 45,
    },
    mostConsistentHabit: 'Drink Water',
    streakTrend: 'improving', // improving, stable, declining
    weeklyAverage: 68,
    monthlyImprovement: 12,
    productiveHours: [
      { hour: '6AM', productivity: 30 },
      { hour: '9AM', productivity: 85 },
      { hour: '12PM', productivity: 65 },
      { hour: '3PM', productivity: 70 },
      { hour: '6PM', productivity: 55 },
      { hour: '9PM', productivity: 40 },
    ],
    dayPerformance: [
      { day: 'Mon', rate: 72 },
      { day: 'Tue', rate: 78 },
      { day: 'Wed', rate: 75 },
      { day: 'Thu', rate: 70 },
      { day: 'Fri', rate: 65 },
      { day: 'Sat', rate: 50 },
      { day: 'Sun', rate: 45 },
    ],
  }), [])

  const getBarHeight = (value: number) => `${(value / 100) * 100}px`

  return (
    <div className={className}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Best Time */}
        <div className="p-4 rounded-lg bg-surface border border-border">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="h-5 w-5 text-brand-500" />
            <span className="text-sm text-muted-foreground">Best Time</span>
          </div>
          <p className="text-2xl font-bold text-text">{insights.bestTimeOfDay.hour}</p>
          <p className="text-sm text-success">{insights.bestTimeOfDay.completionRate}% completion</p>
        </div>

        {/* Best Day */}
        <div className="p-4 rounded-lg bg-surface border border-border">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="h-5 w-5 text-success" />
            <span className="text-sm text-muted-foreground">Best Day</span>
          </div>
          <p className="text-2xl font-bold text-text">{insights.bestDayOfWeek.day}</p>
          <p className="text-sm text-success">{insights.bestDayOfWeek.completionRate}% completion</p>
        </div>

        {/* Weekly Average */}
        <div className="p-4 rounded-lg bg-surface border border-border">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="h-5 w-5 text-warning" />
            <span className="text-sm text-muted-foreground">Weekly Avg</span>
          </div>
          <p className="text-2xl font-bold text-text">{insights.weeklyAverage}%</p>
          <p className="text-sm text-muted-foreground">Completion rate</p>
        </div>

        {/* Improvement */}
        <div className="p-4 rounded-lg bg-surface border border-border">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-5 w-5 text-info" />
            <span className="text-sm text-muted-foreground">vs Last Month</span>
          </div>
          <p className="text-2xl font-bold text-success">+{insights.monthlyImprovement}%</p>
          <p className="text-sm text-muted-foreground">Improvement</p>
        </div>
      </div>

      {/* Productivity by Hour */}
      <div className="p-4 rounded-lg bg-surface border border-border mb-6">
        <h4 className="font-medium text-text mb-4 flex items-center space-x-2">
          <Clock className="h-4 w-4" />
          <span>Productivity by Hour</span>
        </h4>
        <div className="flex items-end justify-between h-32 px-2">
          {insights.productiveHours.map((hour) => (
            <div key={hour.hour} className="flex flex-col items-center space-y-2 flex-1">
              <motion.div
                className="w-full max-w-[40px] bg-brand-500 rounded-t"
                style={{ height: getBarHeight(hour.productivity) }}
                initial={{ height: 0 }}
                animate={{ height: getBarHeight(hour.productivity) }}
                transition={{ duration: 0.5, delay: 0.1 }}
              />
              <span className="text-xs text-muted-foreground">{hour.hour}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day Performance */}
      <div className="p-4 rounded-lg bg-surface border border-border">
        <h4 className="font-medium text-text mb-4 flex items-center space-x-2">
          <Calendar className="h-4 w-4" />
          <span>Performance by Day</span>
        </h4>
        <div className="flex items-end justify-between h-32 px-2">
          {insights.dayPerformance.map((day) => (
            <div key={day.day} className="flex flex-col items-center space-y-2 flex-1">
              <motion.div
                className={cn(
                  'w-full max-w-[40px] rounded-t',
                  day.rate >= 70 ? 'bg-success' : day.rate >= 50 ? 'bg-warning' : 'bg-danger'
                )}
                style={{ height: getBarHeight(day.rate) }}
                initial={{ height: 0 }}
                animate={{ height: getBarHeight(day.rate) }}
                transition={{ duration: 0.5, delay: 0.1 }}
              />
              <span className="text-xs text-muted-foreground">{day.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Consistency Tip */}
      <div className="mt-6 p-4 rounded-lg bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800">
        <div className="flex items-start space-x-3">
          <Target className="h-5 w-5 text-brand-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-brand-700 dark:text-brand-300">Insight</h4>
            <p className="text-sm text-brand-600 dark:text-brand-400 mt-1">
              You're most productive on {insights.bestDayOfWeek.day}s at {insights.bestTimeOfDay.hour}. 
              Try scheduling your most important habits during this time for better success rates.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
