import { useEffect, useState } from 'react'
import { PostsSearch } from '@/features/posts-search'
import { PostsFilter, type FilterOptions } from '@/features/posts-filter'
import { PostCard, usePostStore, type Post } from '@/entities/post'
import { Loader, Pagination } from '@/shared/ui'

export const PostsList = () => {
  const { posts, isLoading, error, hasMore, nextCursor, fetchPosts, likePost, unlikePost } = usePostStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterOptions>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchPosts({
      ...filters,
      cursor: currentPage > 1 ? nextCursor || undefined : undefined,
      pageSize: 10,
    })
  }, [filters, currentPage, nextCursor, fetchPosts])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
    fetchPosts({
      ...filters,
      pageSize: 10,
    })
  }

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleLike = (id: string) => {
    likePost(id)
    setLikedPosts((prev) => new Set(prev).add(id))
  }

  const handleUnlike = (id: string) => {
    unlikePost(id)
    setLikedPosts((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const filteredPosts = searchQuery
    ? posts.filter((p) =>
        p.contentText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : posts

  const totalPages = Math.ceil(filteredPosts.length / 10) || 1
  const paginatedPosts = filteredPosts.slice((currentPage - 1) * 10, currentPage * 10)

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <PostsSearch onSearch={handleSearch} />
        <PostsFilter onFilterChange={handleFilterChange} />
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader size="lg" />
        </div>
      )}

      {error && (
        <div className="p-4 bg-error/10 border border-error rounded-md text-error">
          {error}
        </div>
      )}

      {!isLoading && !error && paginatedPosts.length === 0 && (
        <div className="text-center py-12 text-fg-secondary">
          No posts found
        </div>
      )}

      {!isLoading && !error && paginatedPosts.length > 0 && (
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

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  )
}

