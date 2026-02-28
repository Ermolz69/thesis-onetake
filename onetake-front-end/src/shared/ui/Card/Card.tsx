import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/lib';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'sm' | 'md' | 'lg';
}

export const Card = ({ children, className, padding = 'md', ...props }: CardProps) => {
  const paddings = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      className={cn(
        'bg-bg-primary border border-border rounded-lg shadow-md',
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
