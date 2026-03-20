import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/shared/lib';
import { inputBase, inputError, labelClass } from '@/shared/ui/auth-styles';
import {
  fieldHintError,
  fieldInput,
  fieldInputError,
  fieldInputFilled,
  fieldInputGhost,
  fieldLabel,
} from '@/shared/ui/recipes';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  variant?: 'default' | 'filled' | 'ghost' | 'auth';
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

    const variants = {
      default: fieldInput,
      filled: fieldInputFilled,
      ghost: fieldInputGhost,
    };

    return (
      <div className="w-full">
        {label && <label className={`mb-1 block ${fieldLabel}`}>{label}</label>}
        <input
          ref={ref}
          type={type}
          className={cn(
            variants[variant],
            'mt-0 disabled:cursor-not-allowed disabled:opacity-50',
            error && fieldInputError,
            className
          )}
          {...props}
        />
        {error && <p className={fieldHintError}>{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
