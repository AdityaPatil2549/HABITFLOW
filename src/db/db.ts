import Dexie, { type Table } from 'dexie'

// Database interfaces based on HabitFlow requirements
export interface Habit {
  id: string
  name: string
  description?: string
  type: 'boolean' | 'count' | 'duration' | 'rating'
  frequency: {
    type: 'daily' | 'weekly' | 'interval'
    days?: number[] // 0-6 (Sunday-Saturday) for weekly
    interval?: number // for interval-based
  }
  targetValue?: number
  category: string
  color: string
  icon: string
  archived: boolean
  createdAt: Date
  updatedAt: Date
}

export interface HabitEntry {
  id: string
  habitId: string
  date: string // ISO date string
  value: number
  completedAt?: Date
  notes?: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: Date
  completedAt?: Date
  habitId?: string // optional link to habit
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Streak {
  id: string
  habitId: string
  current: number
  best: number
  startDate: Date
  lastCheckDate: Date
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  type: 'streak' | 'consistency' | 'total' | 'special'
  requirement: {
    type: string
    value: number
  }
  unlockedAt?: Date
  createdAt: Date
}

export interface UserAchievement {
  id: string
  achievementId: string
  unlockedAt: Date
}

export interface UserSettings {
  id: 'settings'
  theme: 'light' | 'dark' | 'system'
  notifications: {
    enabled: boolean
    habitReminders: boolean
    taskReminders: boolean
    streakWarnings: boolean
  }
  privacy: {
    analyticsEnabled: boolean
    dataSharing: boolean
  }
  preferences: {
    defaultView: 'dashboard' | 'habits' | 'tasks'
    weekStartsOn: 0 | 1 // 0 = Sunday, 1 = Monday
    timeFormat: '12h' | '24h'
  }
  updatedAt: Date
}

// Database class
export class HabitFlowDB extends Dexie {
  habits!: Table<Habit>
  habitEntries!: Table<HabitEntry>
  tasks!: Table<Task>
  streaks!: Table<Streak>
  achievements!: Table<Achievement>
  userAchievements!: Table<UserAchievement>
  userSettings!: Table<UserSettings>

  constructor() {
    super('HabitFlow')
    
    // Database schema
    this.version(1).stores({
      habits: 'id, name, type, category, archived, createdAt, updatedAt',
      habitEntries: 'id, habitId, date, value, completedAt',
      tasks: 'id, status, priority, dueDate, habitId, createdAt, updatedAt',
      streaks: 'id, habitId, current, best, lastCheckDate',
      achievements: 'id, type, requirement, createdAt',
      userAchievements: 'id, achievementId, unlockedAt',
      userSettings: 'id, updatedAt',
    })

    // Hooks for data validation and cascading deletes
    this.habits.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date()
      obj.updatedAt = new Date()
      if (!obj.id) obj.id = crypto.randomUUID()
    })

    this.habits.hook('updating', (mods: Partial<Habit>, primKey, obj, trans) => {
      const modifications = { ...mods }
      modifications.updatedAt = new Date()
      return modifications
    })

    this.habitEntries.hook('creating', (primKey, obj, trans) => {
      if (!obj.id) obj.id = crypto.randomUUID()
    })

    this.tasks.hook('creating', (primKey, obj) => {
      const task = obj as Task
      task.createdAt = new Date()
      task.updatedAt = new Date()
      if (task.status === 'completed') {
        task.completedAt = new Date()
      }
    })

    this.tasks.hook('updating', (mods: Partial<Task>, primKey, obj) => {
      const task = obj as Task
      const updates = { ...mods }
      updates.updatedAt = new Date()
      if (updates.status === 'completed' && !updates.completedAt) {
        updates.completedAt = new Date()
      }
      return updates
    })

    this.streaks.hook('creating', (primKey, obj, trans) => {
      if (!obj.id) obj.id = crypto.randomUUID()
    })

    // Initialize default settings
    this.userSettings.add({
      id: 'settings',
      theme: 'system',
      notifications: {
        enabled: true,
        habitReminders: true,
        taskReminders: true,
        streakWarnings: true,
      },
      privacy: {
        analyticsEnabled: true,
        dataSharing: false,
      },
      preferences: {
        defaultView: 'dashboard',
        weekStartsOn: 1, // Monday
        timeFormat: '12h',
      },
      updatedAt: new Date(),
    }).catch(() => {
      // Settings already exist
    })
  }
}

// Export database instance
export const db = new HabitFlowDB()

// Export types for use throughout the app
export type Database = typeof db
