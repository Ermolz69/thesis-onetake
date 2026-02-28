import { cn } from '@/shared/lib';

export interface ErrorMessageProps {
  message: string;
  className?: string;
}

export const ErrorMessage = ({ message, className }: ErrorMessageProps) => (
  <div
    className={cn(
      'p-4 bg-error/10 border border-error rounded-md text-error',
      className
    )}
    role="alert"
  >
    {message}
  </div>
);
