import { type FC, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, X, Calendar, Tag, Target, CheckSquare, Clock, Zap, TrendingUp } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'
import { cn } from '@/shared/utils/cn'

interface FilterOption {
  id: string
  label: string
  type: 'category' | 'status' | 'frequency' | 'streak' | 'time' | 'priority'
  icon?: React.ReactNode
  count?: number
}

interface AdvancedFilterProps {
  onFilterChange: (filters: string[]) => void
  className?: string
}

export const AdvancedFilter: FC<AdvancedFilterProps> = ({ onFilterChange, className }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [filterLogic, setFilterLogic] = useState<'AND' | 'OR'>('AND')

  const filterCategories: { title: string; options: FilterOption[] }[] = [
    {
      title: 'Status',
      options: [
        { id: 'status-active', label: 'Active', type: 'status', icon: <Target className="h-4 w-4" />, count: 12 },
        { id: 'status-completed', label: 'Completed Today', type: 'status', icon: <CheckSquare className="h-4 w-4" />, count: 8 },
        { id: 'status-missed', label: 'Missed', type: 'status', icon: <X className="h-4 w-4" />, count: 3 },
        { id: 'status-archived', label: 'Archived', type: 'status', icon: <Calendar className="h-4 w-4" />, count: 5 },
      ],
    },
    {
      title: 'Category',
      options: [
        { id: 'cat-health', label: 'Health', type: 'category', icon: <Zap className="h-4 w-4" />, count: 5 },
        { id: 'cat-fitness', label: 'Fitness', type: 'category', icon: <TrendingUp className="h-4 w-4" />, count: 4 },
        { id: 'cat-productivity', label: 'Productivity', type: 'category', icon: <Target className="h-4 w-4" />, count: 6 },
        { id: 'cat-learning', label: 'Learning', type: 'category', icon: <Clock className="h-4 w-4" />, count: 3 },
        { id: 'cat-wellness', label: 'Wellness', type: 'category', icon: <Zap className="h-4 w-4" />, count: 4 },
      ],
    },
    {
      title: 'Frequency',
      options: [
        { id: 'freq-daily', label: 'Daily', type: 'frequency', count: 15 },
        { id: 'freq-weekly', label: 'Weekly', type: 'frequency', count: 4 },
        { id: 'freq-interval', label: 'Interval', type: 'frequency', count: 2 },
      ],
    },
    {
      title: 'Streak',
      options: [
        { id: 'streak-7', label: '7+ Days', type: 'streak', count: 8 },
        { id: 'streak-30', label: '30+ Days', type: 'streak', count: 3 },
        { id: 'streak-100', label: '100+ Days', type: 'streak', count: 1 },
        { id: 'streak-broken', label: 'Recently Broken', type: 'streak', count: 2 },
      ],
    },
    {
      title: 'Time of Day',
      options: [
        { id: 'time-morning', label: 'Morning (6-12)', type: 'time', count: 10 },
        { id: 'time-afternoon', label: 'Afternoon (12-18)', type: 'time', count: 6 },
        { id: 'time-evening', label: 'Evening (18-22)', type: 'time', count: 8 },
        { id: 'time-night', label: 'Night (22-6)', type: 'time', count: 2 },
      ],
    },
  ]

  const toggleFilter = (filterId: string) => {
    setActiveFilters(prev => {
      const newFilters = prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
      
      onFilterChange(newFilters)
      return newFilters
    })
  }

  const clearFilters = () => {
    setActiveFilters([])
    onFilterChange([])
  }

  const removeFilter = (filterId: string) => {
    setActiveFilters(prev => {
      const newFilters = prev.filter(id => id !== filterId)
      onFilterChange(newFilters)
      return newFilters
    })
  }

  // Get filter label by ID
  const getFilterLabel = (id: string): string => {
    for (const category of filterCategories) {
      const option = category.options.find(opt => opt.id === id)
      if (option) return option.label
    }
    return id
  }

  // Get filter type by ID
  const getFilterType = (id: string): string => {
    for (const category of filterCategories) {
      const option = category.options.find(opt => opt.id === id)
      if (option) return option.type
    }
    return 'unknown'
  }

  // Group active filters by type
  const groupedActiveFilters = useMemo(() => {
    const grouped: Record<string, string[]> = {}
    activeFilters.forEach(filter => {
      const type = getFilterType(filter)
      if (!grouped[type]) grouped[type] = []
      grouped[type].push(filter)
    })
    return grouped
  }, [activeFilters])

  return (
    <div className={cn('relative', className)}>
      {/* Filter Button & Active Count */}
      <div className="flex items-center space-x-2">
        <Button
          variant={activeFilters.length > 0 ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="relative"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filter
          {activeFilters.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 bg-white text-brand-600 rounded-full text-xs font-bold">
              {activeFilters.length}
            </span>
          )}
        </Button>

        {activeFilters.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filter Pills */}
      <AnimatePresence>
        {activeFilters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 mt-2"
          >
            {activeFilters.map(filter => (
              <motion.div
                key={filter}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="inline-flex items-center space-x-1 px-2 py-1 rounded-full bg-brand-100 text-brand-700 text-sm"
              >
                <span>{getFilterLabel(filter)}</span>
                <button
                  onClick={() => removeFilter(filter)}
                  className="p-0.5 hover:bg-brand-200 rounded-full transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            ))}
            
            {/* Logic Toggle */}
            {Object.keys(groupedActiveFilters).length > 1 && (
              <button
                onClick={() => setFilterLogic(prev => prev === 'AND' ? 'OR' : 'AND')}
                className="px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium hover:text-text transition-colors"
              >
                {filterLogic === 'AND' ? 'Match All' : 'Match Any'}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 w-80 bg-surface border border-border rounded-lg shadow-lg z-50"
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-text">Filter Habits</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded hover:bg-accent text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Filter Categories */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filterCategories.map(category => (
                  <div key={category.title}>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      {category.title}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {category.options.map(option => {
                        const isActive = activeFilters.includes(option.id)
                        return (
                          <button
                            key={option.id}
                            onClick={() => toggleFilter(option.id)}
                            className={cn(
                              'flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm transition-all',
                              isActive
                                ? 'bg-brand-500 text-white'
                                : 'bg-muted text-muted-foreground hover:text-text'
                            )}
                          >
                            {option.icon && <span className="mr-1">{option.icon}</span>}
                            <span>{option.label}</span>
                            {option.count !== undefined && (
                              <span className={cn(
                                'ml-1.5 px-1 rounded text-xs',
                                isActive ? 'bg-white/20' : 'bg-surface'
                              )}>
                                {option.count}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  {activeFilters.length} filter{activeFilters.length !== 1 ? 's' : ''} active
                </span>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Reset
                  </Button>
                  <Button size="sm" onClick={() => setIsOpen(false)}>
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Usage example with habit filtering logic
export const useAdvancedFilter = (habits: any[], filters: string[]) => {
  return useMemo(() => {
    if (filters.length === 0) return habits

    return habits.filter(habit => {
      // Check each filter type
      const statusMatch = filters.some(f => {
        if (f === 'status-active') return !habit.archived
        if (f === 'status-completed') return habit.completedToday
        if (f === 'status-missed') return habit.missed
        if (f === 'status-archived') return habit.archived
        return false
      })

      const categoryMatch = filters.some(f => {
        return f === `cat-${habit.category.toLowerCase()}`
      })

      const frequencyMatch = filters.some(f => {
        return f === `freq-${habit.frequency.type}`
      })

      const streakMatch = filters.some(f => {
        if (f === 'streak-7') return habit.streak >= 7
        if (f === 'streak-30') return habit.streak >= 30
        if (f === 'streak-100') return habit.streak >= 100
        if (f === 'streak-broken') return habit.recentlyBroken
        return false
      })

      // Return true if any filter type matches (OR logic between types)
      return statusMatch || categoryMatch || frequencyMatch || streakMatch
    })
  }, [habits, filters])
}
