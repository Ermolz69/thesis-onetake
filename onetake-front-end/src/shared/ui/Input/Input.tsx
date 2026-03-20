import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';
import { cn } from '@/shared/lib';
import {
  fieldHintError,
  fieldInput,
  fieldInputError,
  fieldInputFilled,
  fieldInputGhost,
  fieldLabel,
} from '@/shared/ui/recipes';

type InputVariant = 'outline' | 'filled' | 'ghost' | 'default';
type InputSize = 'sm' | 'md' | 'lg';
type InputRadius = 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  variant?: InputVariant;
  size?: InputSize;
  radius?: InputRadius;
  trailing?: ReactNode;
}

const variantStyles: Record<InputVariant, string> = {
  default: fieldInput,
  outline: fieldInput,
  filled: fieldInputFilled,
  ghost: fieldInputGhost,
};

const sizeStyles: Record<InputSize, string> = {
  sm: 'h-10 px-3 text-sm',
  md: 'h-input-md px-4 text-sm sm:text-base',
  lg: 'h-12 px-4 text-base',
};

const radiusStyles: Record<InputRadius, string> = {
  md: 'rounded-md',
  lg: 'rounded-xl',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      type = 'text',
      variant = 'outline',
      size = 'md',
      radius = 'lg',
      trailing,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && <label className={`mb-1 block ${fieldLabel}`}>{label}</label>}
        <div className="relative">
          <input
            ref={ref}
            type={type}
            className={cn(
              variantStyles[variant],
              'mt-0 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:[box-shadow:var(--input-ring)]',
              sizeStyles[size],
              radiusStyles[radius],
              trailing && 'pr-12',
              error && fieldInputError,
              className
            )}
            aria-invalid={!!error}
            {...props}
          />
          {trailing && (
            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center">
              {trailing}
            </div>
          )}
        </div>
        {error && <p className={fieldHintError}>{error}</p>}
        {!error && hint && <p className="mt-1.5 text-xs text-text-secondary">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
