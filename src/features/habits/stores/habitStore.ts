import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Habit } from '@/db/db'

export interface HabitState {
  // UI State
  selectedDate: string // ISO date string
  filterCategory: string | null
  viewMode: 'grid' | 'list'
  searchQuery: string
  
  // Editing state
  editingHabit: Habit | null
  showCreateModal: boolean
  
  // Actions
  setSelectedDate: (date: string) => void
  setFilterCategory: (category: string | null) => void
  setViewMode: (mode: 'grid' | 'list') => void
  setSearchQuery: (query: string) => void
  setEditingHabit: (habit: Habit | null) => void
  setShowCreateModal: (show: boolean) => void
  clearFilters: () => void
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedDate: new Date().toISOString().split('T')[0],
      filterCategory: null,
      viewMode: 'grid',
      searchQuery: '',
      editingHabit: null,
      showCreateModal: false,

      // Actions
      setSelectedDate: (date) => set({ selectedDate: date }),
      
      setFilterCategory: (category) => set({ filterCategory: category }),
      
      setViewMode: (mode) => set({ viewMode: mode }),
      
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      setEditingHabit: (habit) => set({ editingHabit: habit }),
      
      setShowCreateModal: (show) => set({ showCreateModal: show }),
      
      clearFilters: () => set({
        filterCategory: null,
        searchQuery: '',
      }),
    }),
    {
      name: 'habitflow-habit-state',
      partialize: (state) => ({
        selectedDate: state.selectedDate,
        filterCategory: state.filterCategory,
        viewMode: state.viewMode,
      }),
    }
  )
)
