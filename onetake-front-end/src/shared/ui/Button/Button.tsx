import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/shared/lib';

type ButtonVariant = 'solid' | 'soft' | 'outline' | 'ghost';
type ButtonTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonRadius = 'md' | 'lg' | 'pill';

type LegacyButtonVariant = 'primary' | 'secondary';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant | LegacyButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
  radius?: ButtonRadius;
  loading?: boolean;
}

const focusRing = 'focus-visible:outline-none focus-visible:[box-shadow:var(--input-ring)]';

const variantMap: Record<LegacyButtonVariant, { variant: ButtonVariant; tone: ButtonTone }> = {
  primary: { variant: 'solid', tone: 'accent' },
  secondary: { variant: 'soft', tone: 'neutral' },
};

const variantStyles: Record<ButtonVariant, string> = {
  solid: 'border border-transparent shadow-sm',
  soft: 'border border-transparent shadow-xs',
  outline: 'border bg-transparent shadow-xs',
  ghost: 'border border-transparent bg-transparent shadow-none',
};

const toneStyles: Record<ButtonTone, Record<ButtonVariant, string>> = {
  neutral: {
    solid: 'bg-surface-inverse text-text-inverse hover:opacity-92',
    soft: 'bg-surface-muted text-text-primary hover:bg-surface-elevated',
    outline:
      'border-border-soft text-text-primary hover:border-border-strong hover:bg-surface-muted',
    ghost: 'text-text-primary hover:bg-surface-muted',
  },
  accent: {
    solid: 'bg-accent text-accent-foreground hover:bg-accent-hover',
    soft: 'bg-accent-soft text-accent hover:opacity-85',
    outline: 'border-accent text-accent hover:bg-accent-soft',
    ghost: 'text-accent hover:bg-accent-soft',
  },
  success: {
    solid: 'bg-success text-text-inverse hover:opacity-92',
    soft: 'bg-success/15 text-success hover:bg-success/20',
    outline: 'border-success/40 text-success hover:bg-success/10',
    ghost: 'text-success hover:bg-success/10',
  },
  warning: {
    solid: 'bg-warning text-text-inverse hover:opacity-92',
    soft: 'bg-warning/15 text-warning hover:bg-warning/20',
    outline: 'border-warning/40 text-warning hover:bg-warning/10',
    ghost: 'text-warning hover:bg-warning/10',
  },
  danger: {
    solid: 'bg-danger text-text-inverse hover:opacity-92',
    soft: 'bg-danger/15 text-danger hover:bg-danger/20',
    outline: 'border-danger/40 text-danger hover:bg-danger/10',
    ghost: 'text-danger hover:bg-danger/10',
  },
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-button-sm px-3 text-sm',
  md: 'h-button-md px-4 text-sm sm:text-base',
  lg: 'h-button-lg px-6 text-base sm:text-lg',
};

const radiusStyles: Record<ButtonRadius, string> = {
  md: 'rounded-md',
  lg: 'rounded-xl',
  pill: 'rounded-pill',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'solid',
      tone = 'accent',
      size = 'md',
      radius = 'lg',
      children,
      disabled,
      loading,
      ...props
    },
    ref
  ) => {
    const normalized =
      variant === 'primary' || variant === 'secondary'
        ? variantMap[variant]
        : { variant, tone };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-[background-color,border-color,color,box-shadow,transform,opacity] active:translate-y-px disabled:pointer-events-none disabled:opacity-50',
          focusRing,
          variantStyles[normalized.variant],
          toneStyles[normalized.tone][normalized.variant],
          sizeStyles[size],
          radiusStyles[radius],
          className
        )}
        disabled={disabled ?? loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="mr-1 inline-flex h-4 w-4 animate-spin" aria-hidden>
              <svg className="h-full w-full" viewBox="0 0 24 24">
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
