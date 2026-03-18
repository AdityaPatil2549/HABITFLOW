import { type FC } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/utils/cn'
import type { BaseComponentProps, BadgeVariant } from '@/shared/types'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        primary: 'border-transparent bg-brand-500 text-white hover:bg-brand-600',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        success: 'border-transparent bg-success text-white hover:bg-success/80',
        warning: 'border-transparent bg-warning text-white hover:bg-warning/80',
        danger: 'border-transparent bg-danger text-white hover:bg-danger/80',
        info: 'border-transparent bg-info text-white hover:bg-info/80',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface BadgeProps
  extends BaseComponentProps,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

export const Badge: FC<BadgeProps> = ({ className, variant, size, dot, children, ...props }) => {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'mr-1 h-2 w-2 rounded-full',
            variant === 'success' && 'bg-success',
            variant === 'warning' && 'bg-warning',
            variant === 'danger' && 'bg-danger',
            variant === 'info' && 'bg-info',
            variant === 'primary' && 'bg-brand-500',
            !variant && 'bg-primary'
          )}
        />
      )}
      {children}
    </div>
  )
}
