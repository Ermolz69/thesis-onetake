import { useEffect, useState } from 'react';
import { postApi } from '@/entities/post';
import { PostCard } from '@/entities/post';
import { Loader, ErrorMessage } from '@/shared/ui';

export interface RecommendedFeedProps {
  limit?: number;
  title?: string;
  excludePostId?: string;
  className?: string;
  titleClassName?: string;
  gridClassName?: string;
}

export const RecommendedFeed = ({
  limit = 10,
  title = 'Recommended for you',
  excludePostId,
  className = 'space-y-4 py-8',
  titleClassName = 'text-2xl font-semibold text-text-primary',
  gridClassName = 'grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3',
}: RecommendedFeedProps) => {
  const [posts, setPosts] = useState<Awaited<ReturnType<typeof postApi.getRecommended>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    postApi
      .getRecommended(limit)
      .then((data) => {
        if (!cancelled) setPosts(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [limit]);

  const visiblePosts = excludePostId ? posts.filter((post) => post.id !== excludePostId) : posts;

  return (
    <section className={className}>
      <h2 className={titleClassName}>{title}</h2>
      {loading ? (
        <Loader size="lg" />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : visiblePosts.length ? (
        <div className={gridClassName}>
          {visiblePosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : null}
    </section>
  );
};
