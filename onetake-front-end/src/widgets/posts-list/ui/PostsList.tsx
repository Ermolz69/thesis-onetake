import { useEffect, useState } from 'react';
import { PostsSearch } from '@/features/posts-search';
import { PostsFilter, type FilterOptions } from '@/features/posts-filter';
import { PostCard, usePostStore, postApi } from '@/entities/post';
import { Loader, Pagination, ErrorMessage } from '@/shared/ui';

export const PostsList = () => {
  const { posts, isLoading, error, nextCursor, fetchPosts, likePost, unlikePost } = usePostStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    posts: Awaited<ReturnType<typeof postApi.searchPosts>>['posts'];
    nextCursor: string | null;
    hasMore: boolean;
  } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (searchQuery) return;
    fetchPosts({
      ...filters,
      cursor: currentPage > 1 ? nextCursor || undefined : undefined,
      pageSize: 10,
    });
  }, [searchQuery, filters, currentPage, nextCursor, fetchPosts]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    postApi
      .searchPosts({ q: searchQuery.trim(), pageSize: 10 })
      .then((r) =>
        setSearchResults({ posts: r.posts, nextCursor: r.nextCursor, hasMore: r.hasMore })
      )
      .catch(() => setSearchResults({ posts: [], nextCursor: null, hasMore: false }))
      .finally(() => setSearchLoading(false));
  }, [searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    if (!query) setSearchResults(null);
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleLike = (id: string) => {
    likePost(id);
    setLikedPosts((prev) => new Set(prev).add(id));
  };

  const handleUnlike = (id: string) => {
    unlikePost(id);
    setLikedPosts((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const isSearchMode = searchQuery.trim() !== '';
  const displayPosts = isSearchMode && searchResults ? searchResults.posts : posts;
  const displayLoading = isSearchMode ? searchLoading : isLoading;
  const totalPages = Math.ceil(displayPosts.length / 10) || 1;
  const paginatedPosts = isSearchMode
    ? displayPosts
    : displayPosts.slice((currentPage - 1) * 10, currentPage * 10);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <PostsSearch onSearch={handleSearch} />
        <PostsFilter onFilterChange={handleFilterChange} />
      </div>

      {displayLoading && (
        <div className="flex justify-center py-12">
          <Loader size="lg" />
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      {!displayLoading && !error && paginatedPosts.length === 0 && (
        <div className="text-center py-12 text-fg-secondary">No posts found</div>
      )}

      {!displayLoading && !error && paginatedPosts.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onUnlike={handleUnlike}
                isLiked={likedPosts.has(post.id)}
              />
            ))}
          </div>

          {!isSearchMode && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  );
};
