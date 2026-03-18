import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'

export const useAchievements = () => {
  const achievements = useLiveQuery(() => 
    db.achievements.toArray(),
    []
  )

  const userAchievements = useLiveQuery(() => 
    db.userAchievements.toArray(),
    []
  )

  const unlockedAchievements = useLiveQuery(async () => {
    const allAchievements = await db.achievements.toArray()
    const userAch = await db.userAchievements.toArray()
    
    return allAchievements.filter(achievement =>
      userAch.some(userAch => userAch.achievementId === achievement.id)
    )
  }, [])

  return {
    achievements: achievements ?? [],
    userAchievements: userAchievements ?? [],
    unlockedAchievements: unlockedAchievements ?? [],
    isLoading: achievements === undefined || userAchievements === undefined,
  }
}

export const useUserStats = () => {
  const stats = useLiveQuery(async () => {
    // Calculate user stats
    const habits = await db.habits.where('archived').equals(0).toArray()
    const streaks = await db.streaks.toArray()
    const entries = await db.habitEntries.toArray()
    const tasks = await db.tasks.toArray()
    const completedTasks = tasks.filter(t => t.status === 'completed')
    
    // Total points (simplified calculation)
    const totalPoints = completedTasks.length * 10 + 
                        entries.filter(e => e.value > 0).length * 5 +
                        streaks.reduce((sum, streak) => sum + streak.current * 2, 0)
    
    // Current level (every 100 points = 1 level)
    const level = Math.floor(totalPoints / 100) + 1
    const pointsToNextLevel = level * 100 - totalPoints
    
    // Best streak
    const bestStreak = streaks.reduce((max, streak) => Math.max(max, streak.best), 0)
    
    // Total completion days
    const uniqueDays = new Set(entries.filter(e => e.value > 0).map(e => e.date)).size
    
    return {
      totalPoints,
      level,
      pointsToNextLevel,
      bestStreak,
      totalHabits: habits.length,
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      totalCompletionDays: uniqueDays,
    }
  }, [])

  return {
    stats: stats ?? {
      totalPoints: 0,
      level: 1,
      pointsToNextLevel: 100,
      bestStreak: 0,
      totalHabits: 0,
      totalTasks: 0,
      completedTasks: 0,
      totalCompletionDays: 0,
    },
    isLoading: stats === undefined,
  }
}

export const useLeaderboard = (timeframe: 'week' | 'month' | 'all' = 'all') => {
  const leaderboard = useLiveQuery(async () => {
    // This would typically fetch from a backend
    // For now, return mock data based on current user
    const userStats = await useUserStats()
    
    return [
      {
        id: 'current-user',
        username: 'You',
        points: userStats.totalPoints,
        level: userStats.level,
        rank: 1,
        change: 0,
      },
      // Add mock other users
      {
        id: 'user-1',
        username: 'Alex Champion',
        points: Math.max(userStats.totalPoints + 50, 100),
        level: Math.floor((userStats.totalPoints + 50) / 100) + 1,
        rank: 1,
        change: 1,
      },
      {
        id: 'user-2',
        username: 'Sam Achiever',
        points: Math.max(userStats.totalPoints - 20, 0),
        level: Math.floor(Math.max(userStats.totalPoints - 20, 0) / 100) + 1,
        rank: 3,
        change: -1,
      },
    ].sort((a, b) => b.points - a.points).map((user, index) => ({
      ...user,
      rank: index + 1,
    }))
  }, [timeframe])

  return {
    leaderboard: leaderboard ?? [],
    isLoading: leaderboard === undefined,
  }
}

export const useRecentActivity = () => {
  const activity = useLiveQuery(async () => {
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    // Get recent habit completions
    const recentEntries = await db.habitEntries
      .where('date')
      .between(weekAgo, today)
      .and(entry => entry.value > 0)
      .toArray()
    
    // Get recent task completions
    const recentTasks = await db.tasks
      .where('completedAt')
      .between(new Date(weekAgo), new Date())
      .toArray()
    
    // Get recent achievements
    const recentAchievements = await db.userAchievements
      .where('unlockedAt')
      .between(new Date(weekAgo), new Date())
      .toArray()
    
    // Combine and sort by date
    const activities = [
      ...recentEntries.map(entry => ({
        id: entry.id,
        type: 'habit_completion' as const,
        title: 'Habit completed',
        description: `Completed a habit`,
        timestamp: entry.date,
        points: 5,
      })),
      ...recentTasks.map(task => ({
        id: task.id,
        type: 'task_completion' as const,
        title: 'Task completed',
        description: task.title,
        timestamp: task.completedAt?.toISOString().split('T')[0] || task.createdAt.toISOString().split('T')[0],
        points: 10,
      })),
      ...recentAchievements.map(userAch => ({
        id: userAch.id,
        type: 'achievement' as const,
        title: 'Achievement unlocked',
        description: userAch.achievementId,
        timestamp: userAch.unlockedAt.toISOString().split('T')[0],
        points: 25,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
     .slice(0, 10)
    
    return activities
  }, [])

  return {
    activity: activity ?? [],
    isLoading: activity === undefined,
  }
}
