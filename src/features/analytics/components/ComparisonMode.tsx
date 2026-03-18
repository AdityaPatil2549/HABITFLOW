import { type FC, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart2, Calendar, ArrowRightLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'
import { cn } from '@/shared/utils/cn'

interface PeriodData {
  label: string
  startDate: string
  endDate: string
  habitsCompleted: number
  totalHabits: number
  tasksCompleted: number
  totalTasks: number
  completionRate: number
  totalPoints: number
  bestStreak: number
  activeDays: number
}

interface ComparisonModeProps {
  className?: string
}

export const ComparisonMode: FC<ComparisonModeProps> = ({ className }) => {
  const [period1, setPeriod1] = useState<PeriodData>({
    label: 'February 2026',
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    habitsCompleted: 156,
    totalHabits: 210,
    tasksCompleted: 42,
    totalTasks: 60,
    completionRate: 74,
    totalPoints: 890,
    bestStreak: 18,
    activeDays: 24,
  })
  
  const [period2, setPeriod2] = useState<PeriodData>({
    label: 'March 2026',
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    habitsCompleted: 189,
    totalHabits: 240,
    tasksCompleted: 58,
    totalTasks: 70,
    completionRate: 79,
    totalPoints: 1120,
    bestStreak: 22,
    activeDays: 28,
  })

  const calculateChange = (current: number, previous: number): { value: number; trend: 'up' | 'down' | 'same' } => {
    const diff = current - previous
    const percentChange = ((diff / previous) * 100)
    
    return {
      value: Math.round(percentChange),
      trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same'
    }
  }

  const comparisonMetrics = [
    {
      label: 'Habit Completion',
      period1Value: period1.habitsCompleted,
      period2Value: period2.habitsCompleted,
      period1Rate: Math.round((period1.habitsCompleted / period1.totalHabits) * 100),
      period2Rate: Math.round((period2.habitsCompleted / period2.totalHabits) * 100),
      unit: 'habits',
    },
    {
      label: 'Task Completion',
      period1Value: period1.tasksCompleted,
      period2Value: period2.tasksCompleted,
      period1Rate: Math.round((period1.tasksCompleted / period1.totalTasks) * 100),
      period2Rate: Math.round((period2.tasksCompleted / period2.totalTasks) * 100),
      unit: 'tasks',
    },
    {
      label: 'Completion Rate',
      period1Value: period1.completionRate,
      period2Value: period2.completionRate,
      period1Rate: period1.completionRate,
      period2Rate: period2.completionRate,
      unit: '%',
    },
    {
      label: 'Points Earned',
      period1Value: period1.totalPoints,
      period2Value: period2.totalPoints,
      period1Rate: period1.totalPoints,
      period2Rate: period2.totalPoints,
      unit: 'pts',
    },
    {
      label: 'Best Streak',
      period1Value: period1.bestStreak,
      period2Value: period2.bestStreak,
      period1Rate: period1.bestStreak,
      period2Rate: period2.bestStreak,
      unit: 'days',
    },
    {
      label: 'Active Days',
      period1Value: period1.activeDays,
      period2Value: period2.activeDays,
      period1Rate: period1.activeDays,
      period2Rate: period2.activeDays,
      unit: 'days',
    },
  ]

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BarChart2 className="h-6 w-6 text-brand-500" />
          <h3 className="text-xl font-bold text-text">Period Comparison</h3>
        </div>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Select Periods
        </Button>
      </div>

      {/* Period Selector */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">Period 1</p>
          <p className="font-semibold text-text">{period1.label}</p>
          <p className="text-xs text-muted-foreground">{period1.startDate} - {period1.endDate}</p>
        </div>
        
        <div className="px-4">
          <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
        </div>
        
        <div className="flex-1 text-right">
          <p className="text-sm text-muted-foreground mb-1">Period 2</p>
          <p className="font-semibold text-text">{period2.label}</p>
          <p className="text-xs text-muted-foreground">{period2.endDate} - {period2.endDate}</p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-3 gap-4">
        {(() => {
          const completionChange = calculateChange(period2.completionRate, period1.completionRate)
          const pointsChange = calculateChange(period2.totalPoints, period1.totalPoints)
          const habitsChange = calculateChange(period2.habitsCompleted, period1.habitsCompleted)
          
          return [
            {
              label: 'Completion Rate',
              value: `${period2.completionRate}%`,
              change: completionChange.value,
              trend: completionChange.trend,
            },
            {
              label: 'Total Points',
              value: period2.totalPoints.toLocaleString(),
              change: pointsChange.value,
              trend: pointsChange.trend,
            },
            {
              label: 'Habits Done',
              value: period2.habitsCompleted.toString(),
              change: habitsChange.value,
              trend: habitsChange.trend,
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-lg border border-border bg-surface text-center"
            >
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-text">{stat.value}</p>
              <div className="flex items-center justify-center space-x-1 mt-1">
                {stat.trend === 'up' && <TrendingUp className="h-3 w-3 text-success" />}
                {stat.trend === 'down' && <TrendingDown className="h-3 w-3 text-danger" />}
                {stat.trend === 'same' && <Minus className="h-3 w-3 text-muted-foreground" />}
                <span
                  className={cn(
                    'text-xs font-medium',
                    stat.trend === 'up' && 'text-success',
                    stat.trend === 'down' && 'text-danger',
                    stat.trend === 'same' && 'text-muted-foreground'
                  )}
                >
                  {stat.change > 0 ? '+' : ''}{stat.change}%
                </span>
              </div>
            </motion.div>
          ))
        })()}
      </div>

      {/* Detailed Comparison */}
      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted">
          <h4 className="font-medium text-text">Detailed Metrics</h4>
        </div>
        
        <div className="divide-y divide-border">
          {comparisonMetrics.map((metric, index) => {
            const change = calculateChange(metric.period2Value, metric.period1Value)
            
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="px-4 py-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="font-medium text-text">{metric.label}</p>
                </div>
                
                <div className="flex items-center space-x-8">
                  {/* Period 1 */}
                  <div className="text-right w-24">
                    <p className="font-semibold text-text">
                      {metric.period1Value}
                      <span className="text-xs text-muted-foreground ml-1">{metric.unit}</span>
                    </p>
                  </div>
                  
                  {/* Change Indicator */}
                  <div className="w-20 flex items-center justify-center">
                    <Badge
                      variant={change.trend === 'up' ? 'success' : change.trend === 'down' ? 'danger' : 'secondary'}
                      size="sm"
                    >
                      {change.trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                      {change.trend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
                      {change.trend === 'same' && <Minus className="h-3 w-3 mr-1" />}
                      {Math.abs(change.value)}%
                    </Badge>
                  </div>
                  
                  {/* Period 2 */}
                  <div className="text-right w-24">
                    <p className="font-semibold text-text">
                      {metric.period2Value}
                      <span className="text-xs text-muted-foreground ml-1">{metric.unit}</span>
                    </p>
                    <p className={cn(
                      'text-xs',
                      change.trend === 'up' ? 'text-success' : change.trend === 'down' ? 'text-danger' : 'text-muted-foreground'
                    )}>
                      {change.value > 0 ? '+' : ''}{metric.period2Value - metric.period1Value} {metric.unit}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Insights */}
      <div className="p-4 rounded-lg bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800">
        <h4 className="font-medium text-brand-700 dark:text-brand-300 mb-2">
          Period Analysis
        </h4>
        <ul className="space-y-2 text-sm text-brand-600 dark:text-brand-400">
          <li className="flex items-start space-x-2">
            <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Your completion rate improved by 5% compared to last month</span>
          </li>
          <li className="flex items-start space-x-2">
            <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>You earned 26% more points this period</span>
          </li>
          <li className="flex items-start space-x-2">
            <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Best streak increased from 18 to 22 days</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
