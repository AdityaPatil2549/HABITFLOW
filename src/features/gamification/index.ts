// Public API exports for gamification feature
export { GamificationDashboard } from './components/GamificationDashboard'
export { LevelProgress } from './components/LevelProgress'
export { AchievementsGrid } from './components/AchievementsGrid'
export { 
  useAchievements, 
  useUserStats, 
  useLeaderboard, 
  useRecentActivity 
} from './hooks/useGamification'
