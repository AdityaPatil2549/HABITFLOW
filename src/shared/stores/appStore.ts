import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AppState {
  // UI State
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  
  // Navigation
  currentView: 'dashboard' | 'habits' | 'tasks' | 'analytics' | 'settings'
  
  // Global loading states
  isLoading: boolean
  error: string | null
  
  // Actions
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setCurrentView: (view: AppState['currentView']) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      sidebarOpen: false,
      theme: 'system',
      currentView: 'dashboard',
      isLoading: false,
      error: null,

      // Actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      setTheme: (theme) => set({ theme }),
      
      setCurrentView: (view) => set({ currentView: view }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null }),
    }),
    {
      name: 'habitflow-app-state',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
        currentView: state.currentView,
      }),
    }
  )
)
