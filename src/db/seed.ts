import { db } from './db'

export async function seedDatabase() {
  // Check if data already exists
  const existingHabits = await db.habits.count()
  const existingTasks = await db.tasks.count()
  
  if (existingHabits > 0 || existingTasks > 0) {
    console.log('Database already has data, skipping seed')
    return
  }

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0]

  // Sample Habits
  const habits = [
    {
      id: crypto.randomUUID(),
      name: 'Drink 8 glasses of water',
      description: 'Stay hydrated throughout the day',
      icon: '💧',
      color: '#3B82F6',
      type: 'count' as const,
      targetValue: 8,
      unit: 'glasses',
      frequency: { type: 'daily' as const },
      tags: ['health', 'hydration'],
      category: 'Health',
      archived: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      name: 'Morning Meditation',
      description: '10 minutes of mindfulness meditation',
      icon: '🧘',
      color: '#8B5CF6',
      type: 'duration' as const,
      targetValue: 10,
      unit: 'minutes',
      frequency: { type: 'daily' as const },
      tags: ['mindfulness', 'mental-health'],
      category: 'Wellness',
      archived: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      name: 'Read 30 minutes',
      description: 'Read a book or educational content',
      icon: '📚',
      color: '#F59E0B',
      type: 'duration' as const,
      targetValue: 30,
      unit: 'minutes',
      frequency: { type: 'daily' as const },
      tags: ['learning', 'self-improvement'],
      category: 'Learning',
      archived: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      name: 'Exercise',
      description: 'Workout or physical activity',
      icon: '💪',
      color: '#EF4444',
      type: 'duration' as const,
      targetValue: 30,
      unit: 'minutes',
      frequency: { type: 'weekly' as const, days: [1, 3, 5] },
      tags: ['fitness', 'health'],
      category: 'Fitness',
      archived: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      name: 'Journal Entry',
      description: 'Write about your day',
      icon: '📝',
      color: '#10B981',
      type: 'boolean' as const,
      targetValue: 1,
      unit: 'entry',
      frequency: { type: 'daily' as const },
      tags: ['reflection', 'writing'],
      category: 'Mindfulness',
      archived: 0,
      createdAt: now,
      updatedAt: now,
    },
  ]

  // Sample Tasks
  const tasks = [
    {
      id: crypto.randomUUID(),
      title: 'Review project requirements',
      description: 'Go through the new project specs and identify key deliverables',
      status: 'completed' as const,
      priority: 'high' as const,
      dueDate: yesterday,
      tags: ['work', 'planning'],
      completedAt: yesterday,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      title: 'Call dentist for appointment',
      description: 'Schedule next cleaning',
      status: 'pending' as const,
      priority: 'medium' as const,
      dueDate: today,
      tags: ['health', 'personal'],
      completedAt: undefined,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      title: 'Grocery shopping',
      description: 'Buy vegetables, milk, and bread',
      status: 'in-progress' as const,
      priority: 'low' as const,
      dueDate: today,
      tags: ['shopping', 'home'],
      completedAt: undefined,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      title: 'Pay electricity bill',
      description: 'Due by end of month',
      status: 'pending' as const,
      priority: 'high' as const,
      dueDate: today,
      tags: ['finance', 'home'],
      completedAt: undefined,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      title: 'Plan weekend trip',
      description: 'Research destinations and book hotel',
      status: 'pending' as const,
      priority: 'low' as const,
      dueDate: new Date(now.getTime() + 3 * 86400000).toISOString().split('T')[0],
      tags: ['travel', 'leisure'],
      completedAt: undefined,
      createdAt: now,
      updatedAt: now,
    },
  ]

  // Sample Habit Entries
  const habitEntries = [
    {
      id: crypto.randomUUID(),
      habitId: habits[0].id,
      date: yesterday,
      value: 6,
      notes: 'Did well, forgot evening glasses',
      completedAt: yesterday,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      habitId: habits[1].id,
      date: yesterday,
      value: 10,
      notes: 'Great meditation session',
      completedAt: yesterday,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      habitId: habits[0].id,
      date: today,
      value: 8,
      notes: 'On track!',
      completedAt: now,
      createdAt: now,
      updatedAt: now,
    },
  ]

  // Sample Streaks
  const streaks = [
    {
      id: crypto.randomUUID(),
      habitId: habits[0].id,
      current: 2,
      best: 5,
      lastCompletedDate: today,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      habitId: habits[1].id,
      current: 5,
      best: 12,
      lastCompletedDate: today,
      createdAt: now,
      updatedAt: now,
    },
  ]

  // Insert all data
  await db.habits.bulkAdd(habits)
  await db.tasks.bulkAdd(tasks)
  await db.habitEntries.bulkAdd(habitEntries)
  await db.streaks.bulkAdd(streaks)

  console.log('✅ Database seeded with sample data!')
  console.log(`- ${habits.length} habits`)
  console.log(`- ${tasks.length} tasks`)
  console.log(`- ${habitEntries.length} habit entries`)
  console.log(`- ${streaks.length} streaks`)
}
