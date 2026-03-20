import { ReactNode, useState } from 'react';
import { cn } from '@/shared/lib';

type TabsVariant = 'underline' | 'pills';
type TabsTone = 'neutral' | 'accent';
type TabsSize = 'sm' | 'md';

export interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

export interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
  variant?: TabsVariant;
  tone?: TabsTone;
  size?: TabsSize;
}

const sizeStyles: Record<TabsSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm sm:text-base',
};

const toneStyles: Record<TabsTone, { active: string; inactive: string }> = {
  neutral: {
    active: 'border-text-primary text-text-primary bg-transparent',
    inactive:
      'border-transparent text-text-secondary hover:border-border-soft hover:text-text-primary',
  },
  accent: {
    active: 'border-accent text-accent bg-transparent',
    inactive:
      'border-transparent text-text-secondary hover:border-border-soft hover:text-text-primary',
  },
};

export const Tabs = ({
  tabs,
  defaultTab,
  className,
  variant = 'underline',
  tone = 'accent',
  size = 'md',
}: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className={cn('w-full', className)}>
      <div className={cn(variant === 'underline' ? 'border-b border-border-soft' : '')}>
        <nav className="flex flex-wrap gap-2" role="tablist">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'font-medium transition-[background-color,border-color,color,box-shadow] focus-visible:outline-none focus-visible:[box-shadow:var(--input-ring)]',
                  sizeStyles[size],
                  variant === 'underline'
                    ? cn(
                        'border-b-2',
                        isActive ? toneStyles[tone].active : toneStyles[tone].inactive
                      )
                    : cn(
                        'rounded-xl border',
                        isActive
                          ? 'border-border-soft bg-surface-inverse text-text-inverse shadow-sm'
                          : 'border-border-soft bg-surface-elevated text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                      )
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="mt-4">{activeTabContent}</div>
    </div>
  );
};
