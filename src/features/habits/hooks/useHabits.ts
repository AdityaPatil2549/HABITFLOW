import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { useHabitStore } from '../stores/habitStore'

export const useHabits = () => {
  const { filterCategory, searchQuery } = useHabitStore()

  const habits = useLiveQuery(
    () => {
      let query = db.habits.where('archived').equals(0)
      
      if (filterCategory) {
        query = query.and(habit => habit.category === filterCategory)
      }
      
      if (searchQuery) {
        query = query.and(habit => 
          habit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          habit.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }
      
      return query.toArray()
    },
    [filterCategory, searchQuery]
  )

  return {
    habits: habits ?? [],
    isLoading: habits === undefined,
  }
}

export const useHabitById = (id: string) => {
  const habit = useLiveQuery(() => db.habits.get(id), [id])
  
  return {
    habit: habit ?? null,
    isLoading: habit === undefined,
  }
}

export const useTodayEntries = () => {
  const entries = useLiveQuery(() => {
    const today = new Date().toISOString().split('T')[0]
    return db.habitEntries.where('date').equals(today).toArray()
  })

  return {
    entries: entries ?? [],
    isLoading: entries === undefined,
  }
}

export const useHabitEntries = (habitId: string, startDate?: string, endDate?: string) => {
  const entries = useLiveQuery(() => {
    let query = db.habitEntries.where('habitId').equals(habitId)
    
    if (startDate) {
      query = query.and(entry => entry.date >= startDate)
    }
    
    if (endDate) {
      query = query.and(entry => entry.date <= endDate)
    }
    
    return query.toArray()
  }, [habitId, startDate, endDate])

  return {
    entries: entries ?? [],
    isLoading: entries === undefined,
  }
}

export const useHabitStreak = (habitId: string) => {
  const streak = useLiveQuery(() => 
    db.streaks.where('habitId').equals(habitId).first(),
    [habitId]
  )

  return {
    streak: streak ?? null,
    current: streak?.current ?? 0,
    best: streak?.best ?? 0,
    isLoading: streak === undefined,
  }
}

export const useHabitStats = (habitId: string, days = 30) => {
  const stats = useLiveQuery(async () => {
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0]

    const entries = await db.habitEntries
      .where('habitId')
      .equals(habitId)
      .and(entry => entry.date >= startDate && entry.date <= endDate)
      .toArray()
    
    const streak = await db.streaks.where('habitId').equals(habitId).first()
    
    return {
      completionRate: entries.length / days,
      totalEntries: entries.length,
      completedDays: entries.length,
      current: streak?.current ?? 0,
      best: streak?.best ?? 0,
    }
  }, [habitId, days])

  return {
    stats: stats ?? {
      completionRate: 0,
      totalEntries: 0,
      completedDays: 0,
      current: 0,
      best: 0,
    },
    isLoading: stats === undefined,
  }
}
