import { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib';

type BadgeVariant = 'soft' | 'solid' | 'outline' | 'default' | 'primary';
type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  tone?: BadgeTone;
  size?: BadgeSize;
}

const variantStyles: Record<'soft' | 'solid' | 'outline', string> = {
  soft: 'border border-transparent',
  solid: 'border border-transparent',
  outline: 'border bg-transparent',
};

const toneStyles: Record<BadgeTone, Record<'soft' | 'solid' | 'outline', string>> = {
  neutral: {
    soft: 'bg-surface-muted text-text-primary',
    solid: 'bg-surface-inverse text-text-inverse',
    outline: 'border-border-soft text-text-primary',
  },
  accent: {
    soft: 'bg-accent-soft text-accent',
    solid: 'bg-accent text-accent-foreground',
    outline: 'border-accent/40 text-accent',
  },
  success: {
    soft: 'bg-success/15 text-success',
    solid: 'bg-success text-text-inverse',
    outline: 'border-success/40 text-success',
  },
  warning: {
    soft: 'bg-warning/15 text-warning',
    solid: 'bg-warning text-text-inverse',
    outline: 'border-warning/40 text-warning',
  },
  danger: {
    soft: 'bg-danger/15 text-danger',
    solid: 'bg-danger text-text-inverse',
    outline: 'border-danger/40 text-danger',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

const legacyVariantMap = {
  default: { variant: 'soft' as const, tone: 'neutral' as const },
  primary: { variant: 'soft' as const, tone: 'accent' as const },
};

export const Badge = ({
  children,
  className,
  variant = 'soft',
  tone = 'neutral',
  size = 'md',
  ...props
}: BadgeProps) => {
  const normalized =
    variant === 'default' || variant === 'primary' ? legacyVariantMap[variant] : { variant, tone };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill font-medium',
        variantStyles[normalized.variant],
        toneStyles[normalized.tone][normalized.variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
