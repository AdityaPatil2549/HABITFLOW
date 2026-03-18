import { describe, it, expect, beforeEach } from 'vitest'
import { db, type Habit, type Task } from '@/db/db'

describe('Database Integration', () => {
  beforeEach(async () => {
    // Clear test data before each test
    await db.habits.clear()
    await db.tasks.clear()
    await db.habitEntries.clear()
  })

  describe('Habits', () => {
    it('should create a habit', async () => {
      const habit: Habit = {
        id: 'test-habit-1',
        name: 'Test Habit',
        description: 'Test description',
        type: 'boolean',
        frequency: { type: 'daily' },
        category: 'Health',
        color: '#10B981',
        icon: 'Target',
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const id = await db.habits.add(habit)
      expect(id).toBe('test-habit-1')

      const retrieved = await db.habits.get(id)
      expect(retrieved?.name).toBe('Test Habit')
    })

    it('should update a habit', async () => {
      const habit: Habit = {
        id: 'test-habit-2',
        name: 'Original Name',
        type: 'boolean',
        frequency: { type: 'daily' },
        category: 'Health',
        color: '#10B981',
        icon: 'Target',
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await db.habits.add(habit)
      await db.habits.update('test-habit-2', { name: 'Updated Name' })

      const retrieved = await db.habits.get('test-habit-2')
      expect(retrieved?.name).toBe('Updated Name')
    })

    it('should delete a habit', async () => {
      const habit: Habit = {
        id: 'test-habit-3',
        name: 'To Delete',
        type: 'boolean',
        frequency: { type: 'daily' },
        category: 'Health',
        color: '#10B981',
        icon: 'Target',
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await db.habits.add(habit)
      await db.habits.delete('test-habit-3')

      const retrieved = await db.habits.get('test-habit-3')
      expect(retrieved).toBeUndefined()
    })
  })

  describe('Tasks', () => {
    it('should create a task', async () => {
      const task: Task = {
        id: 'test-task-1',
        title: 'Test Task',
        description: 'Test description',
        status: 'todo',
        priority: 'medium',
        dueDate: new Date(),
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const id = await db.tasks.add(task)
      const retrieved = await db.tasks.get(id)
      expect(retrieved?.title).toBe('Test Task')
    })

    it('should query tasks by status', async () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          title: 'Task 1',
          status: 'todo',
          priority: 'medium',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'task-2',
          title: 'Task 2',
          status: 'completed',
          priority: 'high',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      await db.tasks.bulkAdd(tasks)

      const todoTasks = await db.tasks.where('status').equals('todo').toArray()
      expect(todoTasks).toHaveLength(1)
      expect(todoTasks[0].title).toBe('Task 1')
    })
  })

  describe('Habit Entries', () => {
    it('should create a habit entry', async () => {
      const habit: Habit = {
        id: 'test-habit-entry',
        name: 'Test Habit',
        type: 'count',
        targetValue: 5,
        frequency: { type: 'daily' },
        category: 'Health',
        color: '#10B981',
        icon: 'Target',
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await db.habits.add(habit)

      const entry = {
        id: 'entry-1',
        habitId: 'test-habit-entry',
        date: '2024-01-15',
        completed: true,
        value: 5,
        createdAt: new Date(),
      }

      await db.habitEntries.add(entry)

      const entries = await db.habitEntries
        .where('habitId')
        .equals('test-habit-entry')
        .toArray()

      expect(entries).toHaveLength(1)
      expect(entries[0]?.value).toBe(5)
    })
  })
})
