import type { Task } from '@/features/tasks/types'
import { 
  ShoppingCart, 
  Briefcase, 
  Home, 
  Users, 
  Plane, 
  Heart,
  BookOpen,
  Wrench,
  Plus
} from 'lucide-react'

export interface TaskTemplate {
  id: string
  title: string
  description?: string
  priority: Task['priority']
  category: string
  icon: React.ElementType
  estimatedTime?: number // in minutes
  defaultTags: string[]
}

export const taskTemplates: TaskTemplate[] = [
  {
    id: 'grocery-shopping',
    title: 'Grocery Shopping',
    description: 'Buy weekly groceries',
    priority: 'medium',
    category: 'Personal',
    icon: ShoppingCart,
    estimatedTime: 60,
    defaultTags: ['shopping', 'errands'],
  },
  {
    id: 'work-meeting',
    title: 'Team Meeting',
    description: 'Weekly team sync meeting',
    priority: 'high',
    category: 'Work',
    icon: Briefcase,
    estimatedTime: 30,
    defaultTags: ['meeting', 'work'],
  },
  {
    id: 'clean-house',
    title: 'Clean House',
    description: 'General house cleaning',
    priority: 'medium',
    category: 'Home',
    icon: Home,
    estimatedTime: 120,
    defaultTags: ['cleaning', 'home'],
  },
  {
    id: 'call-family',
    title: 'Call Family',
    description: 'Weekly family check-in call',
    priority: 'medium',
    category: 'Personal',
    icon: Users,
    estimatedTime: 30,
    defaultTags: ['family', 'calls'],
  },
  {
    id: 'trip-planning',
    title: 'Plan Trip',
    description: 'Research and plan upcoming trip',
    priority: 'low',
    category: 'Personal',
    icon: Plane,
    estimatedTime: 90,
    defaultTags: ['travel', 'planning'],
  },
  {
    id: 'health-checkup',
    title: 'Health Checkup',
    description: 'Schedule or attend doctor appointment',
    priority: 'high',
    category: 'Health',
    icon: Heart,
    estimatedTime: 60,
    defaultTags: ['health', 'appointment'],
  },
  {
    id: 'study-session',
    title: 'Study Session',
    description: 'Focus study time for learning',
    priority: 'medium',
    category: 'Learning',
    icon: BookOpen,
    estimatedTime: 120,
    defaultTags: ['study', 'learning'],
  },
  {
    id: 'home-repair',
    title: 'Home Maintenance',
    description: 'Fix or maintain something at home',
    priority: 'medium',
    category: 'Home',
    icon: Wrench,
    estimatedTime: 180,
    defaultTags: ['maintenance', 'home'],
  },
]

export const getTaskTemplateById = (id: string): TaskTemplate | undefined => {
  return taskTemplates.find(template => template.id === id)
}

export const getTaskTemplatesByCategory = (category: string): TaskTemplate[] => {
  return taskTemplates.filter(template => template.category === category)
}

export const getAllTaskCategories = (): string[] => {
  return [...new Set(taskTemplates.map(t => t.category))]
}
