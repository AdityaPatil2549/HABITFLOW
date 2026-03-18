import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { getISODateString, subDays, startOfWeek, startOfMonth } from '@/shared/utils/formatDate'

export const useHabitCompletionData = (days = 30) => {
  const data = useLiveQuery(async () => {
    const endDate = new Date()
    const startDate = subDays(endDate, days)
    
    const habits = await db.habits.where('archived').equals(0).toArray()
    const entries = await db.habitEntries
      .where('date')
      .between(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0])
      .toArray()
    
    // Generate date range
    const dateRange: string[] = []
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(endDate, i)
      dateRange.push(date.toISOString().split('T')[0])
    }
    
    // Calculate completion data for each date
    const completionData = dateRange.map(date => {
      const dayEntries = entries.filter(entry => entry.date === date)
      const completedHabits = dayEntries.filter(entry => entry.value > 0).length
      const totalHabits = habits.length
      
      return {
        date,
        completed: completedHabits,
        total: totalHabits,
        completionRate: totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0,
      }
    })
    
    return completionData
  }, [days])

  return {
    data: data ?? [],
    isLoading: data === undefined,
  }
}

export const useHabitCategoryData = () => {
  const data = useLiveQuery(async () => {
    const habits = await db.habits.where('archived').equals(0).toArray()
    
    // Group habits by category
    const categoryMap = new Map<string, number>()
    habits.forEach(habit => {
      const count = categoryMap.get(habit.category) || 0
      categoryMap.set(habit.category, count + 1)
    })
    
    // Convert to array format for charts
    const categoryData = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
      percentage: (count / habits.length) * 100,
    }))
    
    return categoryData.sort((a, b) => b.count - a.count)
  }, [])

  return {
    data: data ?? [],
    isLoading: data === undefined,
  }
}

export const useStreakData = () => {
  const data = useLiveQuery(async () => {
    const streaks = await db.streaks.toArray()
    const habits = await db.habits.where('archived').equals(0).toArray()
    
    // Calculate streak distribution
    const streakDistribution = {
      '0': 0,    // No streak
      '1-7': 0,  // 1-7 days
      '8-30': 0, // 8-30 days
      '31+': 0,  // 31+ days
    }
    
    habits.forEach(habit => {
      const streak = streaks.find(s => s.habitId === habit.id)
      const currentStreak = streak?.current || 0
      
      if (currentStreak === 0) {
        streakDistribution['0']++
      } else if (currentStreak <= 7) {
        streakDistribution['1-7']++
      } else if (currentStreak <= 30) {
        streakDistribution['8-30']++
      } else {
        streakDistribution['31+']++
      }
    })
    
    // Convert to array format for charts
    const streakData = Object.entries(streakDistribution).map(([range, count]) => ({
      range,
      count,
      percentage: habits.length > 0 ? (count / habits.length) * 100 : 0,
    }))
    
    return streakData
  }, [])

  return {
    data: data ?? [],
    isLoading: data === undefined,
  }
}

export const useWeeklyProgressData = () => {
  const data = useLiveQuery(async () => {
    const today = new Date()
    const weekStart = startOfWeek(today)
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
    
    const habits = await db.habits.where('archived').equals(0).toArray()
    const entries = await db.habitEntries
      .where('date')
      .between(weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0])
      .toArray()
    
    // Generate week data
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const weekData = weekDays.map((day, index) => {
      const date = new Date(weekStart.getTime() + index * 24 * 60 * 60 * 1000)
      const dateString = date.toISOString().split('T')[0]
      const dayEntries = entries.filter(entry => entry.date === dateString)
      const completedHabits = dayEntries.filter(entry => entry.value > 0).length
      
      return {
        day,
        date: dateString,
        completed: completedHabits,
        total: habits.length,
        completionRate: habits.length > 0 ? (completedHabits / habits.length) * 100 : 0,
      }
    })
    
    return weekData
  }, [])

  return {
    data: data ?? [],
    isLoading: data === undefined,
  }
}

export const useMonthlyProgressData = (months = 6) => {
  const data = useLiveQuery(async () => {
    const today = new Date()
    const monthlyData = []
    
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const monthStart = startOfMonth(monthDate)
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
      
      const habits = await db.habits.where('archived').equals(0).toArray()
      const entries = await db.habitEntries
        .where('date')
        .between(monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0])
        .toArray()
      
      const completedEntries = entries.filter(entry => entry.value > 0)
      const uniqueDays = new Set(completedEntries.map(entry => entry.date)).size
      const totalPossibleDays = habits.length * Math.ceil((monthEnd.getTime() - monthStart.getTime()) / (24 * 60 * 60 * 1000))
      
      monthlyData.push({
        month: monthDate.toLocaleDateString('en', { month: 'short', year: 'numeric' }),
        year: monthDate.getFullYear(),
        monthIndex: monthDate.getMonth(),
        completed: completedEntries.length,
        totalPossible: totalPossibleDays,
        completionRate: totalPossibleDays > 0 ? (completedEntries.length / totalPossibleDays) * 100 : 0,
        activeDays: uniqueDays,
      })
    }
    
    return monthlyData
  }, [months])

  return {
    data: data ?? [],
    isLoading: data === undefined,
  }
}

export const useTaskAnalyticsData = () => {
  const data = useLiveQuery(async () => {
    const tasks = await db.tasks.toArray()
    const today = getISODateString()
    
    // Task completion by status
    const statusData = {
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length,
    }
    
    // Task completion by priority
    const priorityData = {
      low: tasks.filter(t => t.priority === 'low').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      high: tasks.filter(t => t.priority === 'high').length,
      urgent: tasks.filter(t => t.priority === 'urgent').length,
    }
    
    // Tasks due today
    const dueToday = tasks.filter(t => t.dueDate === today && t.status !== 'completed').length
    
    // Overdue tasks
    const overdue = tasks.filter(t => 
      t.dueDate && 
      t.dueDate < today && 
      t.status !== 'completed' && 
      t.status !== 'cancelled'
    ).length
    
    // Completion rate this month
    const monthStart = startOfMonth(new Date()).toISOString().split('T')[0]
    const monthTasks = tasks.filter(t => t.createdAt >= monthStart)
    const monthCompleted = monthTasks.filter(t => t.status === 'completed').length
    
    return {
      total: tasks.length,
      statusData,
      priorityData,
      dueToday,
      overdue,
      monthCompleted,
      monthTotal: monthTasks.length,
      monthCompletionRate: monthTasks.length > 0 ? (monthCompleted / monthTasks.length) * 100 : 0,
    }
  }, [])

  return {
    data: data ?? {
      total: 0,
      statusData: { todo: 0, in_progress: 0, completed: 0, cancelled: 0 },
      priorityData: { low: 0, medium: 0, high: 0, urgent: 0 },
      dueToday: 0,
      overdue: 0,
      monthCompleted: 0,
      monthTotal: 0,
      monthCompletionRate: 0,
    },
    isLoading: data === undefined,
  }
}
