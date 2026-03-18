import { type FC } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/shared/utils/cn'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  circle?: boolean
}

export const Skeleton: FC<SkeletonProps> = ({ 
  className, 
  width, 
  height, 
  circle = false 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className={cn(
        'bg-muted rounded',
        circle && 'rounded-full',
        className
      )}
      style={{ width, height }}
    />
  )
}

// Pre-built skeleton layouts for common components

export const HabitCardSkeleton: FC = () => (
  <div className="p-4 rounded-lg border border-border bg-surface space-y-3">
    <div className="flex items-center space-x-3">
      <Skeleton width={40} height={40} circle />
      <div className="flex-1 space-y-2">
        <Skeleton width="60%" height={20} />
        <Skeleton width="40%" height={14} />
      </div>
    </div>
    <Skeleton width="100%" height={8} />
    <div className="flex justify-between">
      <Skeleton width={60} height={24} />
      <Skeleton width={80} height={24} />
    </div>
  </div>
)

export const TaskCardSkeleton: FC = () => (
  <div className="p-4 rounded-lg border border-border bg-surface space-y-3">
    <div className="flex items-start space-x-3">
      <Skeleton width={20} height={20} />
      <div className="flex-1 space-y-2">
        <Skeleton width="70%" height={18} />
        <Skeleton width="50%" height={14} />
      </div>
    </div>
    <div className="flex items-center space-x-2">
      <Skeleton width={60} height={20} />
      <Skeleton width={80} height={20} />
    </div>
  </div>
)

export const DashboardStatsSkeleton: FC = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="p-4 rounded-lg border border-border bg-surface text-center space-y-2">
        <Skeleton width={48} height={32} className="mx-auto" />
        <Skeleton width="80%" height={16} className="mx-auto" />
      </div>
    ))}
  </div>
)

export const ChartSkeleton: FC = () => (
  <div className="p-6 rounded-lg border border-border bg-surface space-y-4">
    <Skeleton width={200} height={24} />
    <Skeleton width="100%" height={250} />
  </div>
)

export const ListSkeleton: FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-3">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-surface">
        <Skeleton width={40} height={40} circle />
        <div className="flex-1 space-y-2">
          <Skeleton width="70%" height={18} />
          <Skeleton width="40%" height={14} />
        </div>
      </div>
    ))}
  </div>
)

export const PageSkeleton: FC = () => (
  <div className="space-y-6 p-6">
    <Skeleton width={300} height={32} />
    <DashboardStatsSkeleton />
    <div className="grid md:grid-cols-2 gap-6">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>
    <ListSkeleton count={3} />
  </div>
)

export const ProfileSkeleton: FC = () => (
  <div className="p-6 rounded-lg border border-border bg-surface space-y-4">
    <div className="flex items-center space-x-4">
      <Skeleton width={80} height={80} circle />
      <div className="space-y-2">
        <Skeleton width={150} height={24} />
        <Skeleton width={100} height={16} />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-4 pt-4">
      <Skeleton width="100%" height={60} />
      <Skeleton width="100%" height={60} />
      <Skeleton width="100%" height={60} />
    </div>
  </div>
)

export const SettingsSkeleton: FC = () => (
  <div className="space-y-6">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="p-4 rounded-lg border border-border bg-surface space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton width={40} height={40} circle />
            <div className="space-y-1">
              <Skeleton width={120} height={18} />
              <Skeleton width={200} height={14} />
            </div>
          </div>
          <Skeleton width={50} height={28} />
        </div>
      </div>
    ))}
  </div>
)
