import { useState, FormEvent } from 'react';
import { Input, Button } from '@/shared/ui';

export interface PostsSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export const PostsSearch = ({ onSearch, placeholder = 'Search posts...' }: PostsSearchProps) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        variant="filled"
        className="flex-1"
      />
      <div className="flex gap-2">
        <Button type="submit" variant="solid" tone="accent">
          Search
        </Button>
        {query && (
          <Button type="button" variant="ghost" tone="neutral" onClick={handleClear}>
            Clear
          </Button>
        )}
      </div>
    </form>
  );
};
