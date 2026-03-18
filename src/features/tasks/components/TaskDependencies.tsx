import { type FC, useState } from 'react'
import { motion } from 'framer-motion'
import { GitBranch, CheckCircle2, Circle, X, ArrowRight } from 'lucide-react'
import { Modal } from '@/shared/components/ui/Modal'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/utils/cn'
import type { Task } from '../types'

interface TaskDependency {
  id: string
  taskId: string
  dependsOnTaskId: string
  type: 'blocks' | 'requires'
}

interface TaskDependenciesProps {
  task: Task
  allTasks: Task[]
  dependencies: TaskDependency[]
  onAddDependency: (dependsOnTaskId: string) => void
  onRemoveDependency: (dependencyId: string) => void
  className?: string
}

export const TaskDependencies: FC<TaskDependenciesProps> = ({
  task,
  allTasks,
  dependencies,
  onAddDependency,
  onRemoveDependency,
  className,
}) => {
  const [showModal, setShowModal] = useState(false)

  // Get tasks that this task depends on
  const taskDependsOn = dependencies
    .filter(d => d.taskId === task.id)
    .map(d => ({
      dependency: d,
      task: allTasks.find(t => t.id === d.dependsOnTaskId),
    }))
    .filter(item => item.task)

  // Get tasks that depend on this task
  const blocksTasks = dependencies
    .filter(d => d.dependsOnTaskId === task.id)
    .map(d => ({
      dependency: d,
      task: allTasks.find(t => t.id === d.taskId),
    }))
    .filter(item => item.task)

  // Available tasks to add as dependency (excluding self and already dependent)
  const availableTasks = allTasks.filter(
    t => t.id !== task.id && !taskDependsOn.some(d => d.task?.id === t.id)
  )

  const canComplete = taskDependsOn.every(d => d.task?.status === 'completed')

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dependency Status */}
      {!canComplete && taskDependsOn.length > 0 && (
        <div className="flex items-center space-x-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
          <GitBranch className="h-4 w-4 text-warning" />
          <span className="text-sm text-warning">
            Complete {taskDependsOn.length} prerequisite{taskDependsOn.length > 1 ? 's' : ''} first
          </span>
        </div>
      )}

      {/* This task depends on... */}
      {taskDependsOn.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">This task requires:</p>
          <div className="space-y-2">
            {taskDependsOn.map(({ dependency, task: depTask }) => (
              <div
                key={dependency.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted"
              >
                <div className="flex items-center space-x-2">
                  {depTask?.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={cn(
                    'text-sm',
                    depTask?.status === 'completed' && 'line-through text-muted-foreground'
                  )}>
                    {depTask?.title}
                  </span>
                </div>
                <button
                  onClick={() => onRemoveDependency(dependency.id)}
                  className="p-1 rounded hover:bg-accent text-muted-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks blocked by this */}
      {blocksTasks.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Blocks:</p>
          <div className="space-y-2">
            {blocksTasks.map(({ task: blockedTask }) => (
              <div
                key={blockedTask?.id}
                className="flex items-center space-x-2 p-2 rounded-lg bg-muted"
              >
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{blockedTask?.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button variant="outline" size="sm" onClick={() => setShowModal(true)}>
        <GitBranch className="h-4 w-4 mr-2" />
        {taskDependsOn.length > 0 ? 'Manage Dependencies' : 'Add Dependency'}
      </Button>

      {/* Dependency Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Task Dependencies"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This task cannot be completed until its dependencies are finished.
          </p>

          {/* Current Dependencies */}
          {taskDependsOn.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-text">Current Dependencies</p>
              <div className="space-y-2">
                {taskDependsOn.map(({ dependency, task: depTask }) => (
                  <motion.div
                    key={dependency.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full',
                          depTask?.status === 'completed' ? 'bg-success' : 'bg-warning'
                        )}
                      />
                      <span className="text-sm">{depTask?.title}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveDependency(dependency.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Dependency */}
          {availableTasks.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-text">Add Dependency</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableTasks.map(availableTask => (
                  <button
                    key={availableTask.id}
                    onClick={() => {
                      onAddDependency(availableTask.id)
                      setShowModal(false)
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-brand-500 transition-all text-left"
                  >
                    <span className="text-sm">{availableTask.title}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
