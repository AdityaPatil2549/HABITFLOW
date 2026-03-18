import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Task } from '@/db/db'

export interface TaskState {
  // UI State
  selectedStatus: Task['status'] | 'all'
  selectedPriority: Task['priority'] | 'all'
  viewMode: 'list' | 'kanban'
  searchQuery: string
  
  // Editing state
  editingTask: Task | null
  showCreateModal: boolean
  
  // Actions
  setSelectedStatus: (status: Task['status'] | 'all') => void
  setSelectedPriority: (priority: Task['priority'] | 'all') => void
  setViewMode: (mode: 'list' | 'kanban') => void
  setSearchQuery: (query: string) => void
  setEditingTask: (task: Task | null) => void
  setShowCreateModal: (show: boolean) => void
  clearFilters: () => void
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedStatus: 'all',
      selectedPriority: 'all',
      viewMode: 'list',
      searchQuery: '',
      editingTask: null,
      showCreateModal: false,

      // Actions
      setSelectedStatus: (status) => set({ selectedStatus: status }),
      
      setSelectedPriority: (priority) => set({ selectedPriority: priority }),
      
      setViewMode: (mode) => set({ viewMode: mode }),
      
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      setEditingTask: (task) => set({ editingTask: task }),
      
      setShowCreateModal: (show) => set({ showCreateModal: show }),
      
      clearFilters: () => set({
        selectedStatus: 'all',
        selectedPriority: 'all',
        searchQuery: '',
      }),
    }),
    {
      name: 'habitflow-task-state',
      partialize: (state) => ({
        selectedStatus: state.selectedStatus,
        selectedPriority: state.selectedPriority,
        viewMode: state.viewMode,
      }),
    }
  )
)
