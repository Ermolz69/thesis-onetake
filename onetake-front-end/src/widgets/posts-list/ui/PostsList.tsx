import { useEffect, useState } from 'react';
import { PostsSearch } from '@/features/posts-search';
import { PostsFilter, type FilterOptions } from '@/features/posts-filter';
import { useI18n } from '@/app/providers/i18n';
import { PostCard, usePostStore, postApi } from '@/entities/post';
import { Loader, Pagination, ErrorMessage } from '@/shared/ui';
import { emptyStateText, emptyStateTitle, emptyStateWrapper } from '@/shared/ui/recipes';

export const PostsList = () => {
  const { t } = useI18n();
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
    if (!searchQuery.trim()) return;

    const searchPosts = async () => {
      setSearchLoading(true);
      try {
        const result = await postApi.searchPosts({ q: searchQuery.trim(), pageSize: 10 });
        setSearchResults({
          posts: result.posts,
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
        });
      } catch {
        setSearchResults({ posts: [], nextCursor: null, hasMore: false });
      } finally {
        setSearchLoading(false);
      }
    };

    void searchPosts();
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
        <div className={emptyStateWrapper}>
          <p className={emptyStateTitle}>{t('posts.noResultsTitle')}</p>
          <p className={emptyStateText}>{t('posts.noResultsBody')}</p>
        </div>
      )}

      {!displayLoading && !error && paginatedPosts.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {paginatedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onUnlike={handleUnlike}
                isLiked={likedPosts.has(post.id) || post.isLikedByCurrentUser}
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
