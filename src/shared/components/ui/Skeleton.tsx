import { cn } from '@/shared/utils/cn'
import type { BaseComponentProps } from '@/shared/types'

export interface SkeletonProps extends BaseComponentProps {
  width?: string | number
  height?: string | number
  rounded?: boolean
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  width,
  height,
  rounded = true,
}) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded bg-muted',
        rounded && 'rounded-md',
        className
      )}
      style={{
        width: width || '100%',
        height: height || '1rem',
      }}
    />
  )
}
