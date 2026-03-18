import { type FC } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Circle, Clock, Target, Zap, Trophy } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Progress } from '@/shared/components/ui/Progress'
import { Badge } from '@/shared/components/ui/Badge'
import { cn } from '@/shared/utils/cn'

export interface Challenge {
  id: string
  title: string
  description: string
  type: 'habit' | 'task' | 'streak'
  target: number
  current: number
  points: number
  expiresAt: Date
  completed: boolean
  icon: string
}

interface DailyChallengeCardProps {
  challenge: Challenge
  onAccept?: () => void
  onComplete?: () => void
  className?: string
}

const challengeIcons: Record<string, React.ReactNode> = {
  target: <Target className="h-6 w-6" />,
  check: <CheckCircle className="h-6 w-6" />,
  clock: <Clock className="h-6 w-6" />,
  zap: <Zap className="h-6 w-6" />,
  trophy: <Trophy className="h-6 w-6" />,
}

export const DailyChallengeCard: FC<DailyChallengeCardProps> = ({
  challenge,
  onAccept,
  onComplete,
  className,
}) => {
  const progress = (challenge.current / challenge.target) * 100
  const isExpired = new Date() > challenge.expiresAt
  const Icon = challengeIcons[challenge.icon] || <Target className="h-6 w-6" />

  return (
    <motion.div
      className={cn(
        'rounded-lg border p-4 transition-all',
        challenge.completed
          ? 'border-success bg-success/5'
          : 'border-border bg-surface hover:shadow-md',
        className
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div
            className={cn(
              'w-12 h-12 rounded-lg flex items-center justify-center',
              challenge.completed ? 'bg-success text-white' : 'bg-brand-100 text-brand-600'
            )}
          >
            {challenge.completed ? <CheckCircle className="h-6 w-6" /> : Icon}
          </div>
          <div>
            <h4 className={cn('font-medium', challenge.completed && 'line-through text-muted-foreground')}>
              {challenge.title}
            </h4>
            <p className="text-sm text-muted-foreground">{challenge.description}</p>
          </div>
        </div>
        <Badge variant={challenge.completed ? 'success' : 'primary'}>
          +{challenge.points} pts
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">
            {challenge.current} / {challenge.target}
          </span>
        </div>
        <Progress value={progress} color={challenge.completed ? 'success' : 'primary'} size="sm" />
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-xs text-muted-foreground">
          Expires: {challenge.expiresAt.toLocaleDateString()}
        </span>
        
        {!challenge.completed && !isExpired && (
          <Button size="sm" onClick={onComplete}>
            Complete
          </Button>
        )}
        
        {challenge.completed && (
          <Badge variant="success" size="sm">Completed</Badge>
        )}
      </div>
    </motion.div>
  )
}

export const generateDailyChallenges = (): Challenge[] => {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  return [
    {
      id: 'daily-3-habits',
      title: 'Habit Master',
      description: 'Complete 3 habits today',
      type: 'habit',
      target: 3,
      current: 0,
      points: 15,
      expiresAt: tomorrow,
      completed: false,
      icon: 'target',
    },
    {
      id: 'daily-5-tasks',
      title: 'Task Crusher',
      description: 'Complete 5 tasks today',
      type: 'task',
      target: 5,
      current: 0,
      points: 20,
      expiresAt: tomorrow,
      completed: false,
      icon: 'check',
    },
    {
      id: 'daily-focus',
      title: 'Deep Focus',
      description: 'Use the Pomodoro timer for 1 hour',
      type: 'habit',
      target: 60,
      current: 0,
      points: 25,
      expiresAt: tomorrow,
      completed: false,
      icon: 'clock',
    },
    {
      id: 'daily-streak',
      title: 'Streak Keeper',
      description: 'Maintain a 3-day streak on any habit',
      type: 'streak',
      target: 3,
      current: 0,
      points: 30,
      expiresAt: tomorrow,
      completed: false,
      icon: 'zap',
    },
    {
      id: 'daily-early',
      title: 'Early Bird',
      description: 'Complete a habit before 9 AM',
      type: 'habit',
      target: 1,
      current: 0,
      points: 10,
      expiresAt: tomorrow,
      completed: false,
      icon: 'trophy',
    },
  ]
}
