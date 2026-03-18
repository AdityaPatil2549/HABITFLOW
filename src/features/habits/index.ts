// Public API exports for habits feature
export { HabitCard } from './components/HabitCard'
export { HabitForm } from './components/HabitForm'
export { HabitList } from './components/HabitList'
export { useHabits, useHabitById, useTodayEntries, useHabitEntries, useHabitStreak, useHabitStats } from './hooks/useHabits'
export { HabitService } from './services/habitService'
export { 
  habitTypeLabels, 
  frequencyTypeLabels, 
  defaultColors, 
  defaultIcons,
  getHabitDisplayValue,
  getHabitProgress,
  isHabitCompletedToday,
  shouldShowHabitToday,
  getHabitCompletionMessage,
  getStreakMessage,
  validateHabit,
  createDefaultHabit
} from './utils/habitUtils'
export type { Habit, CreateHabit, UpdateHabit, HabitEntry, CreateHabitEntry, HabitFrequency } from './types'
