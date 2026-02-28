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
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="flex-1"
      />
      <Button type="submit" variant="primary">
        Search
      </Button>
      {query && (
        <Button type="button" variant="ghost" onClick={handleClear}>
          Clear
        </Button>
      )}
    </form>
  );
};
