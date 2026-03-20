import { ReactNode, useEffect } from 'react';
import { cn } from '@/shared/lib';
import { Button } from '@/shared/ui/Button';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';
type ModalVariant = 'solid' | 'muted';
type ModalElevation = 'raised' | 'floating';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: ModalSize;
  variant?: ModalVariant;
  elevation?: ModalElevation;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

const variantStyles: Record<ModalVariant, string> = {
  solid: 'bg-surface-elevated border-border-soft',
  muted: 'bg-surface-card border-border-soft',
};

const elevationStyles: Record<ModalElevation, string> = {
  raised: 'shadow-md',
  floating: 'shadow-lg',
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  variant = 'solid',
  elevation = 'floating',
}: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4" onClick={onClose}>
      <div
        className={cn(
          'w-full rounded-2xl border',
          sizeStyles[size],
          variantStyles[variant],
          elevationStyles[elevation]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-border-soft p-4">
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
            <Button variant="ghost" tone="neutral" size="sm" radius="pill" onClick={onClose} aria-label="Close modal">
              x
            </Button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};
