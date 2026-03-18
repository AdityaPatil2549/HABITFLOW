import { db, type Habit, type HabitEntry } from '@/db/db'
import { getISODateString } from '@/shared/utils/formatDate'

export class HabitService {
  // Habit CRUD operations
  static async createHabit(habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>): Promise<Habit> {
    const id = crypto.randomUUID()
    const now = new Date()
    const newHabit: Habit = {
      ...habit,
      id,
      createdAt: now,
      updatedAt: now,
    }
    
    await db.habits.add(newHabit)
    return newHabit
  }

  static async updateHabit(id: string, updates: Partial<Habit>): Promise<Habit> {
    const habit = await db.habits.get(id)
    if (!habit) {
      throw new Error('Habit not found')
    }
    
    const updatedHabit = { ...habit, ...updates, updatedAt: new Date() }
    await db.habits.update(id, updatedHabit)
    return updatedHabit
  }

  static async deleteHabit(id: string): Promise<void> {
    await db.transaction('rw', db.habits, db.habitEntries, db.streaks, async () => {
      await db.habits.delete(id)
      await db.habitEntries.where('habitId').equals(id).delete()
      await db.streaks.where('habitId').equals(id).delete()
    })
  }

  static async getHabits(includeArchived = false): Promise<Habit[]> {
    return includeArchived 
      ? db.habits.toArray()
      : db.habits.where('archived').equals(0).toArray()
  }

  static async getHabitById(id: string): Promise<Habit | undefined> {
    return db.habits.get(id)
  }

  // Habit entry operations
  static async createHabitEntry(entry: Omit<HabitEntry, 'id'>): Promise<HabitEntry> {
    const id = crypto.randomUUID()
    const newEntry: HabitEntry = { ...entry, id }
    
    await db.habitEntries.add(newEntry)
    return newEntry
  }

  static async updateHabitEntry(id: string, updates: Partial<HabitEntry>): Promise<HabitEntry> {
    const entry = await db.habitEntries.get(id)
    if (!entry) {
      throw new Error('Habit entry not found')
    }
    
    const updatedEntry = { ...entry, ...updates }
    await db.habitEntries.update(id, updatedEntry)
    return updatedEntry
  }

  static async deleteHabitEntry(id: string): Promise<void> {
    await db.habitEntries.delete(id)
  }

  static async getHabitEntries(habitId: string, startDate?: string, endDate?: string): Promise<HabitEntry[]> {
    let query = db.habitEntries.where('habitId').equals(habitId)
    
    if (startDate) {
      query = query.and(entry => entry.date >= startDate)
    }
    
    if (endDate) {
      query = query.and(entry => entry.date <= endDate)
    }
    
    return query.toArray()
  }

  static async getTodayEntries(): Promise<HabitEntry[]> {
    const today = getISODateString()
    return db.habitEntries.where('date').equals(today).toArray()
  }

  static async getEntriesForDate(date: string): Promise<HabitEntry[]> {
    return db.habitEntries.where('date').equals(date).toArray()
  }

  // Streak operations
  static async calculateStreak(habitId: string): Promise<{ current: number; best: number }> {
    const entries = await db.habitEntries
      .where('habitId')
      .equals(habitId)
      .sortBy('date')
    
    if (entries.length === 0) {
      return { current: 0, best: 0 }
    }

    // Sort by date descending to calculate current streak
    const sortedEntries = entries.sort((a, b) => b.date.localeCompare(a.date))
    let currentStreak = 0
    let bestStreak = 0
    let tempStreak = 0

    const today = getISODateString()
    let expectedDate = today

    for (const entry of sortedEntries) {
      if (entry.date === expectedDate) {
        currentStreak++
        tempStreak++
        expectedDate = new Date(new Date(expectedDate).getTime() - 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0]
      } else if (entry.date < expectedDate) {
        break
      }
    }

    // Calculate best streak
    tempStreak = 0
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      if (i === 0) {
        tempStreak = 1
      } else {
        const prevDate = new Date(entries[i - 1].date)
        const currentDate = new Date(entry.date)
        const dayDiff = Math.floor((prevDate.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000))
        
        if (dayDiff === 1) {
          tempStreak++
        } else {
          tempStreak = 1
        }
      }
      bestStreak = Math.max(bestStreak, tempStreak)
    }

    return { current: currentStreak, best: bestStreak }
  }

  static async updateStreak(habitId: string): Promise<void> {
    const { current, best } = await this.calculateStreak(habitId)
    
    const existingStreak = await db.streaks.where('habitId').equals(habitId).first()
    
    if (existingStreak) {
      await db.streaks.update(existingStreak.id, {
        current,
        best: Math.max(best, existingStreak.best),
        lastCheckDate: new Date(),
      })
    } else {
      await db.streaks.add({
        id: crypto.randomUUID(),
        habitId,
        current,
        best,
        startDate: new Date(),
        lastCheckDate: new Date(),
      })
    }
  }

  // Analytics
  static async getHabitStats(habitId: string, days = 30): Promise<{
    completionRate: number
    totalEntries: number
    completedDays: number
    streak: { current: number; best: number }
  }> {
    const endDate = getISODateString()
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0]

    const entries = await this.getHabitEntries(habitId, startDate, endDate)
    const streak = await this.calculateStreak(habitId)
    
    return {
      completionRate: entries.length / days,
      totalEntries: entries.length,
      completedDays: entries.length,
      streak,
    }
  }
}
