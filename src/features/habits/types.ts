import { z } from 'zod'

export const HabitFrequencySchema = z.object({
  type: z.enum(['daily', 'weekly', 'interval']),
  days: z.array(z.number().min(0).max(6)).optional(),
  interval: z.number().positive().optional(),
})

export const HabitSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['boolean', 'count', 'duration', 'rating']),
  frequency: HabitFrequencySchema,
  targetValue: z.number().positive().optional(),
  category: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().min(1).max(50),
  archived: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const HabitEntrySchema = z.object({
  id: z.string().uuid(),
  habitId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  value: z.number().min(0),
  completedAt: z.date().optional(),
  notes: z.string().max(1000).optional(),
})

export const CreateHabitSchema = HabitSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const UpdateHabitSchema = CreateHabitSchema.partial()

export const CreateHabitEntrySchema = HabitEntrySchema.omit({
  id: true,
  completedAt: true,
})

export type Habit = z.infer<typeof HabitSchema>
export type CreateHabit = z.infer<typeof CreateHabitSchema>
export type UpdateHabit = z.infer<typeof UpdateHabitSchema>
export type HabitEntry = z.infer<typeof HabitEntrySchema>
export type CreateHabitEntry = z.infer<typeof CreateHabitEntrySchema>
export type HabitFrequency = z.infer<typeof HabitFrequencySchema>
