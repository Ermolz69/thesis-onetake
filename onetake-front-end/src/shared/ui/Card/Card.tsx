import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/lib';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'elevated' | 'muted' | 'interactive';
}

export const Card = ({
  children,
  className,
  padding = 'md',
  variant = 'default',
  ...props
}: CardProps) => {
  const paddings = {
    sm: 'p-[var(--card-padding-sm)]',
    md: 'p-[var(--card-padding-md)]',
    lg: 'p-[var(--card-padding-lg)]',
  };

  const variants = {
    default: 'bg-surface-card border border-border-soft rounded-xl shadow-sm',
    elevated: 'bg-surface-elevated border border-border-soft rounded-2xl shadow-md',
    muted: 'bg-surface-muted border border-border-soft rounded-xl shadow-xs',
    interactive:
      'bg-surface-elevated border border-border-soft rounded-2xl shadow-sm transition hover:-translate-y-[1px] hover:shadow-md',
  };

  return (
    <div
      className={cn(variants[variant], paddings[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
};
