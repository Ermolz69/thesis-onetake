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
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 border-r-purple-400 border-b-pink-400 border-l-purple-400 animate-spin" />
        <div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-400 border-r-cyan-400 border-b-purple-400 border-l-cyan-400 animate-spin"
          style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
        />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1/3 h-1/3 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 animate-pulse" />
        </div>
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (centered) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-sm z-50">
        {loader}
      </div>
    );
  }

  return loader;
};
