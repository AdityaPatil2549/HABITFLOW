import { z } from 'zod'

export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  status: z.enum(['todo', 'in_progress', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.date().optional(),
  completedAt: z.date().optional(),
  habitId: z.string().uuid().optional(),
  tags: z.array(z.string().min(1).max(50)),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const CreateTaskSchema = TaskSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
})

export const UpdateTaskSchema = CreateTaskSchema.partial()

export type Task = z.infer<typeof TaskSchema>
export type CreateTask = z.infer<typeof CreateTaskSchema>
export type UpdateTask = z.infer<typeof UpdateTaskSchema>
export type TaskStatus = z.infer<typeof TaskSchema>['status']
export type TaskPriority = z.infer<typeof TaskSchema>['priority']
