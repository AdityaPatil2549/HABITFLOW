import { db, type Task } from '@/db/db'

export class TaskService {
  // Task CRUD operations
  static async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const id = crypto.randomUUID()
    const now = new Date()
    const newTask: Task = {
      ...task,
      id,
      createdAt: now,
      updatedAt: now,
    }
    
    await db.tasks.add(newTask)
    return newTask
  }

  static async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const task = await db.tasks.get(id)
    if (!task) {
      throw new Error('Task not found')
    }
    
    const updatedTask = { 
      ...task, 
      ...updates, 
      updatedAt: new Date(),
      // Auto-set completedAt when status changes to completed
      completedAt: updates.status === 'completed' && task.status !== 'completed' 
        ? new Date() 
        : updates.completedAt || task.completedAt
    }
    
    await db.tasks.update(id, updatedTask)
    return updatedTask
  }

  static async deleteTask(id: string): Promise<void> {
    await db.tasks.delete(id)
  }

  static async getTasks(): Promise<Task[]> {
    return db.tasks.orderBy('createdAt').reverse().toArray()
  }

  static async getTaskById(id: string): Promise<Task | undefined> {
    return db.tasks.get(id)
  }

  // Filter operations
  static async getTasksByStatus(status: Task['status']): Promise<Task[]> {
    return db.tasks.where('status').equals(status).toArray()
  }

  static async getTasksByPriority(priority: Task['priority']): Promise<Task[]> {
    return db.tasks.where('priority').equals(priority).toArray()
  }

  static async getTasksByHabit(habitId: string): Promise<Task[]> {
    return db.tasks.where('habitId').equals(habitId).toArray()
  }

  static async getTasksDueToday(): Promise<Task[]> {
    const today = new Date().toISOString().split('T')[0]
    return db.tasks
      .where('dueDate')
      .equals(today)
      .and(task => task.status !== 'completed')
      .toArray()
  }

  static async getOverdueTasks(): Promise<Task[]> {
    const today = new Date().toISOString().split('T')[0]
    return db.tasks
      .where('dueDate')
      .below(today)
      .and(task => task.status !== 'completed')
      .toArray()
  }

  static async getUpcomingTasks(days = 7): Promise<Task[]> {
    const today = new Date()
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)
    const futureDateString = futureDate.toISOString().split('T')[0]
    
    return db.tasks
      .where('dueDate')
      .between(today.toISOString().split('T')[0], futureDateString)
      .and(task => task.status !== 'completed')
      .toArray()
  }

  // Search operations
  static async searchTasks(query: string): Promise<Task[]> {
    const lowercaseQuery = query.toLowerCase()
    return db.tasks
      .filter(task => 
        task.title.toLowerCase().includes(lowercaseQuery) ||
        task.description?.toLowerCase().includes(lowercaseQuery) ||
        task.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      )
      .toArray()
  }

  // Bulk operations
  static async markTasksComplete(taskIds: string[]): Promise<void> {
    await db.tasks.bulkUpdate(
      taskIds,
      taskIds.map(id => ({
        status: 'completed' as const,
        completedAt: new Date(),
        updatedAt: new Date(),
      }))
    )
  }

  static async deleteTasks(taskIds: string[]): Promise<void> {
    await db.tasks.bulkDelete(taskIds)
  }

  // Analytics
  static async getTaskStats(): Promise<{
    total: number
    completed: number
    inProgress: number
    todo: number
    overdue: number
    dueToday: number
    completionRate: number
  }> {
    const [allTasks, completedTasks, inProgressTasks, todoTasks, overdueTasks, dueTodayTasks] = await Promise.all([
      db.tasks.toArray(),
      this.getTasksByStatus('completed'),
      this.getTasksByStatus('in_progress'),
      this.getTasksByStatus('todo'),
      this.getOverdueTasks(),
      this.getTasksDueToday(),
    ])

    return {
      total: allTasks.length,
      completed: completedTasks.length,
      inProgress: inProgressTasks.length,
      todo: todoTasks.length,
      overdue: overdueTasks.length,
      dueToday: dueTodayTasks.length,
      completionRate: allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0,
    }
  }

  static async getTasksByDateRange(startDate: string, endDate: string): Promise<Task[]> {
    return db.tasks
      .where('dueDate')
      .between(startDate, endDate)
      .toArray()
  }

  // Tag operations
  static async getAllTags(): Promise<string[]> {
    const tasks = await db.tasks.toArray()
    const allTags = tasks.flatMap(task => task.tags)
    return [...new Set(allTags)].sort()
  }

  static async getTasksByTag(tag: string): Promise<Task[]> {
    return db.tasks
      .filter(task => task.tags.includes(tag))
      .toArray()
  }
}
