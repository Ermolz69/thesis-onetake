import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePostStore } from '@/entities/post';
import { commentApi, type Comment } from '@/entities/comment';
import { useWatchTrack } from '@/features/watch-analytics';
import {
  Card,
  Loader,
  Button,
  Badge,
  HeartIcon,
  CommentIcon,
  Input,
  VideoPlayer,
  ErrorMessage,
} from '@/shared/ui';
import { MediaType } from '@/entities/post';
import { routes, resolveMediaUrl } from '@/shared/config';
import { AuthContext } from '@/app/providers/auth';
import {
  contentContainer,
  contentShell,
  emptyStateText,
  emptyStateTitle,
  emptyStateWrapper,
} from '@/shared/ui/recipes';

export const PostDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentPost, isLoading, error, fetchPostById, likePost, unlikePost } = usePostStore();
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const watchTrack = useWatchTrack(id ?? '');
  const auth = useContext(AuthContext);
  const currentUser = auth?.user ?? null;

  useEffect(() => {
    if (id) {
      fetchPostById(id);
    }
  }, [id, fetchPostById]);

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
    if (id) {
      if (isLiked) {
        unlikePost(id);
      } else {
        likePost(id);
      }
      setIsLiked(!isLiked);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      /* Best-effort: ignore delete comment failure */
    }
  };

  if (isLoading) {
    return (
      <div className={contentShell}>
        <div className={`${contentContainer} flex justify-center py-12`}>
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  if (error || !currentPost) {
    return (
      <div className={contentShell}>
        <div className={`${contentContainer} py-8`}>
          <Card className="py-12 text-center" radius="xl">
            <ErrorMessage message={error || 'Post not found'} className="mb-4" />
            <Button onClick={() => navigate(routes.posts)}>Back to Posts</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={contentShell}>
      <div className={`${contentContainer} space-y-6 py-8`}>
        <Button variant="ghost" tone="neutral" onClick={() => navigate(routes.posts)}>
          Back to Posts
        </Button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div>
            {currentPost.mediaUrl && (
              <Card className="overflow-hidden p-0" radius="xl">
                {currentPost.mediaType === MediaType.Video ? (
                  <VideoPlayer
                    src={resolveMediaUrl(currentPost.mediaUrl)}
                    className="w-full min-h-[220px]"
                    controls
                    onPlay={watchTrack.onPlay}
                    onTimeUpdate={watchTrack.onTimeUpdate}
                    onEnded={watchTrack.onEnded}
                  />
                ) : (
                  <div className="bg-surface-muted p-6">
                    <audio src={resolveMediaUrl(currentPost.mediaUrl)} className="w-full" controls />
                  </div>
                )}
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card radius="xl" className="space-y-5">
              <div>
                <h1 className="mb-2 text-3xl font-semibold tracking-tight text-text-primary">
                  {currentPost.contentText || 'Untitled'}
                </h1>
                <p className="text-text-secondary">
                  by{' '}
                  <button
                    type="button"
                    className="font-medium text-text-primary transition hover:text-accent"
                    onClick={() => navigate(routes.profile(currentPost.authorId))}
                  >
                    {currentPost.authorName}
                  </button>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant="soft"
                  tone={currentPost.mediaType === MediaType.Video ? 'accent' : 'neutral'}
                >
                  {currentPost.mediaType === MediaType.Video ? 'Video' : 'Audio'}
                </Badge>
                <span className="text-sm text-text-secondary">
                  {new Date(currentPost.createdAt).toLocaleDateString()}
                </span>
              </div>

              {currentPost.tags.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-text-secondary">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentPost.tags.map((tag) => (
                      <Badge key={tag} variant="soft" tone="neutral" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-6 border-t border-border-soft pt-4">
                <div className="flex items-center gap-2 text-text-secondary">
                  <span className={isLiked ? 'text-danger' : 'text-text-secondary'}>
                    <HeartIcon className="h-5 w-5" color="currentColor" filled={isLiked} />
                  </span>
                  <span className="font-medium text-text-primary">{currentPost.likeCount}</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <CommentIcon className="h-5 w-5" color="currentColor" />
                  <span className="font-medium text-text-primary">{currentPost.commentCount}</span>
                </div>
                <Button
                  variant={isLiked ? 'soft' : 'outline'}
                  tone={isLiked ? 'danger' : 'neutral'}
                  onClick={handleLike}
                >
                  {isLiked ? 'Unlike' : 'Like'}
                </Button>
              </div>
            </Card>

            <Card radius="xl" className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">Comments ({comments.length})</h3>
              {currentUser && (
                <form onSubmit={handleAddComment} className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    variant="filled"
                    className="flex-1"
                    disabled={commentSubmitting}
                  />
                  <Button type="submit" disabled={commentSubmitting || !commentText.trim()}>
                    {commentSubmitting ? '...' : 'Post'}
                  </Button>
                </form>
              )}

              {commentsLoading ? (
                <Loader size="sm" />
              ) : comments.length === 0 ? (
                <div className={emptyStateWrapper}>
                  <p className={emptyStateTitle}>No comments yet</p>
                  <p className={emptyStateText}>Start the conversation on this post.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {comments.map((c) => (
                    <li key={c.id}>
                      <Card
                        variant="muted"
                        elevation="flat"
                        radius="lg"
                        className="flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-text-primary">{c.username}</span>
                            <span className="text-sm text-text-secondary">
                              {new Date(c.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="mt-1 text-text-primary">{c.text}</p>
                        </div>
                        {currentUser && c.userId === currentUser.id && (
                          <Button
                            variant="ghost"
                            tone="danger"
                            size="sm"
                            className="shrink-0"
                            onClick={() => handleDeleteComment(c.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
