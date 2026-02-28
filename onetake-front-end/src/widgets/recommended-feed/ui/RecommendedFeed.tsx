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

  if (loading) {
    return (
      <section className="py-8">
        <h2 className="text-2xl font-semibold text-fg-primary mb-4">{title}</h2>
        <Loader size="lg" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8">
        <h2 className="text-2xl font-semibold text-fg-primary mb-4">{title}</h2>
        <ErrorMessage message={error} />
      </section>
    );
  }

  if (!posts?.length) return null;

  return (
    <section className="py-8">
      <h2 className="text-2xl font-semibold text-fg-primary mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
};
