import { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error'
}

export const Badge = ({ children, className, variant = 'default', ...props }: BadgeProps) => {
  const variants = {
    default: 'bg-bg-secondary text-fg-primary',
    primary: 'bg-primary text-white',
    success: 'bg-success text-white',
    warning: 'bg-warning text-white',
    error: 'bg-error text-white',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

