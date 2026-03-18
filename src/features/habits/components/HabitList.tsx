import { type FC } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Plus, Filter, Grid, List } from 'lucide-react'
import { containerVariants, listItemVariants } from '@/shared/utils/motionVariants'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Badge } from '@/shared/components/ui/Badge'
import { cn } from '@/shared/utils/cn'
import { useHabitStore } from '../stores/habitStore'
import { useHabits } from '../hooks/useHabits'
import { HabitCard } from './HabitCard'
import { HabitForm } from './HabitForm'
import { HabitService } from '../services/habitService'
import type { Habit } from '../types'

interface HabitListProps {
  className?: string
}

export const HabitList: FC<HabitListProps> = ({ className }) => {
  const { habits, isLoading } = useHabits()
  const {
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    showCreateModal,
    setShowCreateModal,
    editingHabit,
    setEditingHabit,
  } = useHabitStore()

  // Get unique categories from habits
  const categories = [...new Set(habits.map(habit => habit.category))]

  const handleCompleteHabit = async (habitId: string, value: number) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const existingEntry = await HabitService.getEntriesForDate(today)
      const existing = existingEntry.find(entry => entry.habitId === habitId)

      if (existing) {
        await HabitService.updateHabitEntry(existing.id, {
          value,
          completedAt: value > 0 ? new Date() : undefined,
        })
      } else {
        await HabitService.createHabitEntry({
          habitId,
          date: today,
          value,
          completedAt: value > 0 ? new Date() : undefined,
        })
      }

      // Update streak
      await HabitService.updateStreak(habitId)
    } catch (error) {
      console.error('Failed to complete habit:', error)
    }
  }

  const handleCreateHabit = async (habitData: any) => {
    try {
      await HabitService.createHabit(habitData)
      setShowCreateModal(false)
    } catch (error) {
      console.error('Failed to create habit:', error)
    }
  }

  const handleUpdateHabit = async (habitData: any) => {
    try {
      if (editingHabit) {
        await HabitService.updateHabit(editingHabit.id, habitData)
        setEditingHabit(null)
      }
    } catch (error) {
      console.error('Failed to update habit:', error)
    }
  }

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit)
  }

  const handleDeleteHabit = async (habitId: string) => {
    try {
      await HabitService.deleteHabit(habitId)
    } catch (error) {
      console.error('Failed to delete habit:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-bold text-text">Habits</h2>
          <p className="text-muted-foreground">
            {habits.length} {habits.length === 1 ? 'habit' : 'habits'} tracked
          </p>
        </div>
        
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Habit
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <Input
            placeholder="Search habits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            prefix={<Target className="h-4 w-4 text-muted-foreground" />}
          />
        </div>

        {/* Category Filter */}
        <div className="flex space-x-2">
          <Button
            variant={filterCategory === null ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilterCategory(null)}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={filterCategory === category ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* View Mode */}
        <div className="flex space-x-1">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Habits Grid/List */}
      {habits.length === 0 ? (
        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">No habits yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first habit to start tracking your progress
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Habit
          </Button>
        </div>
      ) : (
        <motion.div
          className={cn(
            viewMode === 'grid' 
              ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' 
              : 'space-y-4'
          )}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {habits.map((habit) => (
              <motion.div
                key={habit.id}
                variants={listItemVariants}
                layout
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <HabitCard
                  habit={habit}
                  onComplete={handleCompleteHabit}
                  onEdit={() => handleEditHabit(habit)}
                  onDelete={() => handleDeleteHabit(habit.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create Habit Modal */}
      <HabitForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateHabit}
      />

      {/* Edit Habit Modal */}
      <HabitForm
        isOpen={!!editingHabit}
        onClose={() => setEditingHabit(null)}
        onSubmit={handleUpdateHabit}
        initialHabit={editingHabit}
        title="Edit Habit"
      />
    </div>
  )
}
