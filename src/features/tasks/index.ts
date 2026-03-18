// Public API exports for tasks feature
export { TaskCard } from './components/TaskCard'
export { TaskList } from './components/TaskList'
export { TaskForm } from './components/TaskForm'
export { useTasks, useTaskById, useTasksByStatus, useTasksByPriority, useTasksDueToday, useOverdueTasks, useUpcomingTasks, useTaskStats, useAllTags } from './hooks/useTasks'
export { TaskService } from './services/taskService'
export { 
  taskStatusLabels, 
  taskPriorityLabels, 
  taskStatusColors,
  taskPriorityColors,
  getTaskStatusColor,
  getTaskPriorityColor,
  getTaskDueDateDisplay,
  getTaskDueDateColor,
  isTaskOverdue,
  isTaskDueToday,
  isTaskDueSoon,
  getTaskCompletionMessage,
  getTaskPriorityMessage,
  validateTask,
  createDefaultTask,
  sortTasksByPriority,
  sortTasksByDueDate,
  filterTasksBySearch
} from './utils/taskUtils'
export type { Task, CreateTask, UpdateTask, TaskStatus, TaskPriority } from './types'
