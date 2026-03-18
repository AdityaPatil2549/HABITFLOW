import { db } from './db'

export async function clearAllData() {
  await db.habits.clear()
  await db.tasks.clear()
  await db.habitEntries.clear()
  await db.streaks.clear()
  await db.achievements.clear()
  await db.userAchievements.clear()
  await db.userSettings.clear()
  console.log('✅ All data cleared from database')
}
