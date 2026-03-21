import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { userApi, type Profile } from '@/entities/user';
import { postApi, type Post } from '@/entities/post';
import { MediaType } from '@/entities/post';
import { Button, ErrorMessage } from '@/shared/ui';
import { routes } from '@/shared/config';
import { AuthContext } from '@/app/providers/auth';
import { useI18n } from '@/app/providers/i18n';
import {
  contentContainer,
  contentShell,
  emptyStateText,
  emptyStateTitle,
  emptyStateWrapper,
  toolbar,
} from '@/shared/ui/recipes';
import {
  profileAboutCard,
  profileAvatar,
  profileBio,
  profileCover,
  profileFallbackAvatar,
  profileHeaderCard,
  profileLink,
  profileName,
  profilePostBody,
  profilePostCard,
  profilePostPreview,
  profilePostsGrid,
  profileSkeletonBlock,
  profileSkeletonStrong,
  profileSortSelect,
  profileStatItem,
  profileStatLabel,
  profileStatValue,
  profileStatsGrid,
  profileTab,
  profileTabActive,
  profileUsername,
} from './styles';

type Tab = 'posts' | 'about';
type Sort = 'newest' | 'popular';

export const ProfilePage = () => {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('posts');
  const [sort, setSort] = useState<Sort>('newest');
  const auth = useContext(AuthContext);
  const currentUser = auth?.user ?? null;

  const loadProfile = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.all([userApi.getProfile(id), postApi.getPosts({ authorId: id, pageSize: 50 })])
      .then(([p, resp]) => {
        setProfile(p);
        setPosts(resp.posts ?? []);
      })
      .catch(() => setError(t('profile.loadFailed')))
      .finally(() => setLoading(false));
  }, [id, t]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const sortedPosts = useMemo(() => {
    if (sort === 'newest') {
      return [...posts].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return [...posts].sort((a, b) => b.likeCount - a.likeCount);
  }, [posts, sort]);

  const handleFollow = async () => {
    if (!id || !profile || followLoading) return;
    setFollowLoading(true);
    try {
      if (profile.isFollowing) {
        await userApi.unfollow(id);
        setProfile((p) =>
          p ? { ...p, isFollowing: false, followersCount: p.followersCount - 1 } : p
        );
      } else {
        await userApi.follow(id);
        setProfile((p) =>
          p ? { ...p, isFollowing: true, followersCount: p.followersCount + 1 } : p
        );
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ url: window.location.href, title: profile?.fullName || profile?.username });
    } else {
      navigator.clipboard?.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className={`${contentShell} py-8`}>
        <div className={contentContainer}>
          <div className={`${profileCover} animate-pulse`} />
          <div className={`${profileHeaderCard} animate-pulse`}>
            <div className="flex flex-col items-start gap-4 sm:flex-row">
              <div className={`${profileAvatar} ${profileSkeletonStrong} shrink-0 border-none`} />
              <div className="flex-1 space-y-3">
                <div className={`h-7 w-48 ${profileSkeletonStrong}`} />
                <div className={`h-4 w-32 ${profileSkeletonBlock}`} />
                <div className={`h-4 w-full max-w-md ${profileSkeletonBlock}`} />
                <div className={profileStatsGrid}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`${profileStatItem} ${profileSkeletonBlock}`}>
                      <div className={`mx-auto h-5 w-8 ${profileSkeletonStrong}`} />
                      <div className={`mx-auto mt-1 h-3 w-12 ${profileSkeletonBlock}`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <div className={`${profileTab} w-20 ${profileSkeletonBlock} text-transparent`} />
            <div className={`${profileTab} w-16 ${profileSkeletonBlock} text-transparent`} />
          </div>
          <div className={profilePostsGrid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={profilePostCard}>
                <div className={`${profilePostPreview} animate-pulse`} />
                <div className={profilePostBody}>
                  <div className={`h-4 w-3/4 ${profileSkeletonStrong}`} />
                  <div className={`mt-2 h-3 w-1/2 ${profileSkeletonBlock}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={`${contentShell} py-8`}>
        <div className={contentContainer}>
          <div className="mx-auto max-w-lg rounded-2xl border border-border-soft bg-surface-card py-12 text-center shadow-md backdrop-blur">
            <ErrorMessage message={error || t('profile.notFound')} className="mb-4" />
            <Button variant="solid" onClick={() => navigate(routes.posts)}>
              {t('profile.backToPosts')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.userId;
  const canFollow = currentUser && !isOwnProfile && profile.isFollowing !== undefined;

  return (
    <div className={`${contentShell} py-8`}>
      <div className={contentContainer}>
        <div className={profileCover} />
        <div className={profileHeaderCard}>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:gap-6">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.username}
                className={`${profileAvatar} shrink-0`}
              />
            ) : (
              <div className={`${profileAvatar} ${profileFallbackAvatar} shrink-0`}>
                {(profile.fullName || profile.username).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className={profileName}>{profile.fullName || profile.username}</h1>
              <p className={profileUsername}>@{profile.username}</p>
              {profile.bio && <p className={profileBio}>{profile.bio}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {isOwnProfile && (
                  <>
                    <Link to={routes.profileEdit}>
                      <Button variant="solid">{t('profile.editProfile')}</Button>
                    </Link>
                    <Button type="button" variant="outline" onClick={handleShare}>
                      {t('profile.share')}
                    </Button>
                  </>
                )}
                {canFollow && (
                  <>
                    <Button
                      type="button"
                      variant={profile.isFollowing ? 'outline' : 'solid'}
                      disabled={followLoading}
                      onClick={handleFollow}
                    >
                      {followLoading
                        ? '...'
                        : profile.isFollowing
                          ? t('profile.unfollow')
                          : t('profile.follow')}
                    </Button>
                    <Button type="button" variant="outline">
                      {t('profile.message')}
                    </Button>
                  </>
                )}
              </div>
              <div className={profileStatsGrid}>
                <div className={profileStatItem}>
                  <div className={profileStatValue}>{posts.length}</div>
                  <div className={profileStatLabel}>{t('profile.posts')}</div>
                </div>
                <div className={profileStatItem}>
                  <div className={profileStatValue}>{profile.followersCount}</div>
                  <div className={profileStatLabel}>{t('profile.followers')}</div>
                </div>
                <div className={profileStatItem}>
                  <div className={profileStatValue}>{profile.followingCount}</div>
                  <div className={profileStatLabel}>{t('profile.following')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={activeTab === 'posts' ? profileTabActive : profileTab}
          >
            {t('profile.posts')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={activeTab === 'about' ? profileTabActive : profileTab}
          >
            {t('profile.about')}
          </button>
        </div>

        {activeTab === 'posts' && (
          <>
            <div className={toolbar}>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className={profileSortSelect}
                aria-label={t('profile.sortAria')}
              >
                <option value="newest">{t('profile.newest')}</option>
                <option value="popular">{t('profile.popular')}</option>
              </select>
            </div>
            {sortedPosts.length === 0 ? (
              <div className={emptyStateWrapper}>
                <p className={emptyStateTitle}>{t('profile.emptyTitle')}</p>
                <p className={emptyStateText}>
                  {isOwnProfile ? t('profile.ownEmptyBody') : t('profile.otherEmptyBody')}
                </p>
                {isOwnProfile && (
                  <Link to={routes.record} className="mt-4 inline-block">
                    <Button variant="solid">{t('profile.createFirstPost')}</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className={profilePostsGrid}>
                {sortedPosts.map((post) => (
                  <div key={post.id} className={profilePostCard}>
                    {post.mediaUrl && (
                      <div className={profilePostPreview}>
                        {post.mediaType === MediaType.Video ? (
                          <video
                            src={post.mediaUrl}
                            className="h-full w-full object-cover"
                            controls={false}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-surface-muted" />
                        )}
                      </div>
                    )}
                    {!post.mediaUrl && <div className={profilePostPreview} />}
                    <div className={profilePostBody}>
                      <h3 className="line-clamp-1 font-semibold text-text-primary">
                        {post.contentText || t('profile.untitled')}
                      </h3>
                      <p className="mt-1 text-sm text-text-secondary">
                        {post.likeCount} {t('common.likes')} · {post.commentCount}{' '}
                        {t('common.comments')}
                      </p>
                      <Link to={routes.postDetails(post.id)} className={profileLink}>
                        {t('profile.viewPost')}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'about' && (
          <div className={profileAboutCard}>
            <h3 className="text-sm font-semibold text-text-primary">{t('profile.bio')}</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              {profile.bio || t('profile.noBio')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
