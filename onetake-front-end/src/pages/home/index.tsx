import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '@/shared/config';
import { useI18n } from '@/app/providers/i18n';
import { Button, Card, Loader } from '@/shared/ui';
import { AuthContext } from '@/app/providers/auth';
import { RecommendedFeed } from '@/widgets/recommended-feed';
import { postApi, PostCard } from '@/entities/post';
import { trackEvent } from '@/features/analytics-track';
import {
  contentContainer,
  contentShell,
  emptyStateText,
  emptyStateTitle,
  emptyStateWrapper,
} from '@/shared/ui/recipes';

type FeedTab = 'recommended' | 'following';

export const HomePage = () => {
  const [feedTab, setFeedTab] = useState<FeedTab>('recommended');
  const [followingPosts, setFollowingPosts] = useState<Awaited<
    ReturnType<typeof postApi.getFollowingFeed>
  > | null>(null);
  const [followingLoading, setFollowingLoading] = useState(false);
  const auth = useContext(AuthContext);
  const currentUser = auth?.user ?? null;
  const { t } = useI18n();

  useEffect(() => {
    if (feedTab !== 'following' || !currentUser?.id) return;

    const loadFollowingFeed = async () => {
      setFollowingLoading(true);
      trackEvent({
        eventName: 'feed_view',
        propsJson: JSON.stringify({ feed_type: 'following' }),
      }).catch(() => {});
      try {
        const response = await postApi.getFollowingFeed({ pageSize: 20 });
        setFollowingPosts(response);
      } catch {
        setFollowingPosts({ posts: [], nextCursor: null, hasMore: false });
      } finally {
        setFollowingLoading(false);
      }
    };

    void loadFollowingFeed();
  }, [feedTab, currentUser?.id]);

  return (
    <div className={contentShell}>
      <div className={`${contentContainer} space-y-10 py-10 sm:py-14`}>
        <section className="space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
              {t('home.heroTitle')}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-text-secondary sm:text-xl">
              {t('home.heroSubtitle')}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Link to={routes.posts}>
              <Button variant="solid" tone="accent" size="lg">
                {t('home.browsePosts')}
              </Button>
            </Link>
            <Link to={routes.record}>
              <Button variant="outline" tone="neutral" size="lg">
                {t('home.record')}
              </Button>
            </Link>
            {currentUser?.id ? (
              <Link to={routes.profile(currentUser.id)}>
                <Button variant="outline" tone="neutral" size="lg">
                  {t('home.profile')}
                </Button>
              </Link>
            ) : (
              <Link to={routes.auth.login}>
                <Button variant="outline" tone="neutral" size="lg">
                  {t('home.signIn')}
                </Button>
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card variant="solid" elevation="raised" radius="xl">
              <h3 className="mb-2 text-xl font-semibold text-text-primary">
                {t('home.cards.audioVideoTitle')}
              </h3>
              <p className="text-text-secondary">{t('home.cards.audioVideoBody')}</p>
            </Card>
            <Card variant="solid" elevation="raised" radius="xl">
              <h3 className="mb-2 text-xl font-semibold text-text-primary">
                {t('home.cards.discoverTitle')}
              </h3>
              <p className="text-text-secondary">{t('home.cards.discoverBody')}</p>
            </Card>
            <Card variant="solid" elevation="raised" radius="xl">
              <h3 className="mb-2 text-xl font-semibold text-text-primary">
                {t('home.cards.connectTitle')}
              </h3>
              <p className="text-text-secondary">{t('home.cards.connectBody')}</p>
            </Card>
          </div>
        </section>

        {currentUser && (
          <section className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={feedTab === 'recommended' ? 'soft' : 'outline'}
                tone={feedTab === 'recommended' ? 'accent' : 'neutral'}
                size="sm"
                onClick={() => setFeedTab('recommended')}
              >
                {t('home.tabs.recommended')}
              </Button>
              <Button
                variant={feedTab === 'following' ? 'soft' : 'outline'}
                tone={feedTab === 'following' ? 'accent' : 'neutral'}
                size="sm"
                onClick={() => setFeedTab('following')}
              >
                {t('home.tabs.following')}
              </Button>
            </div>

            {feedTab === 'recommended' && <RecommendedFeed limit={10} />}

            {feedTab === 'following' && (
              <section className="space-y-4 py-2">
                <h2 className="text-2xl font-semibold text-text-primary">
                  {t('home.following.title')}
                </h2>
                {!currentUser ? (
                  <div className={emptyStateWrapper}>
                    <p className={emptyStateTitle}>{t('home.following.signInRequired')}</p>
                    <p className={emptyStateText}>{t('home.following.signInBody')}</p>
                  </div>
                ) : followingLoading ? (
                  <Loader size="lg" />
                ) : followingPosts && followingPosts.posts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {followingPosts.posts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className={emptyStateWrapper}>
                    <p className={emptyStateTitle}>{t('home.following.emptyTitle')}</p>
                    <p className={emptyStateText}>{t('home.following.emptyBody')}</p>
                  </div>
                )}
              </section>
            )}
          </section>
        )}
      </div>
    </div>
  );
};
