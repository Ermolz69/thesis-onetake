import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '@/shared/config';
import { Button, Card } from '@/shared/ui';
import { AuthContext } from '@/app/providers/auth';
import { RecommendedFeed } from '@/widgets/recommended-feed';
import { postApi, PostCard } from '@/entities/post';
import { trackEvent } from '@/features/analytics-track';
import { Loader } from '@/shared/ui';

type FeedTab = 'recommended' | 'following';

export const HomePage = () => {
  const [feedTab, setFeedTab] = useState<FeedTab>('recommended');
  const [followingPosts, setFollowingPosts] = useState<Awaited<
    ReturnType<typeof postApi.getFollowingFeed>
  > | null>(null);
  const [followingLoading, setFollowingLoading] = useState(false);
  const auth = useContext(AuthContext);
  const currentUser = auth?.user ?? null;

  useEffect(() => {
    if (feedTab === 'following' && currentUser?.id) {
      setFollowingLoading(true);
      trackEvent({
        eventName: 'feed_view',
        propsJson: JSON.stringify({ feed_type: 'following' }),
      }).catch(() => {});
      postApi
        .getFollowingFeed({ pageSize: 20 })
        .then(setFollowingPosts)
        .catch(() => setFollowingPosts({ posts: [], nextCursor: null, hasMore: false }))
        .finally(() => setFollowingLoading(false));
    }
  }, [feedTab, currentUser?.id]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center space-y-8">
        <h1 className="text-5xl font-bold text-fg-primary">OneTake</h1>
        <p className="text-xl text-fg-secondary max-w-2xl mx-auto">
          Share your audio and video content with the world
        </p>

        <div className="flex justify-center gap-4">
          <Link to={routes.posts}>
            <Button variant="primary" size="lg">
              Browse Posts
            </Button>
          </Link>
          <Link to={routes.record}>
            <Button variant="outline" size="lg">
              Record
            </Button>
          </Link>
          {currentUser?.id ? (
            <Link to={routes.profile(currentUser.id)}>
              <Button variant="outline" size="lg">
                Profile
              </Button>
            </Link>
          ) : (
            <Link to={routes.auth.login}>
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <Card>
            <h3 className="text-xl font-semibold text-fg-primary mb-2">Audio & Video</h3>
            <p className="text-fg-secondary">
              Share your creative content in audio or video format
            </p>
          </Card>
          <Card>
            <h3 className="text-xl font-semibold text-fg-primary mb-2">Discover</h3>
            <p className="text-fg-secondary">Explore content from creators around the world</p>
          </Card>
          <Card>
            <h3 className="text-xl font-semibold text-fg-primary mb-2">Connect</h3>
            <p className="text-fg-secondary">Like, comment, and engage with the community</p>
          </Card>
        </div>
      </div>

      {currentUser && (
        <div className="flex gap-2 mt-8 mb-4">
          <Button
            variant={feedTab === 'recommended' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFeedTab('recommended')}
          >
            Recommended
          </Button>
          <Button
            variant={feedTab === 'following' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFeedTab('following')}
          >
            Following
          </Button>
        </div>
      )}

      {feedTab === 'recommended' && <RecommendedFeed limit={10} />}

      {feedTab === 'following' && (
        <section className="py-8">
          <h2 className="text-2xl font-semibold text-fg-primary mb-4">Following</h2>
          {!currentUser ? (
            <p className="text-fg-secondary">Sign in to see posts from people you follow.</p>
          ) : followingLoading ? (
            <Loader size="lg" />
          ) : followingPosts && followingPosts.posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {followingPosts.posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <p className="text-fg-secondary">No posts from people you follow yet.</p>
          )}
        </section>
      )}
    </div>
  );
};
