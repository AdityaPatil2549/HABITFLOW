import { db } from '@/db/db'

export const exportData = async (): Promise<string> => {
  const data = {
    habits: await db.habits.toArray(),
    habitEntries: await db.habitEntries.toArray(),
    tasks: await db.tasks.toArray(),
    streaks: await db.streaks.toArray(),
    achievements: await db.achievements.toArray(),
    userAchievements: await db.userAchievements.toArray(),
    userSettings: await db.userSettings.toArray(),
    exportDate: new Date().toISOString(),
    version: '1.0.0',
  }
  
  return JSON.stringify(data, null, 2)
}

export const exportToCSV = async (): Promise<{ habits: string; tasks: string }> => {
  // Export habits
  const habits = await db.habits.toArray()
  const habitsCSV = [
    'Name,Type,Category,Frequency,Created At,Archived',
    ...habits.map(h => 
      `"${h.name}",${h.type},${h.category},${h.frequency.type},${h.createdAt},${h.archived}`
    ),
  ].join('\n')
  
  // Export tasks
  const tasks = await db.tasks.toArray()
  const tasksCSV = [
    'Title,Status,Priority,Due Date,Completed,Tags',
    ...tasks.map(t => 
      `"${t.title}",${t.status},${t.priority},${t.dueDate || ''},${t.status === 'completed'},"${t.tags.join(', ')}"`
    ),
  ].join('\n')
  
  return { habits: habitsCSV, tasks: tasksCSV }
}

export const importData = async (jsonData: string): Promise<boolean> => {
  try {
    const data = JSON.parse(jsonData)
    
    // Validate data structure
    if (!data.habits || !data.habitEntries || !data.tasks) {
      throw new Error('Invalid backup format')
    }
    
    // Clear existing data
    await db.habits.clear()
    await db.habitEntries.clear()
    await db.tasks.clear()
    await db.streaks.clear()
    await db.achievements.clear()
    await db.userAchievements.clear()
    await db.userSettings.clear()
    
    // Import data
    await db.habits.bulkAdd(data.habits)
    await db.habitEntries.bulkAdd(data.habitEntries)
    await db.tasks.bulkAdd(data.tasks)
    await db.streaks.bulkAdd(data.streaks || [])
    await db.achievements.bulkAdd(data.achievements || [])
    await db.userAchievements.bulkAdd(data.userAchievements || [])
    await db.userSettings.bulkAdd(data.userSettings || [])
    
    return true
  } catch (error) {
    console.error('Import failed:', error)
    return false
  }
}

export const downloadFile = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const readFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsText(file)
  })
}
