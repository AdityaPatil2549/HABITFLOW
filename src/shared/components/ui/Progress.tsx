import { type FC } from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/shared/utils/cn'
import type { BaseComponentProps } from '@/shared/types'

export interface ProgressProps
  extends BaseComponentProps,
    React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number
  max?: number
  color?: 'primary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
}

export const Progress: FC<ProgressProps> = ({
  className,
  value = 0,
  max = 100,
  color = 'primary',
  size = 'md',
  animated = true,
  ...props
}) => {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  const colorClasses = {
    primary: 'bg-brand-500',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  }

  return (
    <ProgressPrimitive.Root
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-secondary',
        sizeClasses[size],
        className
      )}
      value={value}
      max={max}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          'h-full w-full flex-1 transition-all',
          colorClasses[color],
          animated && 'duration-300 ease-out'
        )}
        style={{ transform: `translateX(-${100 - (value / max) * 100}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}
