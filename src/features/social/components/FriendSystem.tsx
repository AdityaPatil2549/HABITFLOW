import { type FC } from 'react'
import { motion } from 'framer-motion'
import { Users, UserPlus, MessageCircle, Trophy, Target, CheckCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'
import { cn } from '@/shared/utils/cn'

interface Friend {
  id: string
  name: string
  avatar: string
  status: 'online' | 'offline' | 'active'
  currentStreak: number
  todayProgress: number
  lastActive: string
}

interface FriendSystemProps {
  className?: string
}

export const FriendSystem: FC<FriendSystemProps> = ({ className }) => {
  const friends: Friend[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      avatar: 'SC',
      status: 'active',
      currentStreak: 15,
      todayProgress: 80,
      lastActive: '2 min ago',
    },
    {
      id: '2',
      name: 'Mike Johnson',
      avatar: 'MJ',
      status: 'online',
      currentStreak: 8,
      todayProgress: 60,
      lastActive: '1 hr ago',
    },
    {
      id: '3',
      name: 'Emma Davis',
      avatar: 'ED',
      status: 'offline',
      currentStreak: 22,
      todayProgress: 100,
      lastActive: '5 hrs ago',
    },
    {
      id: '4',
      name: 'Alex Rivera',
      avatar: 'AR',
      status: 'active',
      currentStreak: 12,
      todayProgress: 75,
      lastActive: '10 min ago',
    },
  ]

  const getStatusColor = (status: Friend['status']) => {
    switch (status) {
      case 'online':
        return 'bg-success'
      case 'active':
        return 'bg-brand-500'
      default:
        return 'bg-muted'
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-text flex items-center space-x-2">
            <Users className="h-6 w-6 text-brand-500" />
            <span>Friends</span>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Stay accountable with friends
          </p>
        </div>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Friend
        </Button>
      </div>

      {/* Friends List */}
      <div className="space-y-3">
        {friends.map((friend, index) => (
          <motion.div
            key={friend.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-4 rounded-lg border border-border bg-surface hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-medium">
                  {friend.avatar}
                </div>
                <div
                  className={cn(
                    'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface',
                    getStatusColor(friend.status)
                  )}
                />
              </div>

              {/* Info */}
              <div>
                <h4 className="font-medium text-text">{friend.name}</h4>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span className="flex items-center space-x-1">
                    <Trophy className="h-3 w-3" />
                    <span>{friend.currentStreak} day streak</span>
                  </span>
                  <span>•</span>
                  <span>{friend.lastActive}</span>
                </div>
              </div>
            </div>

            {/* Progress & Actions */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-text">{friend.todayProgress}%</p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
              <div className="w-16">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full"
                    style={{ width: `${friend.todayProgress}%` }}
                  />
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Activity Feed */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <h4 className="font-medium text-text mb-3">Recent Activity</h4>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-sm text-text">
                <span className="font-medium">Sarah</span> completed "Morning Yoga"
              </p>
              <p className="text-xs text-muted-foreground">5 minutes ago</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <Target className="h-4 w-4 text-brand-600" />
            </div>
            <div>
              <p className="text-sm text-text">
                <span className="font-medium">Mike</span> started a new habit "Read 30 min"
              </p>
              <p className="text-xs text-muted-foreground">1 hour ago</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
              <Trophy className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-sm text-text">
                <span className="font-medium">Emma</span> reached a 30-day streak!
              </p>
              <p className="text-xs text-muted-foreground">3 hours ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invite CTA */}
      <div className="rounded-lg border border-dashed border-border p-4 text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Want to be more accountable?
        </p>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Friends
        </Button>
      </div>
    </div>
  )
}
