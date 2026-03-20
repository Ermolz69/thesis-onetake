import { useEffect, useState } from 'react';
import { postApi } from '@/entities/post';
import { PostCard } from '@/entities/post';
import { Loader, ErrorMessage } from '@/shared/ui';

export interface RecommendedFeedProps {
  limit?: number;
  title?: string;
}

export const RecommendedFeed = ({
  limit = 10,
  title = 'Recommended for you',
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

  return (
    <section className="space-y-4 py-8">
      <h2 className="text-2xl font-semibold text-text-primary">{title}</h2>
      {loading ? (
        <Loader size="lg" />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : posts?.length ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : null}
    </section>
  );
};
