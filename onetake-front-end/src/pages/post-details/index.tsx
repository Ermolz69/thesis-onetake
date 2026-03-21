import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '@/app/providers/auth';
import { useI18n } from '@/app/providers/i18n';
import { commentApi, type Comment } from '@/entities/comment';
import { MediaType, Visibility, usePostStore } from '@/entities/post';
import { useWatchTrack } from '@/features/watch-analytics';
import { routes, resolveMediaUrl } from '@/shared/config';
import {
  Badge,
  Button,
  Card,
  CommentIcon,
  ErrorMessage,
  HeartIcon,
  Loader,
  VideoPlayer,
} from '@/shared/ui';
import { emptyStateText, emptyStateTitle, emptyStateWrapper } from '@/shared/ui/recipes';
import { RecommendedFeed } from '@/widgets/recommended-feed';
import {
  heroGrid,
  nestedPanel,
  pillMeta,
  postDetailsBackground,
  postDetailsContent,
  postDetailsPageShell,
  primaryPanel,
  sectionSubtitle,
  sectionTitle,
} from './styles';

function formatDuration(durationSec?: number | null): string | null {
  if (!durationSec || durationSec <= 0) return null;
  const totalSeconds = Math.floor(durationSec);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getInitials(name: string): string {
  const parts = name
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return '?';

  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

export const PostDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentPost, isLoading, error, fetchPostById, likePost, unlikePost } = usePostStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const watchTrack = useWatchTrack(id ?? '');
  const auth = useContext(AuthContext);
  const currentUser = auth?.user ?? null;
  const { t } = useI18n();

  useEffect(() => {
    if (id) {
      fetchPostById(id);
    }
  }, [fetchPostById, id]);

  useEffect(() => {
    if (!id) return;
    setCommentsLoading(true);
    commentApi
      .getComments(id)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setCommentsLoading(false));
  }, [id]);

  const handleLike = () => {
    if (!id) return;

    if (isLiked) {
      unlikePost(id);
    } else {
      likePost(id);
    }
  };

  const handleAddComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id || !commentText.trim()) return;

    setCommentSubmitting(true);
    try {
      const created = await commentApi.createComment(id, { text: commentText.trim() });
      setComments((prev) => [...prev, created]);
      setCommentText('');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!id) return;
    try {
      await commentApi.deleteComment(id, commentId);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    } catch {
      /* best-effort delete */
    }
  };

  const commentCount = comments.length || currentPost?.commentCount || 0;
  const displayName = currentPost?.authorDisplayName || currentPost?.authorName || t('common.none');
  const authorInitials = useMemo(() => getInitials(displayName), [displayName]);
  const currentUserInitials = useMemo(
    () => getInitials(currentUser?.username || currentUser?.email || 'You'),
    [currentUser?.email, currentUser?.username]
  );
  const isLiked = currentPost?.isLikedByCurrentUser ?? false;
  const durationLabel = formatDuration(currentPost?.durationSec);
  const publishedLabel = currentPost
    ? new Date(currentPost.createdAt).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  if (isLoading) {
    return (
      <div className={postDetailsPageShell}>
        <div className={postDetailsBackground} />
        <div className={postDetailsContent}>
          <div className="flex justify-center py-20">
            <Loader size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !currentPost) {
    return (
      <div className={postDetailsPageShell}>
        <div className={postDetailsBackground} />
        <div className={postDetailsContent}>
          <Card className={`${primaryPanel} py-14 text-center`} radius="xl">
            <ErrorMessage message={error || t('postDetails.notFound')} className="mb-4" />
            <Button onClick={() => navigate(routes.posts)}>{t('postDetails.backToPosts')}</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={postDetailsPageShell}>
      <div className={postDetailsBackground} />

      <div className={postDetailsContent}>
        <div className="flex items-center gap-3">
          <Button variant="ghost" tone="neutral" onClick={() => navigate(routes.posts)}>
            {t('postDetails.backToPosts')}
          </Button>
          <span className="text-sm text-text-secondary">{t('postDetails.title')}</span>
        </div>

        <section className={heroGrid}>
          <Card
            radius="xl"
            className={`${primaryPanel} post-details-media-shell overflow-hidden p-0`}
          >
            <div className="border-b border-border-soft/60 px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="soft"
                  tone={currentPost.mediaType === MediaType.Video ? 'accent' : 'neutral'}
                >
                  {currentPost.mediaType === MediaType.Video
                    ? t('common.video')
                    : t('common.audio')}
                </Badge>
                {currentPost.visibility === Visibility.Unlisted && (
                  <Badge variant="soft" tone="warning">
                    {t('common.unlisted')}
                  </Badge>
                )}
                {durationLabel && <span className={pillMeta}>{durationLabel}</span>}
                <span className={pillMeta}>{publishedLabel}</span>
              </div>
            </div>

            {currentPost.mediaUrl ? (
              currentPost.mediaType === MediaType.Video ? (
                <VideoPlayer
                  src={resolveMediaUrl(currentPost.mediaUrl)}
                  poster={
                    currentPost.thumbnailUrl ? resolveMediaUrl(currentPost.thumbnailUrl) : undefined
                  }
                  className="min-h-[280px] w-full sm:min-h-[420px]"
                  controls
                  onPlay={watchTrack.onPlay}
                  onTimeUpdate={watchTrack.onTimeUpdate}
                  onEnded={watchTrack.onEnded}
                />
              ) : (
                <div className="flex min-h-[280px] items-center justify-center bg-surface-card/5 px-6 py-12 sm:min-h-[360px]">
                  <audio
                    src={resolveMediaUrl(currentPost.mediaUrl)}
                    className="w-full max-w-2xl"
                    controls
                  />
                </div>
              )
            ) : (
              <div className="flex min-h-[320px] items-center justify-center text-text-secondary">
                {t('postDetails.mediaUnavailable')}
              </div>
            )}
          </Card>

          <Card radius="xl" className={`${primaryPanel} space-y-6 p-5 sm:p-6`}>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="soft" tone="accent">
                    {t('postDetails.premiumView')}
                  </Badge>
                  <span className="text-xs font-medium uppercase tracking-[0.24em] text-text-secondary">
                    {t('postDetails.mediaDashboard')}
                  </span>
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-[2.6rem]">
                  {currentPost.contentText || t('postCard.untitled')}
                </h1>
              </div>

              <div className={`${nestedPanel} flex items-center gap-4 rounded-2xl p-4`}>
                {currentPost.authorAvatarUrl ? (
                  <img
                    src={currentPost.authorAvatarUrl}
                    alt={displayName}
                    className="h-14 w-14 rounded-full border border-border-soft/70 object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border-soft bg-accent-soft text-sm font-semibold text-text-primary">
                    {authorInitials}
                  </div>
                )}

                <div className="min-w-0">
                  <button
                    type="button"
                    className="text-left text-lg font-semibold text-text-primary transition hover:text-accent"
                    onClick={() => navigate(routes.profile(currentPost.authorId))}
                  >
                    {displayName}
                  </button>
                  <p className="text-sm text-text-secondary">@{currentPost.authorName}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className={`${nestedPanel} rounded-2xl p-4`}>
                <p className="text-xs uppercase tracking-[0.16em] text-text-secondary">
                  {t('common.published')}
                </p>
                <p className="mt-2 text-sm font-medium text-text-primary">{publishedLabel}</p>
              </div>
              <div className={`${nestedPanel} rounded-2xl p-4`}>
                <p className="text-xs uppercase tracking-[0.16em] text-text-secondary">
                  {t('common.format')}
                </p>
                <p className="mt-2 text-sm font-medium text-text-primary">
                  {currentPost.mediaType === MediaType.Video
                    ? t('postDetails.videoPost')
                    : t('postDetails.audioPost')}
                </p>
              </div>
              <div className={`${nestedPanel} rounded-2xl p-4`}>
                <p className="text-xs uppercase tracking-[0.16em] text-text-secondary">
                  {t('common.duration')}
                </p>
                <p className="mt-2 text-sm font-medium text-text-primary">
                  {durationLabel ?? t('postDetails.notAvailable')}
                </p>
              </div>
              <div className={`${nestedPanel} rounded-2xl p-4`}>
                <p className="text-xs uppercase tracking-[0.16em] text-text-secondary">
                  {t('common.access')}
                </p>
                <p className="mt-2 text-sm font-medium text-text-primary">
                  {currentPost.visibility === Visibility.Unlisted
                    ? t('common.unlisted')
                    : t('common.public')}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-text-secondary">
                  {t('common.tags')}
                </h2>
                <span className="text-xs text-text-secondary">
                  {currentPost.tags.length} {t('postDetails.tagsCount')}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentPost.tags.length ? (
                  currentPost.tags.map((tag) => (
                    <Badge key={tag} variant="soft" tone="neutral" size="sm">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-text-secondary">{t('postDetails.noTags')}</span>
                )}
              </div>
            </div>

            <div className="border-t border-border-soft/60 pt-5">
              <div
                className={`${nestedPanel} flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center`}
              >
                <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
                  <span className="inline-flex items-center gap-2 rounded-pill border border-border-soft px-3 py-1.5">
                    <HeartIcon className="h-4 w-4" color="currentColor" filled={isLiked} />
                    <strong className="font-semibold text-text-primary">
                      {currentPost.likeCount}
                    </strong>
                    {t('common.likes')}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-pill border border-border-soft px-3 py-1.5">
                    <CommentIcon className="h-4 w-4" color="currentColor" />
                    <strong className="font-semibold text-text-primary">{commentCount}</strong>
                    {t('common.comments')}
                  </span>
                </div>
                <div className="sm:ml-auto">
                  <Button
                    variant={isLiked ? 'soft' : 'solid'}
                    tone={isLiked ? 'danger' : 'accent'}
                    onClick={handleLike}
                  >
                    {isLiked ? t('postDetails.unlikePost') : t('postDetails.likePost')}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section className="space-y-6">
          <Card radius="xl" className={`${primaryPanel} space-y-6 p-5 sm:p-6`}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className={sectionTitle}>{t('postDetails.commentsTitle')}</h2>
                <p className={sectionSubtitle}>{t('postDetails.commentsSubtitle')}</p>
              </div>
              <Badge variant="soft" tone="neutral">
                {commentCount} {t('postDetails.commentsTotal')}
              </Badge>
            </div>

            {currentUser && (
              <form
                onSubmit={handleAddComment}
                className={`${nestedPanel} flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-start`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border-soft bg-accent-soft text-sm font-semibold text-text-primary">
                  {currentUserInitials}
                </div>
                <div className="flex-1 space-y-3">
                  <textarea
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder={t('postDetails.commentPlaceholder')}
                    className="min-h-[112px] w-full rounded-2xl border border-border-soft bg-surface-page px-4 py-3 text-text-primary placeholder:text-text-secondary focus:outline-none focus-visible:[box-shadow:var(--input-ring)]"
                    disabled={commentSubmitting}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="solid"
                      tone="accent"
                      disabled={commentSubmitting || !commentText.trim()}
                    >
                      {commentSubmitting ? t('postDetails.posting') : t('postDetails.postComment')}
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {commentsLoading ? (
              <Loader size="sm" />
            ) : comments.length === 0 ? (
              <div className={emptyStateWrapper}>
                <p className={emptyStateTitle}>{t('postDetails.noCommentsTitle')}</p>
                <p className={emptyStateText}>{t('postDetails.noCommentsBody')}</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {comments.map((comment) => (
                  <li key={comment.id}>
                    <Card
                      variant="muted"
                      elevation="flat"
                      radius="xl"
                      className={`${nestedPanel} flex flex-col gap-4 p-4 sm:p-5`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border-soft bg-accent-soft text-sm font-semibold text-text-primary">
                            {getInitials(comment.username)}
                          </div>
                          <div>
                            <p className="font-semibold text-text-primary">{comment.username}</p>
                            <p className="text-sm text-text-secondary">
                              {new Date(comment.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {currentUser && comment.userId === currentUser.id && (
                          <Button
                            variant="ghost"
                            tone="danger"
                            size="sm"
                            className="shrink-0"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            {t('common.remove')}
                          </Button>
                        )}
                      </div>

                      <p className="text-base leading-7 text-text-primary">{comment.text}</p>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card radius="xl" className={`${primaryPanel} p-5 sm:p-6`}>
            <RecommendedFeed
              limit={6}
              excludePostId={currentPost.id}
              title={t('postDetails.moreMedia')}
              className="space-y-5 py-0"
              titleClassName={sectionTitle}
              gridClassName="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
            />
          </Card>
        </section>
      </div>
    </div>
  );
};
