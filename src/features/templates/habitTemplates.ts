import { Target, Droplets, BookOpen, Moon, Sun, Heart, Brain, Dumbbell, Coffee, Zap, Salad, Wallet } from 'lucide-react'
import type { Habit } from '@/features/habits/types'

export interface HabitTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: string
  color: string
  defaultHabit: Partial<Habit>
}

export const habitTemplates: HabitTemplate[] = [
  {
    id: 'drink-water',
    name: 'Drink Water',
    description: 'Stay hydrated throughout the day',
    icon: 'Droplets',
    category: 'Health',
    color: '#0EA5E9',
    defaultHabit: {
      name: 'Drink 8 glasses of water',
      description: 'Stay hydrated for better health and energy',
      type: 'count',
      targetValue: 8,
      frequency: { type: 'daily' },
      category: 'Health',
      color: '#0EA5E9',
      reminder: { enabled: true, time: '09:00' },
    },
  },
  {
    id: 'read-books',
    name: 'Read Books',
    description: 'Read for personal growth',
    icon: 'BookOpen',
    category: 'Learning',
    color: '#8B5CF6',
    defaultHabit: {
      name: 'Read for 30 minutes',
      description: 'Expand your knowledge and relax',
      type: 'duration',
      targetValue: 30,
      frequency: { type: 'daily' },
      category: 'Learning',
      color: '#8B5CF6',
      reminder: { enabled: true, time: '21:00' },
    },
  },
  {
    id: 'early-sleep',
    name: 'Early Sleep',
    description: 'Get quality rest',
    icon: 'Moon',
    category: 'Health',
    color: '#6366F1',
    defaultHabit: {
      name: 'Sleep by 10 PM',
      description: 'Prioritize rest for better health',
      type: 'boolean',
      frequency: { type: 'daily' },
      category: 'Health',
      color: '#6366F1',
      reminder: { enabled: true, time: '21:30' },
    },
  },
  {
    id: 'morning-exercise',
    name: 'Morning Exercise',
    description: 'Start the day with movement',
    icon: 'Sun',
    category: 'Fitness',
    color: '#F59E0B',
    defaultHabit: {
      name: 'Morning workout',
      description: '30 minutes of exercise to energize',
      type: 'duration',
      targetValue: 30,
      frequency: { type: 'daily' },
      category: 'Fitness',
      color: '#F59E0B',
      reminder: { enabled: true, time: '07:00' },
    },
  },
  {
    id: 'meditation',
    name: 'Meditation',
    description: 'Practice mindfulness daily',
    icon: 'Brain',
    category: 'Wellness',
    color: '#10B981',
    defaultHabit: {
      name: 'Meditate for 10 minutes',
      description: 'Find peace and reduce stress',
      type: 'duration',
      targetValue: 10,
      frequency: { type: 'daily' },
      category: 'Wellness',
      color: '#10B981',
      reminder: { enabled: true, time: '06:30' },
    },
  },
  {
    id: 'healthy-eating',
    name: 'Healthy Eating',
    description: 'Nourish your body',
    icon: 'Heart',
    category: 'Health',
    color: '#EF4444',
    defaultHabit: {
      name: 'Eat 3 healthy meals',
      description: 'Fuel your body with nutritious food',
      type: 'count',
      targetValue: 3,
      frequency: { type: 'daily' },
      category: 'Health',
      color: '#EF4444',
      reminder: { enabled: true, time: '08:00' },
    },
  },
  {
    id: 'gym-workout',
    name: 'Gym Workout',
    description: 'Build strength and endurance',
    icon: 'Dumbbell',
    category: 'Fitness',
    color: '#EC4899',
    defaultHabit: {
      name: 'Go to the gym',
      description: 'Lift weights or cardio session',
      type: 'boolean',
      frequency: { type: 'weekly', days: [1, 3, 5] },
      category: 'Fitness',
      color: '#EC4899',
      reminder: { enabled: true, time: '17:00' },
    },
  },
  {
    id: 'no-caffeine',
    name: 'No Caffeine',
    description: 'Reduce dependency',
    icon: 'Coffee',
    category: 'Health',
    color: '#78350F',
    defaultHabit: {
      name: 'No caffeine after 2 PM',
      description: 'Better sleep quality',
      type: 'boolean',
      frequency: { type: 'daily' },
      category: 'Health',
      color: '#78350F',
      reminder: { enabled: true, time: '14:00' },
    },
  },
  {
    id: 'productivity',
    name: 'Deep Work',
    description: 'Focused work sessions',
    icon: 'Salad',
    category: 'Productivity',
    color: '#F97316',
    defaultHabit: {
      name: '2 hours of deep work',
      description: 'No distractions, pure focus',
      type: 'duration',
      targetValue: 120,
      frequency: { type: 'daily' },
      category: 'Productivity',
      color: '#F97316',
      reminder: { enabled: true, time: '10:00' },
    },
  },
  {
    id: 'gratitude',
    name: 'Daily Gratitude',
    description: 'Practice thankfulness',
    icon: 'Wallet',
    category: 'Wellness',
    color: '#14B8A6',
    defaultHabit: {
      name: 'Write 3 things I am grateful for',
      description: 'Cultivate positive mindset',
      type: 'count',
      targetValue: 3,
      frequency: { type: 'daily' },
      category: 'Wellness',
      color: '#14B8A6',
      reminder: { enabled: true, time: '22:00' },
    },
  },
]

export const getTemplateById = (id: string): HabitTemplate | undefined => {
  return habitTemplates.find(template => template.id === id)
}

export const getTemplatesByCategory = (category: string): HabitTemplate[] => {
  return habitTemplates.filter(template => template.category === category)
}

export const getAllCategories = (): string[] => {
  return [...new Set(habitTemplates.map(t => t.category))]
}
