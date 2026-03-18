import type { Task, TaskStatus, TaskPriority } from '@/shared/types'
import { formatSmartDate, isPast, isFuture } from '@/shared/utils/formatDate'

export const taskStatusLabels: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const taskPriorityLabels: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

export const taskStatusColors: Record<TaskStatus, string> = {
  todo: '#64748B', // muted-foreground
  in_progress: '#0D9488', // info
  completed: '#16A34A', // success
  cancelled: '#94A3B8', // muted
}

export const taskPriorityColors: Record<TaskPriority, string> = {
  low: '#64748B', // muted-foreground
  medium: '#D97706', // warning
  high: '#DC2626', // danger
  urgent: '#DC2626', // danger
}

export const getTaskStatusColor = (status: TaskStatus): string => {
  return taskStatusColors[status]
}

export const getTaskPriorityColor = (priority: TaskPriority): string => {
  return taskPriorityColors[priority]
}

export const getTaskDueDateDisplay = (dueDate?: Date | string, status?: TaskStatus): string => {
  if (!dueDate) return 'No due date'
  
  const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
  
  // Only show overdue if the date is in the past AND task is not completed
  if (isPast(date) && status !== 'completed' && status !== 'cancelled') {
    return `Overdue (${formatSmartDate(date)})`
  }
  
  return formatSmartDate(date)
}

export const getTaskDueDateColor = (dueDate?: Date | string, status?: TaskStatus): string => {
  if (!dueDate || status === 'completed') return 'text-muted-foreground'
  
  const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
  
  if (isPast(date) && !isToday(date)) {
    return 'text-danger'
  }
  
  if (isToday(date)) {
    return 'text-warning'
  }
  
  return 'text-muted-foreground'
}

export const isTaskOverdue = (task: Task): boolean => {
  if (!task.dueDate || task.status === 'completed' || task.status === 'cancelled') {
    return false
  }
  
  const dueDate = typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  dueDate.setHours(0, 0, 0, 0)
  
  return dueDate < today
}

export const isTaskDueToday = (task: Task): boolean => {
  if (!task.dueDate) return false
  
  const dueDate = typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate
  const today = new Date()
  
  return (
    dueDate.getDate() === today.getDate() &&
    dueDate.getMonth() === today.getMonth() &&
    dueDate.getFullYear() === today.getFullYear()
  )
}

export const isTaskDueSoon = (task: Task, days = 3): boolean => {
  if (!task.dueDate || task.status === 'completed' || task.status === 'cancelled') {
    return false
  }
  
  const dueDate = typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate
  const today = new Date()
  const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)
  
  return dueDate <= futureDate && dueDate > today
}

export const getTaskCompletionMessage = (task: Task): string => {
  switch (task.status) {
    case 'completed':
      return 'Great job! This task is completed. 🎉'
    case 'in_progress':
      return `You're working on "${task.title}". Keep it up! 💪`
    case 'cancelled':
      return `This task was cancelled.`
    case 'todo':
    default:
      if (isTaskOverdue(task)) {
        return `This task is overdue. Time to get it done! ⚠️`
      }
      if (isTaskDueToday(task)) {
        return `This task is due today. Let's do it! 🔥`
      }
      if (isTaskDueSoon(task)) {
        return `This task is due soon. Plan accordingly! 📅`
      }
      return `Ready to tackle "${task.title}"? 🚀`
  }
}

export const getTaskPriorityMessage = (priority: TaskPriority): string => {
  switch (priority) {
    case 'urgent':
      return 'This task requires immediate attention! 🚨'
    case 'high':
      return 'This task is high priority. Focus on it soon! 🔥'
    case 'medium':
      return 'This task has medium priority. Balance it with others! ⚖️'
    case 'low':
      return 'This task has low priority. Handle it when you have time! 🌱'
    default:
      return ''
  }
}

export const validateTask = (task: Partial<Task>): string[] => {
  const errors: string[] = []
  
  if (!task.title || task.title.trim().length === 0) {
    errors.push('Task title is required')
  }
  
  if (task.title && task.title.length > 200) {
    errors.push('Task title must be less than 200 characters')
  }
  
  if (task.description && task.description.length > 1000) {
    errors.push('Task description must be less than 1000 characters')
  }
  
  if (task.dueDate) {
    const dueDate = typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate
    if (isNaN(dueDate.getTime())) {
      errors.push('Invalid due date')
    } else if (dueDate < new Date(2000, 0, 1)) {
      errors.push('Due date cannot be in the distant past')
    } else if (dueDate > new Date(2100, 11, 31)) {
      errors.push('Due date cannot be too far in the future')
    }
  }
  
  if (task.tags && task.tags.some(tag => tag.trim().length === 0)) {
    errors.push('Tags cannot be empty')
  }
  
  if (task.tags && task.tags.some(tag => tag.length > 50)) {
    errors.push('Tags must be less than 50 characters each')
  }
  
  return errors
}

export const createDefaultTask = (): Partial<Task> => ({
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  tags: [],
})

export const sortTasksByPriority = (tasks: Task[]): Task[] => {
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
  return tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
}

export const sortTasksByDueDate = (tasks: Task[]): Task[] => {
  return tasks.sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    
    const dateA = typeof a.dueDate === 'string' ? new Date(a.dueDate) : a.dueDate
    const dateB = typeof b.dueDate === 'string' ? new Date(b.dueDate) : b.dueDate
    
    return dateA.getTime() - dateB.getTime()
  })
}

export const filterTasksBySearch = (tasks: Task[], query: string): Task[] => {
  if (!query.trim()) return tasks
  
  const lowercaseQuery = query.toLowerCase()
  return tasks.filter(task =>
    task.title.toLowerCase().includes(lowercaseQuery) ||
    task.description?.toLowerCase().includes(lowercaseQuery) ||
    task.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  )
}

// Helper function to check if a date is today
const isToday = (date: Date): boolean => {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}
