import { useState } from 'react';
import { Button, Card } from '@/shared/ui';

export interface FilterOptions {
  tag?: string;
  authorId?: string;
}

export interface PostsFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  availableTags?: string[];
}

export const PostsFilter = ({ onFilterChange, availableTags = [] }: PostsFilterProps) => {
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [selectedAuthor, setSelectedAuthor] = useState<string | undefined>();

  const handleTagChange = (tag: string | undefined) => {
    setSelectedTag(tag);
    onFilterChange({ tag, authorId: selectedAuthor });
  };

  const handleClear = () => {
    setSelectedTag(undefined);
    setSelectedAuthor(undefined);
    onFilterChange({});
  };

  return (
    <Card variant="muted" elevation="flat" radius="xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-text-primary">Filters</h3>
          <Button variant="ghost" tone="neutral" size="sm" onClick={handleClear}>
            Clear all
          </Button>
        </div>

        {availableTags.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-secondary">Tags</p>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? 'soft' : 'outline'}
                  tone={selectedTag === tag ? 'accent' : 'neutral'}
                  size="sm"
                  onClick={() => handleTagChange(selectedTag === tag ? undefined : tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
