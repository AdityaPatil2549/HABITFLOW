import { type FC } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Star, Zap } from 'lucide-react'
import { Progress } from '@/shared/components/ui/Progress'
import { Badge } from '@/shared/components/ui/Badge'
import { cn } from '@/shared/utils/cn'
import { counterPop } from '@/shared/utils/motionVariants'
import { useUserStats } from '../hooks/useGamification'

interface LevelProgressProps {
  className?: string
}

export const LevelProgress: FC<LevelProgressProps> = ({ className }) => {
  const { stats } = useUserStats()
  
  const progress = ((stats.level * 100 - stats.pointsToNextLevel) / 100) * 100
  
  const getLevelIcon = (level: number) => {
    if (level >= 10) return <Trophy className="h-5 w-5" />
    if (level >= 5) return <Star className="h-5 w-5" />
    return <Zap className="h-5 w-5" />
  }
  
  const getLevelColor = (level: number) => {
    if (level >= 10) return 'text-yellow-500'
    if (level >= 5) return 'text-purple-500'
    return 'text-brand-500'
  }

  return (
    <div className={cn('rounded-lg border border-border bg-surface p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <motion.div
            className={cn('p-2 rounded-lg', getLevelColor(stats.level))}
            variants={counterPop}
            animate="pop"
          >
            {getLevelIcon(stats.level)}
          </motion.div>
          <div>
            <h3 className="font-semibold text-text">Level {stats.level}</h3>
            <p className="text-sm text-muted-foreground">
              {stats.totalPoints} total points
            </p>
          </div>
        </div>
        
        <Badge variant="primary" size="sm">
          {stats.pointsToNextLevel} points to next level
        </Badge>
      </div>
      
      <Progress 
        value={progress} 
        color="primary"
        size="md"
        className="mb-2"
      />
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Level {stats.level}</span>
        <span>Level {stats.level + 1}</span>
      </div>
    </div>
  )
}
