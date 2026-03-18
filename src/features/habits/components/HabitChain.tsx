import { type FC } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/shared/utils/cn'
import { ChainLink } from '../utils/habitChains'

interface HabitChainProps {
  chain: ChainLink[]
  maxDisplay?: number
  className?: string
}

export const HabitChain: FC<HabitChainProps> = ({
  chain,
  maxDisplay = 14,
  className,
}) => {
  const displayChain = chain.slice(-maxDisplay)
  
  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {displayChain.map((link, index) => (
        <motion.div
          key={link.date}
          className={cn(
            'w-6 h-6 rounded-md flex items-center justify-center text-xs font-medium transition-all',
            link.completed
              ? 'bg-brand-500 text-white shadow-sm'
              : 'bg-muted text-muted-foreground'
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.03 }}
          title={`${link.date}: ${link.completed ? 'Completed' : 'Not completed'}`}
        >
          {link.completed && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </motion.div>
      ))}
    </div>
  )
}

interface ChainStatsProps {
  currentChain: number
  longestChain: number
  className?: string
}

export const ChainStats: FC<ChainStatsProps> = ({
  currentChain,
  longestChain,
  className,
}) => {
  return (
    <div className={cn('flex items-center space-x-4', className)}>
      <div className="text-center">
        <p className="text-2xl font-bold text-brand-500">{currentChain}</p>
        <p className="text-xs text-muted-foreground">Current Chain</p>
      </div>
      <div className="w-px h-8 bg-border" />
      <div className="text-center">
        <p className="text-2xl font-bold text-success">{longestChain}</p>
        <p className="text-xs text-muted-foreground">Best Chain</p>
      </div>
    </div>
  )
}
