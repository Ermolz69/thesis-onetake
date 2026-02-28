import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/shared/lib';
import { inputBase, inputError, labelClass } from '@/shared/ui/auth-styles';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  variant?: 'default' | 'auth';
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type = 'text', variant = 'default', trailing, ...props }, ref) => {
    if (variant === 'auth') {
      return (
        <div className="w-full">
          {label && <label className={`block ${labelClass}`}>{label}</label>}
          <div className="relative">
            <input
              ref={ref}
              type={type}
              className={cn(inputBase, error && inputError, trailing && 'pr-12', className)}
              aria-invalid={!!error}
              aria-describedby={error ? undefined : undefined}
              {...props}
            />
            {trailing && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                {trailing}
              </div>
            )}
          </div>
          {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        </div>
      );
    }

    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-fg-primary mb-1">{label}</label>}
        <input
          ref={ref}
          type={type}
          className={cn(
            'w-full px-4 py-2 border border-border rounded-md',
            'bg-bg-primary text-fg-primary',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-error focus:ring-error',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-error">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
