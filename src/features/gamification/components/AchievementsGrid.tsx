import { type FC } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Lock, Star, Target, Zap, Flame } from 'lucide-react'
import { containerVariants, listItemVariants } from '@/shared/utils/motionVariants'
import { Badge } from '@/shared/components/ui/Badge'
import { cn } from '@/shared/utils/cn'
import { useAchievements } from '../hooks/useGamification'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  points: number
  requirement: string
  unlocked: boolean
  unlockedAt?: Date
}

const achievementIcons: Record<string, React.ReactNode> = {
  trophy: <Trophy className="h-6 w-6" />,
  star: <Star className="h-6 w-6" />,
  target: <Target className="h-6 w-6" />,
  zap: <Zap className="h-6 w-6" />,
  flame: <Flame className="h-6 w-6" />,
}

interface AchievementsGridProps {
  className?: string
}

export const AchievementsGrid: FC<AchievementsGridProps> = ({ className }) => {
  const { unlockedAchievements, achievements, isLoading } = useAchievements()
  
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  // Mock achievements data (in real app, this would come from the database)
  const mockAchievements: Achievement[] = [
    {
      id: 'first-habit',
      name: 'First Steps',
      description: 'Create your first habit',
      icon: 'target',
      points: 10,
      requirement: 'Create 1 habit',
      unlocked: unlockedAchievements.length > 0,
    },
    {
      id: 'week-streak',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: 'flame',
      points: 25,
      requirement: '7 day streak',
      unlocked: unlockedAchievements.length > 1,
    },
    {
      id: 'month-streak',
      name: 'Monthly Master',
      description: 'Maintain a 30-day streak',
      icon: 'star',
      points: 50,
      requirement: '30 day streak',
      unlocked: unlockedAchievements.length > 2,
    },
    {
      id: 'task-master',
      name: 'Task Master',
      description: 'Complete 50 tasks',
      icon: 'trophy',
      points: 30,
      requirement: '50 completed tasks',
      unlocked: unlockedAchievements.length > 3,
    },
    {
      id: 'early-bird',
      name: 'Early Bird',
      description: 'Complete 5 habits before 9 AM',
      icon: 'zap',
      points: 20,
      requirement: '5 early completions',
      unlocked: unlockedAchievements.length > 4,
    },
    {
      id: 'perfectionist',
      name: 'Perfectionist',
      description: '100% completion rate for a week',
      icon: 'star',
      points: 40,
      requirement: '100% weekly completion',
      unlocked: unlockedAchievements.length > 5,
    },
  ]

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text">Achievements</h3>
        <Badge variant="secondary">
          {unlockedAchievements.length} / {mockAchievements.length} unlocked
        </Badge>
      </div>
      
      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {mockAchievements.map((achievement) => {
          const isUnlocked = achievement.unlocked
          const Icon = achievementIcons[achievement.icon] || <Trophy className="h-6 w-6" />
          
          return (
            <motion.div
              key={achievement.id}
              variants={listItemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className={cn(
                  'rounded-lg border p-4 transition-all',
                  isUnlocked
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-border bg-surface opacity-60'
                )}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={cn(
                      'p-2 rounded-lg',
                      isUnlocked
                        ? 'bg-brand-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {Icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={cn(
                        'font-medium truncate',
                        isUnlocked ? 'text-text' : 'text-muted-foreground'
                      )}>
                        {achievement.name}
                      </h4>
                      {!isUnlocked && (
                        <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {achievement.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {achievement.requirement}
                      </span>
                      <Badge 
                        variant={isUnlocked ? 'primary' : 'secondary'} 
                        size="sm"
                      >
                        +{achievement.points}
                      </Badge>
                    </div>
                    
                    {isUnlocked && achievement.unlockedAt && (
                      <p className="text-xs text-success mt-2">
                        Unlocked {achievement.unlockedAt.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
