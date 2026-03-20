import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/shared/lib';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'soft' | 'outline' | 'ghost' | 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, loading, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-medium transition-[background-color,border-color,color,box-shadow,transform] focus:outline-none focus:ring-0 disabled:pointer-events-none disabled:opacity-50';

    const normalizedVariant = variant === 'primary' ? 'solid' : variant === 'secondary' ? 'soft' : variant;

    const variants = {
      solid:
        'bg-accent text-accent-foreground shadow-sm hover:bg-accent-hover active:translate-y-px',
      soft: 'bg-accent-soft text-accent hover:bg-accent-soft/80 active:translate-y-px',
      outline:
        'border border-border-soft bg-transparent text-text-primary hover:border-border-strong hover:bg-surface-muted active:translate-y-px',
      ghost: 'bg-transparent text-text-primary hover:bg-surface-muted active:translate-y-px',
    };

    const sizes = {
      sm: 'h-button-sm rounded-md px-3 text-sm',
      md: 'h-button-md rounded-xl px-4 text-sm sm:text-base',
      lg: 'h-button-lg rounded-xl px-6 text-base sm:text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[normalizedVariant], sizes[size], className)}
        disabled={disabled ?? loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 mr-2 animate-spin" aria-hidden>
              <svg className="w-full h-full" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="32"
                  strokeDashoffset="12"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
