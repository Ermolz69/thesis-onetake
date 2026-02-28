import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/shared/lib';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, loading, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
      primary:
        'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/50 active:scale-95 focus:ring-2 focus:ring-purple-500/50',
      secondary: 'bg-secondary text-white hover:bg-secondary-hover focus:ring-secondary',
      outline:
        'border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary',
      ghost: 'text-fg-primary hover:bg-bg-secondary focus:ring-primary',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-4 py-2 text-base rounded-md',
      lg: 'px-6 py-3 text-lg rounded-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
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
