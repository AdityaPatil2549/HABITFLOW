import { type FC } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Target, Zap, TrendingUp } from 'lucide-react'
import { containerVariants } from '@/shared/utils/motionVariants'
import { cn } from '@/shared/utils/cn'
import { LevelProgress } from './LevelProgress'
import { AchievementsGrid } from './AchievementsGrid'
import { useUserStats, useRecentActivity, useLeaderboard } from '../hooks/useGamification'

interface GamificationDashboardProps {
  className?: string
}

export const GamificationDashboard: FC<GamificationDashboardProps> = ({ className }) => {
  const { stats } = useUserStats()
  const { activity } = useRecentActivity()
  const { leaderboard } = useLeaderboard()

  const currentUser = leaderboard.find(user => user.id === 'current-user')

  return (
    <motion.div
      className={cn('space-y-6', className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-text">Gamification</h2>
        <p className="text-muted-foreground">
          Track your achievements and progress
        </p>
      </div>

      {/* Level Progress */}
      <LevelProgress />

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Points</p>
              <p className="mt-2 text-3xl font-bold text-text">{stats.totalPoints}</p>
            </div>
            <div className="rounded-full bg-brand-100 p-3 dark:bg-brand-900">
              <Trophy className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Best Streak</p>
              <p className="mt-2 text-3xl font-bold text-text">{stats.bestStreak}</p>
            </div>
            <div className="rounded-full bg-warning/10 p-3">
              <Target className="h-6 w-6 text-warning" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Habits Created</p>
              <p className="mt-2 text-3xl font-bold text-text">{stats.totalHabits}</p>
            </div>
            <div className="rounded-full bg-success/10 p-3">
              <Zap className="h-6 w-6 text-success" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tasks Completed</p>
              <p className="mt-2 text-3xl font-bold text-text">{stats.completedTasks}</p>
            </div>
            <div className="rounded-full bg-info/10 p-3">
              <TrendingUp className="h-6 w-6 text-info" />
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <AchievementsGrid />

      {/* Recent Activity */}
      <div className="rounded-lg border border-border bg-surface p-6">
        <h3 className="text-lg font-semibold text-text mb-4">Recent Activity</h3>
        {activity.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No recent activity. Start completing habits and tasks to earn points!
          </p>
        ) : (
          <div className="space-y-3">
            {activity.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-brand-500" />
                  <div>
                    <p className="font-medium text-text">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-success">+{item.points}</p>
                  <p className="text-xs text-muted-foreground">{item.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div className="rounded-lg border border-border bg-surface p-6">
        <h3 className="text-lg font-semibold text-text mb-4">Leaderboard</h3>
        <div className="space-y-3">
          {leaderboard.map((user) => (
            <div
              key={user.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg',
                user.id === 'current-user' ? 'bg-brand-50 dark:bg-brand-900/20' : 'bg-muted/50'
              )}
            >
              <div className="flex items-center space-x-3">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                  user.rank === 1 && 'bg-yellow-500 text-white',
                  user.rank === 2 && 'bg-gray-400 text-white',
                  user.rank === 3 && 'bg-orange-600 text-white',
                  user.rank > 3 && 'bg-muted text-muted-foreground'
                )}>
                  {user.rank}
                </div>
                <div>
                  <p className="font-medium text-text">{user.username}</p>
                  <p className="text-sm text-muted-foreground">Level {user.level}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-text">{user.points} pts</p>
                {user.change !== 0 && (
                  <p className={cn(
                    'text-xs',
                    user.change > 0 ? 'text-success' : 'text-danger'
                  )}>
                    {user.change > 0 ? '↑' : '↓'} {Math.abs(user.change)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
