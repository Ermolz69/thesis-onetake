import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/shared/lib'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  variant?: 'default' | 'auth'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type = 'text', variant = 'default', ...props }, ref) => {
    if (variant === 'auth') {
      return (
        <div className="w-full">
          <input
            ref={ref}
            type={type}
            placeholder={label}
            className={cn(
              'auth-input w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl',
              'text-white',
              'focus:outline-none focus:border-cyan-400/50 focus:bg-white/10',
              'focus:ring-2 focus:ring-cyan-400/20 focus:ring-offset-2 focus:ring-offset-transparent',
              'transition-all duration-300',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20',
              className
            )}
            {...props}
          />
          {error && (
            <p className="mt-2 text-sm text-red-400">{error}</p>
          )}
        </div>
      )
    }

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-fg-primary mb-1">
            {label}
          </label>
        )}
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
        {error && (
          <p className="mt-1 text-sm text-error">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

