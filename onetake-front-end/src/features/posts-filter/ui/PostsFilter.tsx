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
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-fg-primary">Filters</h3>
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear all
          </Button>
        </div>

        {availableTags.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-fg-primary mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? 'primary' : 'outline'}
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
