import { type FC } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckSquare, Plus, Filter, Grid, List, Search, Calendar } from 'lucide-react'
import { containerVariants, listItemVariants } from '@/shared/utils/motionVariants'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Badge } from '@/shared/components/ui/Badge'
import { cn } from '@/shared/utils/cn'
import { useTaskStore } from '../stores/taskStore'
import { useTasks, useTaskStats, useTasksDueToday, useOverdueTasks } from '../hooks/useTasks'
import { TaskCard } from './TaskCard'
import { TaskService } from '../services/taskService'
import { taskStatusLabels, taskPriorityLabels } from '../utils/taskUtils'
import type { Task } from '../types'
import { TaskForm } from './TaskForm'

interface TaskListProps {
  className?: string
}

export const TaskList: FC<TaskListProps> = ({ className }) => {
  const { tasks, isLoading } = useTasks()
  const { stats } = useTaskStats()
  const { tasks: dueTodayTasks } = useTasksDueToday()
  const { tasks: overdueTasks } = useOverdueTasks()
  
  const {
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    selectedStatus,
    setSelectedStatus,
    selectedPriority,
    setSelectedPriority,
    showCreateModal,
    setShowCreateModal,
    editingTask,
    setEditingTask,
  } = useTaskStore()

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    try {
      await TaskService.updateTask(id, updates)
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const handleDeleteTask = async (id: string) => {
    try {
      await TaskService.deleteTask(id)
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setShowCreateModal(true)
  }

  const handleCreateTask = async (taskData: any) => {
    try {
      await TaskService.createTask(taskData)
      setShowCreateModal(false)
      setEditingTask(null)
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const handleUpdateTaskSubmit = async (taskData: any) => {
    try {
      if (editingTask) {
        await TaskService.updateTask(editingTask.id, taskData)
        setShowCreateModal(false)
        setEditingTask(null)
      }
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with stats */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text">Tasks</h2>
          <p className="text-muted-foreground">
            {stats.total} {stats.total === 1 ? 'task' : 'tasks'} • {stats.completed} completed
          </p>
        </div>
        
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Due Today</p>
              <p className="mt-1 text-2xl font-bold text-text">{dueTodayTasks.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-warning" />
          </div>
        </div>
        
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Overdue</p>
              <p className="mt-1 text-2xl font-bold text-text">{overdueTasks.length}</p>
            </div>
            <div className="rounded-full bg-danger/10 p-2">
              <CheckSquare className="h-6 w-6 text-danger" />
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">In Progress</p>
              <p className="mt-1 text-2xl font-bold text-text">{stats.inProgress}</p>
            </div>
            <div className="rounded-full bg-info/10 p-2">
              <CheckSquare className="h-6 w-6 text-info" />
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
              <p className="mt-1 text-2xl font-bold text-text">{Math.round(stats.completionRate)}%</p>
            </div>
            <div className="rounded-full bg-success/10 p-2">
              <CheckSquare className="h-6 w-6 text-success" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            prefix={<Search className="h-4 w-4 text-muted-foreground" />}
          />
        </div>

        {/* Status Filter */}
        <div className="flex space-x-2">
          <Button
            variant={selectedStatus === 'all' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedStatus('all')}
          >
            All
          </Button>
          {Object.entries(taskStatusLabels).map(([status, label]) => (
            <Button
              key={status}
              variant={selectedStatus === status ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedStatus(status as Task['status'])}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Priority Filter */}
        <div className="flex space-x-2">
          <Button
            variant={selectedPriority === 'all' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedPriority('all')}
          >
            All Priorities
          </Button>
          {Object.entries(taskPriorityLabels).map(([priority, label]) => (
            <Button
              key={priority}
              variant={selectedPriority === priority ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedPriority(priority as Task['priority'])}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* View Mode */}
        <div className="flex space-x-1">
          <Button
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <CheckSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">No tasks yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first task to start organizing your work
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Task
          </Button>
        </div>
      ) : (
        <motion.div
          className={cn(
            viewMode === 'list' ? 'space-y-4' : 'grid gap-6 md:grid-cols-2 lg:grid-cols-3'
          )}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                variants={listItemVariants}
                layout
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <TaskCard
                  task={task}
                  onUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                  onEdit={handleEditTask}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create/Edit Task Modal */}
      <TaskForm
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setEditingTask(null)
        }}
        onSubmit={editingTask ? handleUpdateTaskSubmit : handleCreateTask}
        task={editingTask}
      />
    </div>
  )
}
