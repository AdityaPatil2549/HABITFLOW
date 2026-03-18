import { type FC, forwardRef } from 'react'
import { cn } from '@/shared/utils/cn'
import type { BaseComponentProps, FormFieldProps } from '@/shared/types'

export interface InputProps
  extends BaseComponentProps,
    FormFieldProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, required, disabled, prefix, suffix, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {prefix}
            </div>
          )}
          <input
            type={type}
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              prefix && 'pl-9',
              suffix && 'pr-9',
              error && 'border-danger',
              className
            )}
            ref={ref}
            disabled={disabled}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {suffix}
            </div>
          )}
        </div>
        {hint && !error && (
          <p className="text-xs text-muted-foreground">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-danger">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
