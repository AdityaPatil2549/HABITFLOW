import { type FC } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { containerVariants } from '@/shared/utils/motionVariants'

interface CalendarProps {
  className?: string
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  events?: Array<{
    date: Date
    type: 'habit' | 'task'
    count: number
  }>
}

export const Calendar: FC<CalendarProps> = ({ 
  className, 
  selectedDate = new Date(), 
  onDateSelect,
  events = []
}) => {
  const [currentMonth, setCurrentMonth] = new Date(selectedDate.getFullYear(), selectedDate.getMonth())
  
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }
  
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }
  
  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
  
  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }
  
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }
  
  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    onDateSelect?.(clickedDate)
  }
  
  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDay = getFirstDayOfMonth(currentMonth)
  const days = []
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day)
  }
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  const getEventsForDay = (day: number) => {
    if (!day) return []
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const dateKey = formatDateKey(date)
    return events.filter(event => formatDateKey(event.date) === dateKey)
  }
  
  const isToday = (day: number) => {
    if (!day) return false
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const today = new Date()
    return formatDateKey(date) === formatDateKey(today)
  }
  
  const isSelected = (day: number) => {
    if (!day) return false
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return formatDateKey(date) === formatDateKey(selectedDate)
  }

  return (
    <motion.div
      className={cn('bg-surface rounded-lg border border-border p-4', className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePreviousMonth}
          className="p-2 hover:bg-accent rounded-md transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        <h3 className="text-lg font-semibold text-text">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-accent rounded-md transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day)
          const isCurrentDay = isToday(day)
          const isCurrentSelected = isSelected(day)
          
          return (
            <button
              key={index}
              onClick={() => day && handleDateClick(day)}
              disabled={!day}
              className={cn(
                'aspect-square p-1 text-sm relative rounded-md transition-colors',
                day && 'hover:bg-accent cursor-pointer',
                isCurrentDay && 'bg-brand-100 dark:bg-brand-900/20',
                isCurrentSelected && 'bg-brand-500 text-white hover:bg-brand-600',
                !day && 'cursor-default'
              )}
            >
              {day && (
                <>
                  <span className={cn(
                    'text-xs',
                    isCurrentSelected && 'text-white font-medium'
                  )}>
                    {day}
                  </span>
                  
                  {/* Event indicators */}
                  {dayEvents.length > 0 && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                      {dayEvents.map((event, i) => (
                        <div
                          key={i}
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            event.type === 'habit' ? 'bg-success' : 'bg-warning'
                          )}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}
