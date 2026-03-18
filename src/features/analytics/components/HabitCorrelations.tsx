import { type FC } from 'react'
import { motion } from 'framer-motion'
import { GitCommit, ArrowRight, CheckCircle, XCircle, Minus } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

interface HabitCorrelation {
  habit1: {
    id: string
    name: string
    color: string
  }
  habit2: {
    id: string
    name: string
    color: string
  }
  correlation: number // -1 to 1
  strength: 'strong' | 'moderate' | 'weak'
  type: 'positive' | 'negative' | 'neutral'
  description: string
}

interface HabitCorrelationsProps {
  className?: string
}

export const HabitCorrelations: FC<HabitCorrelationsProps> = ({ className }) => {
  // Mock correlation data
  const correlations: HabitCorrelation[] = [
    {
      habit1: { id: '1', name: 'Early Sleep', color: '#6366F1' },
      habit2: { id: '2', name: 'Morning Exercise', color: '#F59E0B' },
      correlation: 0.78,
      strength: 'strong',
      type: 'positive',
      description: 'Going to bed early strongly correlates with morning workouts',
    },
    {
      habit1: { id: '3', name: 'Meditation', color: '#10B981' },
      habit2: { id: '4', name: 'Deep Work', color: '#F97316' },
      correlation: 0.65,
      strength: 'moderate',
      type: 'positive',
      description: 'Meditation helps improve focus during work sessions',
    },
    {
      habit1: { id: '5', name: 'Drink Water', color: '#0EA5E9' },
      habit2: { id: '6', name: 'Healthy Eating', color: '#EF4444' },
      correlation: 0.52,
      strength: 'moderate',
      type: 'positive',
      description: 'Staying hydrated supports better eating habits',
    },
    {
      habit1: { id: '7', name: 'Late Night Snacking', color: '#78350F' },
      habit2: { id: '1', name: 'Early Sleep', color: '#6366F1' },
      correlation: -0.71,
      strength: 'strong',
      type: 'negative',
      description: 'Late snacking negatively impacts sleep schedule',
    },
  ]

  const getCorrelationIcon = (type: HabitCorrelation['type']) => {
    switch (type) {
      case 'positive':
        return <CheckCircle className="h-5 w-5 text-success" />
      case 'negative':
        return <XCircle className="h-5 w-5 text-danger" />
      default:
        return <Minus className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStrengthColor = (strength: HabitCorrelation['strength']) => {
    switch (strength) {
      case 'strong':
        return 'bg-success'
      case 'moderate':
        return 'bg-warning'
      default:
        return 'bg-muted'
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text">Habit Correlations</h3>
        <span className="text-sm text-muted-foreground">Discover how your habits connect</span>
      </div>

      <div className="space-y-3">
        {correlations.map((correlation, index) => (
          <motion.div
            key={`${correlation.habit1.id}-${correlation.habit2.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-lg border border-border bg-surface"
          >
            {/* Habits Row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3 flex-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: correlation.habit1.color }}
                />
                <span className="text-sm font-medium text-text truncate">
                  {correlation.habit1.name}
                </span>
              </div>

              <div className="flex items-center space-x-2 px-4">
                {getCorrelationIcon(correlation.type)}
                <div className="flex items-center space-x-1">
                  <div className={cn('w-16 h-2 rounded-full overflow-hidden bg-muted')}>
                    <motion.div
                      className={cn('h-full', getStrengthColor(correlation.strength))}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.abs(correlation.correlation) * 100}%` }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {Math.round(Math.abs(correlation.correlation) * 100)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 flex-1 justify-end">
                <span className="text-sm font-medium text-text truncate">
                  {correlation.habit2.name}
                </span>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: correlation.habit2.color }}
                />
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground pl-6">
              {correlation.description}
            </p>

            {/* Strength Badge */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-2">
                <span
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium',
                    correlation.type === 'positive'
                      ? 'bg-success/10 text-success'
                      : correlation.type === 'negative'
                      ? 'bg-danger/10 text-danger'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {correlation.type === 'positive'
                    ? 'Positive'
                    : correlation.type === 'negative'
                    ? 'Negative'
                    : 'Neutral'}{' '}
                  Correlation
                </span>
                <span
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium',
                    correlation.strength === 'strong'
                      ? 'bg-success/10 text-success'
                      : correlation.strength === 'moderate'
                      ? 'bg-warning/10 text-warning'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {correlation.strength.charAt(0).toUpperCase() + correlation.strength.slice(1)}
                </span>
              </div>

              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 pt-4 border-t border-border">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-success" />
          <span className="text-xs text-muted-foreground">Positive (help each other)</span>
        </div>
        <div className="flex items-center space-x-2">
          <XCircle className="h-4 w-4 text-danger" />
          <span className="text-xs text-muted-foreground">Negative (conflict)</span>
        </div>
        <div className="flex items-center space-x-2">
          <Minus className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Neutral</span>
        </div>
      </div>
    </div>
  )
}
