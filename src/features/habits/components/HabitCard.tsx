import { type FC } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Circle, Target, Flame, TrendingUp, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { checkmarkBounce, counterPop } from '@/shared/utils/motionVariants'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'
import { Progress } from '@/shared/components/ui/Progress'
import type { Habit } from '../types'
import { 
  getHabitDisplayValue, 
  getHabitProgress, 
  isHabitCompletedToday,
  getStreakMessage 
} from '../utils/habitUtils'
import { useHabitStreak, useTodayEntries } from '../hooks/useHabits'

interface HabitCardProps {
  habit: Habit
  todayValue?: number
  onComplete: (habitId: string, value: number) => void
  onEdit?: () => void
  onDelete?: () => void
  className?: string
}

export const HabitCard: FC<HabitCardProps> = ({
  habit,
  todayValue = 0,
  onComplete,
  onEdit,
  onDelete,
  className,
}) => {
  const { current: currentStreak, best: bestStreak } = useHabitStreak(habit.id)
  const { entries } = useTodayEntries()
  
  const todayEntry = entries.find(entry => entry.habitId === habit.id)
  const currentValue = todayEntry?.value ?? todayValue
  const isCompleted = isHabitCompletedToday(habit, currentValue)
  const progress = getHabitProgress(habit, currentValue)
  const displayValue = getHabitDisplayValue(habit, currentValue)

  const handleComplete = () => {
    let newValue = currentValue
    
    switch (habit.type) {
      case 'boolean':
        newValue = isCompleted ? 0 : 1
        break
      case 'count':
        newValue = Math.min(currentValue + 1, habit.targetValue || 1)
        break
      case 'duration':
        newValue = Math.min(currentValue + 15, habit.targetValue || 30) // Add 15 min increments
        break
      case 'rating':
        newValue = (currentValue % 5) + 1 // Cycle through 1-5
        break
    }
    
    onComplete(habit.id, newValue)
  }

  return (
    <motion.div
      className={cn(
        'rounded-lg border border-border bg-surface p-6 transition-all hover:shadow-md',
        isCompleted && 'border-success/50 bg-success/5',
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: habit.color }}
          >
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-text">{habit.name}</h3>
            {habit.description && (
              <p className="text-sm text-muted-foreground mt-1">{habit.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={isCompleted ? 'success' : 'secondary'} size="sm">
            {habit.category}
          </Badge>
          
          {/* Action Menu */}
          <div className="relative group">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            <div className="absolute right-0 top-full mt-1 w-48 rounded-md border border-border bg-surface shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={onEdit}
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm hover:bg-accent text-left"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Habit</span>
              </button>
              <button
                onClick={onDelete}
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm hover:bg-accent text-left text-danger"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Habit</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      {(habit.type === 'count' || habit.type === 'duration') && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{displayValue}</span>
          </div>
          <Progress 
            value={progress} 
            color={isCompleted ? 'success' : 'primary'}
            size="sm"
          />
        </div>
      )}

      {/* Current value display */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <motion.div
            variants={checkmarkBounce}
            animate={isCompleted ? 'checked' : 'unchecked'}
          >
            {isCompleted ? (
              <CheckCircle className="h-6 w-6 text-success" />
            ) : (
              <Circle className="h-6 w-6 text-muted-foreground" />
            )}
          </motion.div>
          <span className="text-2xl font-bold text-text">
            {displayValue}
          </span>
        </div>

        {/* Streak indicator */}
        {currentStreak > 0 && (
          <motion.div
            className="flex items-center space-x-1 text-orange-600 dark:text-orange-400"
            variants={counterPop}
            animate={currentStreak > 0 ? 'pop' : 'rest'}
          >
            <Flame className="h-4 w-4" />
            <span className="text-sm font-medium">{currentStreak}</span>
          </motion.div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-4 w-4" />
            <span>Best: {bestStreak}</span>
          </div>
          {currentStreak > 0 && (
            <div>{getStreakMessage(currentStreak, habit.name)}</div>
          )}
        </div>
      </div>

      {/* Action button */}
      <Button
        onClick={handleComplete}
        variant={isCompleted ? 'secondary' : 'primary'}
        size="sm"
        className="w-full"
      >
        {isCompleted ? 'Mark Incomplete' : 'Complete Habit'}
      </Button>
    </motion.div>
  )
}
