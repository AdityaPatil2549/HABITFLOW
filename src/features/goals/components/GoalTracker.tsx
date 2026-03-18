import { type FC } from 'react'
import { motion } from 'framer-motion'
import { Target, Calendar, TrendingUp, Award, Clock, Zap } from 'lucide-react'
import { Progress } from '@/shared/components/ui/Progress'
import { Badge } from '@/shared/components/ui/Badge'
import { cn } from '@/shared/utils/cn'

interface Goal {
  id: string
  title: string
  description: string
  category: 'habit' | 'task' | 'achievement'
  target: number
  current: number
  unit: string
  deadline: string
  color: string
}

interface GoalTrackerProps {
  className?: string
}

export const GoalTracker: FC<GoalTrackerProps> = ({ className }) => {
  // Mock goals data
  const goals: Goal[] = [
    {
      id: '1',
      title: 'Read 12 Books This Year',
      description: 'One book per month',
      category: 'habit',
      target: 12,
      current: 3,
      unit: 'books',
      deadline: '2026-12-31',
      color: '#8B5CF6',
    },
    {
      id: '2',
      title: 'Exercise 150 Times',
      description: 'About 3 times per week',
      category: 'habit',
      target: 150,
      current: 42,
      unit: 'workouts',
      deadline: '2026-12-31',
      color: '#F59E0B',
    },
    {
      id: '3',
      title: 'Complete 500 Tasks',
      description: 'Stay productive throughout the year',
      category: 'task',
      target: 500,
      current: 127,
      unit: 'tasks',
      deadline: '2026-12-31',
      color: '#10B981',
    },
    {
      id: '4',
      title: '30-Day Meditation Streak',
      description: 'Build a consistent meditation practice',
      category: 'achievement',
      target: 30,
      current: 12,
      unit: 'days',
      deadline: '2026-04-18',
      color: '#0EA5E9',
    },
  ]

  const getCategoryIcon = (category: Goal['category']) => {
    switch (category) {
      case 'habit':
        return <Target className="h-4 w-4" />
      case 'task':
        return <Clock className="h-4 w-4" />
      case 'achievement':
        return <Award className="h-4 w-4" />
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text">Goals</h3>
        <Badge variant="secondary">{goals.length} Active</Badge>
      </div>

      <div className="grid gap-4">
        {goals.map((goal) => {
          const progress = (goal.current / goal.target) * 100
          const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

          return (
            <motion.div
              key={goal.id}
              className="rounded-lg border border-border bg-surface p-4"
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: goal.color }}
                  >
                    {getCategoryIcon(goal.category)}
                  </div>
                  <div>
                    <h4 className="font-medium text-text">{goal.title}</h4>
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  </div>
                </div>
                <Badge variant="outline" size="sm">
                  {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-text">
                    {goal.current} / {goal.target} {goal.unit}
                  </span>
                </div>
                <div className="relative">
                  <Progress value={progress} color="primary" />
                  <span className="absolute right-0 -top-5 text-xs font-medium text-brand-500">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>On track</span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Due {new Date(goal.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
                <Zap className="h-4 w-4 text-warning" />
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
