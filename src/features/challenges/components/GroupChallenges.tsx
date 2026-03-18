import { type FC } from 'react'
import { motion } from 'framer-motion'
import { Users, Trophy, Calendar, Flame, ArrowRight, Plus } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Progress } from '@/shared/components/ui/Progress'
import { Badge } from '@/shared/components/ui/Badge'
import { cn } from '@/shared/utils/cn'

interface GroupChallenge {
  id: string
  title: string
  description: string
  type: 'habit_streak' | 'task_completion' | 'consistency'
  target: number
  current: number
  participants: number
  daysLeft: number
  reward: string
  joined: boolean
}

interface GroupChallengesProps {
  className?: string
}

export const GroupChallenges: FC<GroupChallengesProps> = ({ className }) => {
  const challenges: GroupChallenge[] = [
    {
      id: '1',
      title: '7-Day Meditation Marathon',
      description: 'Meditate for at least 10 minutes every day for a week',
      type: 'habit_streak',
      target: 7,
      current: 3,
      participants: 234,
      daysLeft: 4,
      reward: 'Zen Master Badge + 100 points',
      joined: true,
    },
    {
      id: '2',
      title: 'Hydration Nation',
      description: 'Drink 8 glasses of water daily. Stay hydrated together!',
      type: 'consistency',
      target: 30,
      current: 0,
      participants: 567,
      daysLeft: 30,
      reward: 'Hydration Hero Badge + 150 points',
      joined: false,
    },
    {
      id: '3',
      title: 'Productivity Sprint',
      description: 'Complete 50 tasks this month as a community',
      type: 'task_completion',
      target: 50,
      current: 12,
      participants: 189,
      daysLeft: 18,
      reward: 'Productivity Pro Badge + 200 points',
      joined: false,
    },
    {
      id: '4',
      title: 'Early Bird Challenge',
      description: 'Wake up before 6 AM for 14 days straight',
      type: 'habit_streak',
      target: 14,
      current: 8,
      participants: 123,
      daysLeft: 6,
      reward: 'Early Riser Badge + 175 points',
      joined: true,
    },
  ]

  const getChallengeIcon = (type: GroupChallenge['type']) => {
    switch (type) {
      case 'habit_streak':
        return <Flame className="h-5 w-5" />
      case 'task_completion':
        return <Trophy className="h-5 w-5" />
      case 'consistency':
        return <Calendar className="h-5 w-5" />
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-text flex items-center space-x-2">
            <Users className="h-6 w-6 text-brand-500" />
            <span>Community Challenges</span>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Join group challenges and compete with the community
          </p>
        </div>
        <Badge variant="primary" size="sm">
          {challenges.filter(c => c.joined).length} Joined
        </Badge>
      </div>

      {/* Active Challenges */}
      <div className="grid gap-4 md:grid-cols-2">
        {challenges.map((challenge, index) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              'rounded-lg border p-4 transition-all',
              challenge.joined
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10'
                : 'border-border bg-surface hover:shadow-md'
            )}
          >
            {/* Challenge Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    challenge.joined ? 'bg-brand-500 text-white' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {getChallengeIcon(challenge.type)}
                </div>
                <div>
                  <h4 className="font-semibold text-text">{challenge.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {challenge.participants} participants
                  </p>
                </div>
              </div>
              <Badge variant={challenge.joined ? 'success' : 'secondary'} size="sm">
                {challenge.joined ? 'Joined' : 'Open'}
              </Badge>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-4">
              {challenge.description}
            </p>

            {/* Progress */}
            {challenge.joined && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Your Progress</span>
                  <span className="font-medium text-text">
                    {challenge.current} / {challenge.target}
                  </span>
                </div>
                <Progress
                  value={(challenge.current / challenge.target) * 100}
                  color="primary"
                  size="sm"
                />
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                <span className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{challenge.daysLeft} days left</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Trophy className="h-3 w-3" />
                  <span>{challenge.reward.split('+')[1]?.trim() || 'Badge'}</span>
                </span>
              </div>

              <Button
                variant={challenge.joined ? 'ghost' : 'outline'}
                size="sm"
                className={cn(!challenge.joined && 'bg-brand-500 text-white hover:bg-brand-600')}
              >
                {challenge.joined ? (
                  <>
                    View Details
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Join
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Challenge CTA */}
      <div className="rounded-lg border border-dashed border-border p-6 text-center">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h4 className="font-medium text-text mb-1">Create Your Own Challenge</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Start a challenge and invite friends to join you
        </p>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Create Challenge
        </Button>
      </div>
    </div>
  )
}
