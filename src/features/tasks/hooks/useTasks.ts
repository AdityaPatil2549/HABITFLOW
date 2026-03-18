import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { useTaskStore } from '../stores/taskStore'

export const useTasks = () => {
  const { selectedStatus, selectedPriority, searchQuery } = useTaskStore()

  const tasks = useLiveQuery(
    () => {
      let query = db.tasks.orderBy('createdAt').reverse()
      
      if (selectedStatus !== 'all') {
        query = query.filter(task => task.status === selectedStatus)
      }
      
      if (selectedPriority !== 'all') {
        query = query.filter(task => task.priority === selectedPriority)
      }
      
      if (searchQuery) {
        const lowercaseQuery = searchQuery.toLowerCase()
        query = query.filter(task => 
          task.title.toLowerCase().includes(lowercaseQuery) ||
          task.description?.toLowerCase().includes(lowercaseQuery) ||
          task.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
        )
      }
      
      return query.toArray()
    },
    [selectedStatus, selectedPriority, searchQuery]
  )

  return {
    tasks: tasks ?? [],
    isLoading: tasks === undefined,
  }
}

export const useTaskById = (id: string) => {
  const task = useLiveQuery(() => db.tasks.get(id), [id])
  
  return {
    task: task ?? null,
    isLoading: task === undefined,
  }
}

export const useTasksByStatus = (status: Task['status']) => {
  const tasks = useLiveQuery(() => 
    db.tasks.where('status').equals(status).toArray(),
    [status]
  )

  return {
    tasks: tasks ?? [],
    isLoading: tasks === undefined,
  }
}

export const useTasksByPriority = (priority: Task['priority']) => {
  const tasks = useLiveQuery(() => 
    db.tasks.where('priority').equals(priority).toArray(),
    [priority]
  )

  return {
    tasks: tasks ?? [],
    isLoading: tasks === undefined,
  }
}

export const useTasksDueToday = () => {
  const tasks = useLiveQuery(async () => {
    const today = new Date().toISOString().split('T')[0]
    return db.tasks
      .where('dueDate')
      .equals(today)
      .and(task => task.status !== 'completed')
      .toArray()
  })

  return {
    tasks: tasks ?? [],
    isLoading: tasks === undefined,
  }
}

export const useOverdueTasks = () => {
  const tasks = useLiveQuery(async () => {
    const today = new Date().toISOString().split('T')[0]
    return db.tasks
      .where('dueDate')
      .below(today)
      .and(task => task.status !== 'completed')
      .toArray()
  })

  return {
    tasks: tasks ?? [],
    isLoading: tasks === undefined,
  }
}

export const useUpcomingTasks = (days = 7) => {
  const tasks = useLiveQuery(async () => {
    const today = new Date()
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)
    const futureDateString = futureDate.toISOString().split('T')[0]
    
    return db.tasks
      .where('dueDate')
      .between(today.toISOString().split('T')[0], futureDateString)
      .and(task => task.status !== 'completed')
      .toArray()
  }, [days])

  return {
    tasks: tasks ?? [],
    isLoading: tasks === undefined,
  }
}

export const useTaskStats = () => {
  const stats = useLiveQuery(async () => {
    const [allTasks, completedTasks, inProgressTasks, todoTasks, overdueTasks, dueTodayTasks] = await Promise.all([
      db.tasks.toArray(),
      db.tasks.where('status').equals('completed').toArray(),
      db.tasks.where('status').equals('in_progress').toArray(),
      db.tasks.where('status').equals('todo').toArray(),
      (async () => {
        const today = new Date().toISOString().split('T')[0]
        return db.tasks
          .where('dueDate')
          .below(today)
          .and(task => task.status !== 'completed')
          .toArray()
      })(),
      (async () => {
        const today = new Date().toISOString().split('T')[0]
        return db.tasks
          .where('dueDate')
          .equals(today)
          .and(task => task.status !== 'completed')
          .toArray()
      })(),
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
  }, [])

  return {
    stats: stats ?? {
      total: 0,
      completed: 0,
      inProgress: 0,
      todo: 0,
      overdue: 0,
      dueToday: 0,
      completionRate: 0,
    },
    isLoading: stats === undefined,
  }
}

export const useAllTags = () => {
  const tags = useLiveQuery(async () => {
    const tasks = await db.tasks.toArray()
    const allTags = tasks.flatMap(task => task.tags)
    return [...new Set(allTags)].sort()
  }, [])

  return {
    tags: tags ?? [],
    isLoading: tags === undefined,
  }
}
