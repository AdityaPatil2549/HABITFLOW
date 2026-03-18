import { type FC, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

interface HeatmapData {
  date: string
  value: number
  maxValue: number
}

interface HabitHeatmapProps {
  data: HeatmapData[]
  year?: number
  className?: string
}

export const HabitHeatmap: FC<HabitHeatmapProps> = ({ data, year = new Date().getFullYear(), className }) => {
  const [selectedYear, setSelectedYear] = useState(year)
  
  // Generate full year data
  const generateYearData = (): HeatmapData[] => {
    const yearData: HeatmapData[] = []
    const startDate = new Date(selectedYear, 0, 1)
    const endDate = new Date(selectedYear, 11, 31)
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const existingData = data.find(item => item.date === dateStr)
      
      yearData.push({
        date: dateStr,
        value: existingData?.value || 0,
        maxValue: existingData?.maxValue || 1,
      })
    }
    
    return yearData
  }
  
  const yearData = generateYearData()
  
  // Get color intensity based on value
  const getColor = (value: number, maxValue: number): string => {
    if (value === 0) return 'var(--color-muted)'
    
    const intensity = value / maxValue
    if (intensity <= 0.25) return '#BBF7D0' // Light green
    if (intensity <= 0.5) return '#86EFAC'
    if (intensity <= 0.75) return '#4ADE80'
    return '#16A34A' // Dark green
  }
  
  // Group by weeks for grid layout
  const weeks: HeatmapData[][] = []
  let currentWeek: HeatmapData[] = []
  
  // Pad start to align with Monday
  const firstDay = new Date(selectedYear, 0, 1).getDay()
  const padDays = firstDay === 0 ? 6 : firstDay - 1
  
  for (let i = 0; i < padDays; i++) {
    currentWeek.push({ date: '', value: -1, maxValue: 1 }) // Empty cell
  }
  
  yearData.forEach((day) => {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  })
  
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ date: '', value: -1, maxValue: 1 })
    }
    weeks.push(currentWeek)
  }
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  
  // Calculate stats
  const totalDays = yearData.filter(d => d.value > 0).length
  const totalValue = yearData.reduce((sum, d) => sum + d.value, 0)
  const maxStreak = calculateMaxStreak(yearData)
  const currentStreak = calculateCurrentStreak(yearData)
  
  function calculateMaxStreak(data: HeatmapData[]): number {
    let maxStreak = 0
    let currentStreak = 0
    
    for (const day of data) {
      if (day.value > 0) {
        currentStreak++
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    }
    
    return maxStreak
  }
  
  function calculateCurrentStreak(data: HeatmapData[]): number {
    let streak = 0
    const reversed = [...data].reverse()
    
    for (const day of reversed) {
      if (day.value > 0) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="h-5 w-5 text-brand-500" />
          <h3 className="text-lg font-semibold text-text">Completion Heatmap</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedYear(selectedYear - 1)}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground"
            title="Previous year"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-medium text-text w-16 text-center">{selectedYear}</span>
          <button
            onClick={() => setSelectedYear(selectedYear + 1)}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground"
            title="Next year"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="p-3 rounded-lg bg-muted text-center">
          <p className="text-2xl font-bold text-text">{totalDays}</p>
          <p className="text-xs text-muted-foreground">Active Days</p>
        </div>
        <div className="p-3 rounded-lg bg-muted text-center">
          <p className="text-2xl font-bold text-text">{totalValue}</p>
          <p className="text-xs text-muted-foreground">Total Count</p>
        </div>
        <div className="p-3 rounded-lg bg-muted text-center">
          <p className="text-2xl font-bold text-success">{maxStreak}</p>
          <p className="text-xs text-muted-foreground">Best Streak</p>
        </div>
        <div className="p-3 rounded-lg bg-muted text-center">
          <p className="text-2xl font-bold text-brand-500">{currentStreak}</p>
          <p className="text-xs text-muted-foreground">Current Streak</p>
        </div>
      </div>
      
      {/* Heatmap */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Month labels */}
          <div className="flex ml-12 mb-2">
            {months.map((month, _i) => (
              <div key={month} className="flex-1 text-xs text-muted-foreground text-center">
                {month}
              </div>
            ))}
          </div>
          
          <div className="flex">
            {/* Weekday labels */}
            <div className="flex flex-col justify-around mr-2 w-10">
              {weekDays.map((day, index) => (
                <div 
                  key={day} 
                  className={cn(
                    "text-xs text-muted-foreground text-right pr-2",
                    index % 2 === 1 && "invisible" // Show every other day for cleaner look
                  )}
                >
                  {day}
                </div>
              ))}
            </div>
            
            {/* Grid */}
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => (
                    <motion.div
                      key={`${weekIndex}-${dayIndex}`}
                      className={cn(
                        "w-3 h-3 rounded-sm",
                        day.value === -1 ? "invisible" : "cursor-pointer hover:ring-2 hover:ring-brand-500"
                      )}
                      style={{
                        backgroundColor: day.value === -1 ? 'transparent' : getColor(day.value, day.maxValue),
                      }}
                      whileHover={{ scale: 1.2 }}
                      title={day.date ? `${day.date}: ${day.value} completions` : ''}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'var(--color-muted)' }} />
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#BBF7D0' }} />
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#86EFAC' }} />
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#4ADE80' }} />
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#16A34A' }} />
        </div>
        <span>More</span>
      </div>
    </div>
  )
}
