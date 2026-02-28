import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { userApi, type Profile } from '@/entities/user';
import { postApi, type Post } from '@/entities/post';
import { MediaType } from '@/entities/post';
import { Button, ErrorMessage } from '@/shared/ui';
import { routes } from '@/shared/config';
import { AuthContext } from '@/app/providers/auth';
import {
  pageContainer,
  contentContainer,
  btnPrimaryInline,
  btnSecondaryInline,
  cardClass,
  emptyStateWrapper,
  emptyStateTitle,
  emptyStateText,
  sortSelect,
  toolbar,
  tabsWrapper,
  tabDefault,
  tabActive,
} from '@/shared/ui/profile-styles';
import {
  cover,
  headerCard,
  avatar,
  profileName,
  profileUsername,
  profileBio,
  statsGrid,
  statItem,
  statValue,
  statLabel,
  postsGrid,
  postCardProfile,
  postCardPreview,
  postCardBody,
  aboutCard,
} from '@/shared/ui/profile-styles';

type Tab = 'posts' | 'about';
type Sort = 'newest' | 'popular';

export const ProfilePage = () => {
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
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [id]);

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
      <div className={`${pageContainer} py-8`}>
        <div className={contentContainer}>
          <div className={`${cover} animate-pulse bg-slate-200/60`} />
          <div className={`${headerCard} animate-pulse`}>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className={`${avatar} bg-slate-200/80 shrink-0`} />
              <div className="flex-1 w-full space-y-3">
                <div className="h-7 w-48 bg-slate-200/80 rounded-lg" />
                <div className="h-4 w-32 bg-slate-200/80 rounded" />
                <div className="h-4 w-full max-w-md bg-slate-200/80 rounded" />
                <div className={`${statsGrid}`}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`${statItem} bg-slate-200/60`}>
                      <div className="h-5 w-8 bg-slate-300/80 rounded mx-auto" />
                      <div className="h-3 w-12 bg-slate-200/80 rounded mt-1 mx-auto" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className={tabsWrapper}>
            <div className={`${tabDefault} w-20 bg-slate-200/60`} />
            <div className={`${tabDefault} w-16 bg-slate-200/60`} />
          </div>
          <div className={postsGrid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={postCardProfile}>
                <div className={`${postCardPreview} animate-pulse bg-slate-200/60`} />
                <div className={postCardBody}>
                  <div className="h-4 w-3/4 bg-slate-200/80 rounded" />
                  <div className="h-3 w-1/2 bg-slate-200/60 rounded mt-2" />
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
      <div className={`${pageContainer} py-8`}>
        <div className={contentContainer}>
          <div className={`${cardClass} max-w-lg mx-auto text-center py-12`}>
            <ErrorMessage message={error || 'Profile not found'} className="mb-4" />
            <Button onClick={() => navigate(routes.posts)} className={btnPrimaryInline}>
              Back to Posts
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.userId;
  const canFollow = currentUser && !isOwnProfile && profile.isFollowing !== undefined;

  return (
    <div className={`${pageContainer} py-8`}>
      <div className={contentContainer}>
        <div className={cover} />
        <div className={headerCard}>
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.username}
                className={`${avatar} shrink-0`}
              />
            ) : (
              <div
                className={`${avatar} shrink-0 flex items-center justify-center text-2xl sm:text-3xl font-semibold text-slate-500`}
              >
                {(profile.fullName || profile.username).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className={profileName}>{profile.fullName || profile.username}</h1>
              <p className={profileUsername}>@{profile.username}</p>
              {profile.bio && <p className={profileBio}>{profile.bio}</p>}
              <div className="flex flex-wrap gap-2 mt-4">
                {isOwnProfile && (
                  <>
                    <Link to={routes.profileEdit}>
                      <button type="button" className={btnPrimaryInline}>
                        Edit profile
                      </button>
                    </Link>
                    <button type="button" onClick={handleShare} className={btnSecondaryInline}>
                      Share
                    </button>
                  </>
                )}
                {canFollow && (
                  <>
                    <button
                      type="button"
                      onClick={handleFollow}
                      disabled={followLoading}
                      className={profile.isFollowing ? btnSecondaryInline : btnPrimaryInline}
                    >
                      {followLoading ? '...' : profile.isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                    <button type="button" className={btnSecondaryInline}>
                      Message
                    </button>
                  </>
                )}
              </div>
              <div className={statsGrid}>
                <div className={statItem}>
                  <div className={statValue}>{posts.length}</div>
                  <div className={statLabel}>Posts</div>
                </div>
                <div className={statItem}>
                  <div className={statValue}>{profile.followersCount}</div>
                  <div className={statLabel}>Followers</div>
                </div>
                <div className={statItem}>
                  <div className={statValue}>{profile.followingCount}</div>
                  <div className={statLabel}>Following</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={tabsWrapper}>
          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={activeTab === 'posts' ? tabActive : tabDefault}
          >
            Posts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={activeTab === 'about' ? tabActive : tabDefault}
          >
            About
          </button>
        </div>

        {activeTab === 'posts' && (
          <>
            <div className={toolbar}>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className={sortSelect}
                aria-label="Sort posts"
              >
                <option value="newest">Newest</option>
                <option value="popular">Popular</option>
              </select>
            </div>
            {sortedPosts.length === 0 ? (
              <div className={emptyStateWrapper}>
                <p className={emptyStateTitle}>No posts yet</p>
                <p className={emptyStateText}>
                  {isOwnProfile
                    ? 'Create your first post to share with others.'
                    : 'This user has not posted anything yet.'}
                </p>
                {isOwnProfile && (
                  <Link to={routes.record} className="inline-block mt-4">
                    <button type="button" className={btnPrimaryInline}>
                      Create your first post
                    </button>
                  </Link>
                )}
              </div>
            ) : (
              <div className={postsGrid}>
                {sortedPosts.map((post) => (
                  <div key={post.id} className={postCardProfile}>
                    {post.mediaUrl && (
                      <div className={postCardPreview}>
                        {post.mediaType === MediaType.Video ? (
                          <video
                            src={post.mediaUrl}
                            className="w-full h-full object-cover"
                            controls={false}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100" />
                        )}
                      </div>
                    )}
                    {!post.mediaUrl && <div className={postCardPreview} />}
                    <div className={postCardBody}>
                      <h3 className="font-semibold text-slate-900 line-clamp-1">
                        {post.contentText || 'Untitled'}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {post.likeCount} likes · {post.commentCount} comments
                      </p>
                      <Link
                        to={routes.postDetails(post.id)}
                        className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        View post
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'about' && (
          <div className={aboutCard}>
            <h3 className="text-sm font-semibold text-slate-900">Bio</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {profile.bio || 'No bio yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
