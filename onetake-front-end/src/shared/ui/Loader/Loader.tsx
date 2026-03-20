import { cn } from '@/shared/lib';

type LoaderSize = 'sm' | 'md' | 'lg';
type LoaderTone = 'accent' | 'neutral';

export interface LoaderProps {
  size?: LoaderSize;
  tone?: LoaderTone;
  className?: string;
  centered?: boolean;
}

const sizeStyles: Record<LoaderSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
};

const toneStyles: Record<LoaderTone, { ring: string; ringAlt: string; core: string; dot: string }> = {
  accent: {
    ring: 'border-t-accent border-r-accent border-b-border-strong border-l-border-strong',
    ringAlt: 'border-t-text-muted border-r-accent border-b-accent border-l-text-muted',
    core: 'bg-accent-soft',
    dot: 'bg-accent',
  },
  neutral: {
    ring: 'border-t-text-primary border-r-text-secondary border-b-border-strong border-l-border-strong',
    ringAlt: 'border-t-text-muted border-r-text-primary border-b-text-secondary border-l-text-muted',
    core: 'bg-surface-muted',
    dot: 'bg-text-primary',
  },
};

export const Loader = ({
  size = 'md',
  tone = 'accent',
  className,
  centered = false,
}: LoaderProps) => {
  const palette = toneStyles[tone];

  const loader = (
    <div className="relative" role="status" aria-label="Loading">
      <div className={cn('relative', sizeStyles[size], className)}>
        <div
          className={cn(
            'absolute inset-0 animate-spin rounded-full border-4 border-transparent',
            palette.ring
          )}
        />
        <div
          className={cn(
            'absolute inset-0 animate-spin rounded-full border-4 border-transparent',
            palette.ringAlt
          )}
          style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
        />
        <div className={cn('absolute inset-2 animate-pulse rounded-full', palette.core)} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn('h-1/3 w-1/3 animate-pulse rounded-full', palette.dot)} />
        </div>
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (centered) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay backdrop-blur-sm">
        {loader}
      </div>
    );
  }

  return loader;
};
