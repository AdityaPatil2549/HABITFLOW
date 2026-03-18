import { type FC } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  Calendar, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Tag as TagIcon
} from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { checkmarkBounce } from '@/shared/utils/motionVariants'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'
import type { Task } from '../types'
import { 
  taskStatusLabels,
  taskPriorityLabels,
  getTaskStatusColor,
  getTaskPriorityColor,
  getTaskDueDateDisplay,
  getTaskDueDateColor,
  isTaskOverdue,
  isTaskDueToday
} from '../utils/taskUtils'

interface TaskCardProps {
  task: Task
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
  className?: string
}

export const TaskCard: FC<TaskCardProps> = ({
  task,
  onUpdate,
  onDelete,
  onEdit,
  className,
}) => {
  const isCompleted = task.status === 'completed'
  const isOverdue = isTaskOverdue(task)
  const isDueToday = isTaskDueToday(task)
  
  const statusColor = getTaskStatusColor(task.status)
  const priorityColor = getTaskPriorityColor(task.priority)
  const dueDateColor = getTaskDueDateColor(task.dueDate, task.status)

  const handleStatusToggle = () => {
    let newStatus: Task['status']
    
    switch (task.status) {
      case 'todo':
        newStatus = 'in_progress'
        break
      case 'in_progress':
        newStatus = 'completed'
        break
      case 'completed':
        newStatus = 'todo'
        break
      case 'cancelled':
        newStatus = 'todo'
        break
      default:
        newStatus = 'todo'
    }
    
    onUpdate(task.id, { status: newStatus })
  }

  return (
    <motion.div
      className={cn(
        'rounded-lg border border-border bg-surface p-4 transition-all hover:shadow-md',
        isCompleted && 'opacity-75',
        isOverdue && 'border-danger/50 bg-danger/5',
        className
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          {/* Status checkbox */}
          <motion.button
            onClick={handleStatusToggle}
            className="mt-1 flex-shrink-0"
            variants={checkmarkBounce}
            animate={isCompleted ? 'checked' : 'unchecked'}
          >
            {isCompleted ? (
              <CheckCircle className="h-5 w-5 text-success" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground hover:text-text" />
            )}
          </motion.button>

          {/* Task content */}
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              'font-medium text-text truncate',
              isCompleted && 'line-through text-muted-foreground'
            )}>
              {task.title}
            </h3>
            
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Tags */}
            {task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" size="sm">
                    <TagIcon className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action menu */}
        <div className="relative group">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          <div className="absolute right-0 top-full mt-1 w-48 rounded-md border border-border bg-surface shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            <button
              onClick={() => onEdit(task)}
              className="flex items-center space-x-2 w-full px-3 py-2 text-sm hover:bg-accent text-left"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Task</span>
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="flex items-center space-x-2 w-full px-3 py-2 text-sm hover:bg-accent text-left text-danger"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer with metadata */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          {/* Status */}
          <Badge 
            variant="secondary" 
            size="sm"
            style={{ borderColor: statusColor, color: statusColor }}
          >
            {taskStatusLabels[task.status]}
          </Badge>

          {/* Priority */}
          <Badge 
            variant="outline" 
            size="sm"
            style={{ borderColor: priorityColor, color: priorityColor }}
          >
            {taskPriorityLabels[task.priority]}
          </Badge>

          {/* Due date */}
          {task.dueDate && (
            <div className={cn('flex items-center space-x-1', dueDateColor)}>
              <Calendar className="h-3 w-3" />
              <span>{getTaskDueDateDisplay(task.dueDate)}</span>
            </div>
          )}
        </div>

        {/* Completion time */}
        {task.completedAt && (
          <div className="flex items-center space-x-1 text-muted-foreground">
            <CheckCircle className="h-3 w-3" />
            <span>
              {new Date(task.completedAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Urgency indicators */}
      {isOverdue && (
        <div className="mt-2 flex items-center space-x-1 text-danger text-xs">
          <Clock className="h-3 w-3" />
          <span>Overdue</span>
        </div>
      )}

      {isDueToday && !isCompleted && (
        <div className="mt-2 flex items-center space-x-1 text-warning text-xs">
          <Clock className="h-3 w-3" />
          <span>Due today</span>
        </div>
      )}
    </motion.div>
  )
}
