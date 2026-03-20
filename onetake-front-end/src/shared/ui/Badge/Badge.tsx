import { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
}

export const Badge = ({ children, className, variant = 'default', ...props }: BadgeProps) => {
  const variants = {
    default: 'bg-surface-muted text-text-primary',
    primary: 'bg-accent-soft text-accent',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    error: 'bg-danger/15 text-danger',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill px-2.5 py-1 text-sm font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
