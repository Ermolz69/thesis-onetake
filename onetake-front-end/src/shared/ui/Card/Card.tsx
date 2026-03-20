import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/lib';

type CardVariant = 'solid' | 'muted' | 'outline';
type CardSize = 'sm' | 'md' | 'lg';
type CardRadius = 'md' | 'lg' | 'xl';
type CardElevation = 'flat' | 'raised' | 'floating';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  size?: CardSize;
  radius?: CardRadius;
  elevation?: CardElevation;
  variant?: CardVariant | 'default' | 'elevated' | 'interactive';
  padding?: CardSize;
}

const variantAliasMap = {
  default: { variant: 'solid' as const, elevation: 'raised' as const, interactive: false },
  elevated: { variant: 'solid' as const, elevation: 'floating' as const, interactive: false },
  interactive: { variant: 'solid' as const, elevation: 'raised' as const, interactive: true },
};

const variantStyles: Record<CardVariant, string> = {
  solid: 'border border-border-soft bg-surface-card',
  muted: 'border border-border-soft bg-surface-muted',
  outline: 'border border-border-soft bg-transparent',
};

const elevationStyles: Record<CardElevation, string> = {
  flat: 'shadow-none',
  raised: 'shadow-sm',
  floating: 'shadow-md',
};

const sizeStyles: Record<CardSize, string> = {
  sm: 'p-[var(--card-padding-sm)]',
  md: 'p-[var(--card-padding-md)]',
  lg: 'p-[var(--card-padding-lg)]',
};

const radiusStyles: Record<CardRadius, string> = {
  md: 'rounded-md',
  lg: 'rounded-xl',
  xl: 'rounded-2xl',
};

export const Card = ({
  children,
  className,
  size = 'md',
  radius = 'lg',
  elevation = 'raised',
  variant = 'solid',
  padding,
  ...props
}: CardProps) => {
  const normalized =
    variant in variantAliasMap
      ? {
          variant: variantAliasMap[variant as keyof typeof variantAliasMap].variant,
          elevation: variantAliasMap[variant as keyof typeof variantAliasMap].elevation,
          interactive:
            variantAliasMap[variant as keyof typeof variantAliasMap].interactive ?? false,
        }
      : {
          variant,
          elevation,
          interactive: false,
        };

  const appliedSize = padding ?? size;

  return (
    <div
      className={cn(
        variantStyles[normalized.variant as CardVariant],
        elevationStyles[normalized.elevation as CardElevation],
        radiusStyles[radius],
        sizeStyles[appliedSize],
        normalized.interactive &&
          'transition-[box-shadow,transform] hover:-translate-y-[1px] hover:shadow-md',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
