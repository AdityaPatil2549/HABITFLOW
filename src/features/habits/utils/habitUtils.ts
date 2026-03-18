import type { Habit, HabitType, FrequencyType } from '@/shared/types'
import { getISODateString, isToday } from '@/shared/utils/formatDate'

export const habitTypeLabels: Record<HabitType, string> = {
  boolean: 'Yes/No',
  count: 'Count',
  duration: 'Duration',
  rating: 'Rating',
}

export const frequencyTypeLabels: Record<FrequencyType, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  interval: 'Every X days',
}

export const defaultColors = [
  '#6366F1', // brand-500
  '#16A34A', // success
  '#D97706', // warning
  '#DC2626', // danger
  '#0D9488', // info
  '#7C3AED', // purple
  '#0891B2', // cyan
  '#EA580C', // orange
]

export const defaultIcons = [
  'target',
  'heart',
  'brain',
  'book',
  'dumbbell',
  'moon',
  'sun',
  'coffee',
  'water',
  'feet',
]

export const getHabitDisplayValue = (habit: Habit, value: number): string => {
  switch (habit.type) {
    case 'boolean':
      return value > 0 ? '✓' : '✗'
    case 'count':
      return `${value} ${habit.targetValue ? `/ ${habit.targetValue}` : ''}`
    case 'duration':
      const hours = Math.floor(value / 60)
      const minutes = value % 60
      if (hours > 0) {
        return `${hours}h ${minutes}m`
      }
      return `${minutes}m`
    case 'rating':
      return `${value} / 5`
    default:
      return `${value}`
  }
}

export const getHabitProgress = (habit: Habit, value: number): number => {
  if (!habit.targetValue) return value > 0 ? 100 : 0
  
  return Math.min((value / habit.targetValue) * 100, 100)
}

export const isHabitCompletedToday = (habit: Habit, todayValue: number): boolean => {
  switch (habit.type) {
    case 'boolean':
      return todayValue > 0
    case 'count':
    case 'duration':
    case 'rating':
      return todayValue >= (habit.targetValue || 1)
    default:
      return false
  }
}

export const shouldShowHabitToday = (habit: Habit, date: Date = new Date()): boolean => {
  const today = getISODateString(date)
  
  switch (habit.frequency.type) {
    case 'daily':
      return true
    case 'weekly':
      const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
      return habit.frequency.days?.includes(dayOfWeek) ?? false
    case 'interval':
      // For interval habits, we'd need to check the creation date
      // This is a simplified version - in production you'd calculate based on creation date
      return true
    default:
      return true
  }
}

export const getHabitCompletionMessage = (habit: Habit, value: number): string => {
  const isCompleted = isHabitCompletedToday(habit, value)
  
  if (isCompleted) {
    return `Great job! You completed ${habit.name} today! 🎉`
  }
  
  switch (habit.type) {
    case 'boolean':
      return `Mark ${habit.name} as complete for today`
    case 'count':
      const remaining = (habit.targetValue || 1) - value
      return remaining > 0 
        ? `Need ${remaining} more to complete ${habit.name}`
        : `You've reached your goal for ${habit.name}!`
    case 'duration':
      const remainingMinutes = (habit.targetValue || 30) - value
      return remainingMinutes > 0
        ? `Need ${remainingMinutes} more minutes to complete ${habit.name}`
        : `You've reached your duration goal for ${habit.name}!`
    case 'rating':
      return `How would you rate your ${habit.name} today?`
    default:
      return `Track your progress for ${habit.name}`
  }
}

export const getStreakMessage = (currentStreak: number, habitName: string): string => {
  if (currentStreak === 0) {
    return `Start your streak with ${habitName} today!`
  } else if (currentStreak === 1) {
    return `Great start! You're on a 1-day streak with ${habitName}`
  } else if (currentStreak < 7) {
    return `Keep it up! You're on a ${currentStreak}-day streak with ${habitName}`
  } else if (currentStreak < 30) {
    return `Amazing! ${currentStreak} days in a row with ${habitName} 🔥`
  } else {
    return `Incredible! ${currentStreak} days of consistency with ${habitName}! 🏆`
  }
}

export const validateHabit = (habit: Partial<Habit>): string[] => {
  const errors: string[] = []
  
  if (!habit.name || habit.name.trim().length === 0) {
    errors.push('Habit name is required')
  }
  
  if (habit.name && habit.name.length > 100) {
    errors.push('Habit name must be less than 100 characters')
  }
  
  if (!habit.type) {
    errors.push('Habit type is required')
  }
  
  if (!habit.frequency || !habit.frequency.type) {
    errors.push('Frequency type is required')
  }
  
  if (habit.frequency.type === 'weekly' && (!habit.frequency.days || habit.frequency.days.length === 0)) {
    errors.push('Please select at least one day for weekly habits')
  }
  
  if (habit.frequency.type === 'interval' && (!habit.frequency.interval || habit.frequency.interval < 1)) {
    errors.push('Interval must be at least 1 day')
  }
  
  if (habit.targetValue !== undefined && habit.targetValue <= 0) {
    errors.push('Target value must be greater than 0')
  }
  
  if ((habit.type === 'count' || habit.type === 'duration') && !habit.targetValue) {
    errors.push('Target value is required for count and duration habits')
  }
  
  return errors
}

export const createDefaultHabit = (): Partial<Habit> => ({
  name: '',
  description: '',
  type: 'boolean',
  frequency: {
    type: 'daily',
  },
  targetValue: 1,
  category: 'General',
  color: defaultColors[0],
  icon: defaultIcons[0],
  archived: false,
})
