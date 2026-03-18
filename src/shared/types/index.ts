// Re-export database types
export type {
  Habit,
  HabitEntry,
  Task,
  Streak,
  Achievement,
  UserAchievement,
  UserSettings,
} from '@/db/db'

// Common UI types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface LoadingState {
  isLoading: boolean
  error?: string | null
}

export interface PaginationState {
  page: number
  limit: number
  total: number
}

// Form types
export interface FormFieldProps {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
}

// Chart types
export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

export interface ChartConfig {
  height?: number
  showGrid?: boolean
  showTooltip?: boolean
  showLegend?: boolean
  color?: string
}

// Modal types
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnBackdrop?: boolean
  children?: React.ReactNode
  className?: string
}

// Drawer types
export interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  side?: 'left' | 'right' | 'bottom'
  size?: 'sm' | 'md' | 'lg' | 'full'
}

// Tooltip types
export interface TooltipProps {
  content: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  delay?: number
}

// Badge variants
export type BadgeVariant = 
  | 'default' 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'info'

// Button variants
export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'ghost' 
  | 'danger' 
  | 'outline'

export type ButtonSize = 'sm' | 'md' | 'lg'

// Input types
export type InputType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number' 
  | 'tel' 
  | 'url' 
  | 'search'

// View modes
export type ViewMode = 'grid' | 'list' | 'kanban'

// Priority levels
export type Priority = 'low' | 'medium' | 'high' | 'urgent'

// Status types
export type Status = 'todo' | 'in_progress' | 'completed' | 'cancelled'

// Habit types
export type HabitType = 'boolean' | 'count' | 'duration' | 'rating'

export type FrequencyType = 'daily' | 'weekly' | 'interval'
