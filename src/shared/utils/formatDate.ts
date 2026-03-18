import { format, formatDistanceToNow, isToday, isYesterday, isTomorrow, parseISO, subDays, startOfWeek, startOfMonth } from 'date-fns'

// Re-export date-fns functions used by analytics
export { subDays, startOfWeek, startOfMonth }

/**
 * Format a date for display
 */
export const formatDate = (date: Date | string, formatStr = 'MMM d, yyyy'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatStr)
}

/**
 * Format a date with relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(dateObj, { addSuffix: true })
}

/**
 * Format date for display with smart formatting
 */
export const formatSmartDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  
  if (isToday(dateObj)) {
    return 'Today'
  }
  
  if (isYesterday(dateObj)) {
    return 'Yesterday'
  }
  
  if (isTomorrow(dateObj)) {
    return 'Tomorrow'
  }
  
  return formatDate(dateObj, 'MMM d')
}

/**
 * Format date with day of week
 */
export const formatDateWithDay = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'EEEE, MMM d, yyyy')
}

/**
 * Format time for display
 */
export const formatTime = (date: Date | string, formatStr = 'h:mm a'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatStr)
}

/**
 * Format date and time together
 */
export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'MMM d, yyyy h:mm a')
}

/**
 * Get ISO date string (YYYY-MM-DD) from date
 */
export const getISODateString = (date: Date = new Date()): string => {
  return date.toISOString().split('T')[0] || ''
}

/**
 * Check if a date is in the past
 */
export const isPast = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return dateObj < new Date()
}

/**
 * Check if a date is in the future
 */
export const isFuture = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return dateObj > new Date()
}
