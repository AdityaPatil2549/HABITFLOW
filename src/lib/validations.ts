import { z } from 'zod';

export const habitSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(50, 'Name is too long'),
    icon: z.string().min(1, 'Icon is required'),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
    category: z.string().min(1, 'Category is required'),
    type: z.enum(['boolean', 'count', 'duration', 'rating']),
    frequency: z.enum(['daily', 'weekly', 'custom']),
    frequencyDays: z.array(z.number().min(0).max(6)).optional(),
    frequencyInterval: z.number().min(1).optional(),
    targetValue: z.number().min(1, 'Target must be at least 1'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    graceDayEnabled: z.boolean(),
    archived: z.boolean().default(false),
  })
  .refine(
    data => {
      if (data.frequency === 'weekly' && (!data.frequencyDays || data.frequencyDays.length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: 'Weekly habits must have at least one selected day',
      path: ['frequencyDays'],
    }
  );

export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().optional(),
  priority: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  dueDate: z.string().optional(),
  labels: z.array(z.string()),
  recurring: z.enum(['none', 'daily', 'weekly', 'monthly', 'custom']),
  completed: z.boolean().default(false),
  parentId: z.string().optional(),
  projectId: z.string().optional(),
});
