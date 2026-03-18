import { type FC } from 'react'
import { motion } from 'framer-motion'
import { Snowflake, Sun, Leaf, Flower2, Gift, Sparkles, Clock, Target } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'
import { Progress } from '@/shared/components/ui/Progress'
import { cn } from '@/shared/utils/cn'

interface SeasonalEvent {
  id: string
  name: string
  description: string
  season: 'winter' | 'spring' | 'summer' | 'fall' | 'holiday'
  startDate: string
  endDate: string
  type: 'challenge' | 'collection' | 'milestone'
  reward: string
  progress: number
  target: number
  completed: boolean
  icon: string
}

interface SeasonalEventsProps {
  className?: string
}

const seasonIcons: Record<string, React.ReactNode> = {
  winter: <Snowflake className="h-6 w-6" />,
  spring: <Flower2 className="h-6 w-6" />,
  summer: <Sun className="h-6 w-6" />,
  fall: <Leaf className="h-6 w-6" />,
  holiday: <Gift className="h-6 w-6" />,
}

const seasonColors: Record<string, string> = {
  winter: '#0EA5E9',
  spring: '#10B981',
  summer: '#F59E0B',
  fall: '#D97706',
  holiday: '#DC2626',
}

export const SeasonalEvents: FC<SeasonalEventsProps> = ({ className }) => {
  const events: SeasonalEvent[] = [
    {
      id: '1',
      name: 'Spring Refresh',
      description: 'Complete 20 habits related to health and wellness',
      season: 'spring',
      startDate: '2026-03-20',
      endDate: '2026-06-20',
      type: 'challenge',
      reward: 'Spring Champion Badge + 250 points',
      progress: 12,
      target: 20,
      completed: false,
      icon: 'flower',
    },
    {
      id: '2',
      name: 'Summer Streak Challenge',
      description: 'Maintain a 30-day streak on any habit',
      season: 'summer',
      startDate: '2026-06-21',
      endDate: '2026-09-22',
      type: 'challenge',
      reward: 'Summer Warrior Badge + 300 points',
      progress: 0,
      target: 30,
      completed: false,
      icon: 'sun',
    },
    {
      id: '3',
      name: 'Holiday Hustle',
      description: 'Complete 50 tasks during the holiday season',
      season: 'holiday',
      startDate: '2026-12-01',
      endDate: '2026-12-31',
      type: 'collection',
      reward: 'Holiday Hero Badge + 500 points',
      progress: 0,
      target: 50,
      completed: false,
      icon: 'gift',
    },
    {
      id: '4',
      name: 'New Year Resolution',
      description: 'Create and maintain 3 new habits for 21 days',
      season: 'winter',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      type: 'milestone',
      reward: 'Resolution Keeper Badge + 400 points',
      progress: 2,
      target: 3,
      completed: false,
      icon: 'sparkles',
    },
  ]

  const currentEvent = events[0] // Spring Refresh

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-text flex items-center space-x-2">
            <Clock className="h-6 w-6 text-brand-500" />
            <span>Seasonal Events</span>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Limited-time events with exclusive rewards
          </p>
        </div>
      </div>

      {/* Active Event Hero */}
      <motion.div
        className="rounded-xl p-6 text-white relative overflow-hidden"
        style={{ backgroundColor: seasonColors[currentEvent.season] }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-2">
            {seasonIcons[currentEvent.season]}
            <Badge variant="secondary" className="bg-white/20 text-white border-0">
              Active Now
            </Badge>
          </div>
          <h2 className="text-2xl font-bold mb-1">{currentEvent.name}</h2>
          <p className="text-white/80 mb-4">{currentEvent.description}</p>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/80">Progress</span>
              <span className="font-medium">
                {currentEvent.progress} / {currentEvent.target}
              </span>
            </div>
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(currentEvent.progress / currentEvent.target) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
            <div className="text-sm">
              <span className="text-white/60">Reward: </span>
              <span className="font-medium">{currentEvent.reward}</span>
            </div>
            <Button variant="secondary" size="sm" className="bg-white text-gray-900 hover:bg-white/90">
              View Details
            </Button>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      </motion.div>

      {/* Upcoming Events */}
      <div>
        <h4 className="font-medium text-text mb-3">Upcoming Events</h4>
        <div className="space-y-3">
          {events.slice(1).map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-surface"
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: seasonColors[event.season] }}
                >
                  {seasonIcons[event.season]}
                </div>
                <div>
                  <h5 className="font-medium text-text">{event.name}</h5>
                  <p className="text-xs text-muted-foreground">
                    Starts {new Date(event.startDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Badge variant="outline" size="sm">
                {event.reward.split('+')[1]?.trim() || 'Badge'}
              </Badge>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Past Events Summary */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <h4 className="font-medium text-text mb-3">Your Event History</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-text">3</p>
            <p className="text-xs text-muted-foreground">Events Completed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-text">850</p>
            <p className="text-xs text-muted-foreground">Points Earned</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-text">5</p>
            <p className="text-xs text-muted-foreground">Badges Collected</p>
          </div>
        </div>
      </div>
    </div>
  )
}
