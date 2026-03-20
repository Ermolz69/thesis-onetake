import { cn } from '@/shared/lib';

export interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  centered?: boolean;
}

export const Loader = ({ size = 'md', className, centered = false }: LoaderProps) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const loader = (
    <div className="relative" role="status" aria-label="Loading">
      <div className={cn('relative', sizes[size], className)}>
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-accent border-r-accent border-b-border-strong border-l-border-strong" />
        <div
          className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-text-muted border-r-accent border-b-accent border-l-text-muted"
          style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
        />
        <div className="absolute inset-2 animate-pulse rounded-full bg-accent-soft" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-1/3 w-1/3 animate-pulse rounded-full bg-accent" />
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
