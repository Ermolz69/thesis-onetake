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
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (error || !currentPost) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <ErrorMessage message={error || 'Post not found'} className="mb-4" />
          <Button onClick={() => navigate(routes.posts)}>Back to Posts</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate(routes.posts)} className="mb-6">
        ← Back to Posts
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          {currentPost.mediaUrl && (
            <Card className="overflow-hidden p-0">
              {currentPost.mediaType === MediaType.Video ? (
                <VideoPlayer
                  src={resolveMediaUrl(currentPost.mediaUrl)}
                  className="w-full min-h-[200px]"
                  controls
                  onPlay={watchTrack.onPlay}
                  onTimeUpdate={watchTrack.onTimeUpdate}
                  onEnded={watchTrack.onEnded}
                />
              ) : (
                <audio src={resolveMediaUrl(currentPost.mediaUrl)} className="w-full" controls />
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-fg-primary mb-2">
              {currentPost.contentText || 'Untitled'}
            </h1>
            <p className="text-fg-secondary">
              by{' '}
              <button
                type="button"
                className="font-medium text-fg-primary hover:underline"
                onClick={() => navigate(routes.profile(currentPost.authorId))}
              >
                {currentPost.authorName}
              </button>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant={currentPost.mediaType === MediaType.Video ? 'primary' : 'default'}>
              {currentPost.mediaType === MediaType.Video ? 'Video' : 'Audio'}
            </Badge>
            <span className="text-fg-secondary">
              {new Date(currentPost.createdAt).toLocaleDateString()}
            </span>
          </div>

          {currentPost.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-fg-secondary mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {currentPost.tags.map((tag) => (
                  <Badge key={tag} variant="default">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <HeartIcon
                className="w-5 h-5"
                color={isLiked ? '#ef4444' : 'currentColor'}
                filled={isLiked}
              />
              <span className="font-medium">{currentPost.likeCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <CommentIcon className="w-5 h-5 text-fg-secondary" color="currentColor" />
              <span className="font-medium">{currentPost.commentCount}</span>
            </div>
            <Button variant={isLiked ? 'primary' : 'outline'} onClick={handleLike}>
              {isLiked ? 'Unlike' : 'Like'}
            </Button>
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-semibold text-fg-primary mb-4">
              Comments ({comments.length})
            </h3>
            {currentUser && (
              <form onSubmit={handleAddComment} className="mb-4 flex gap-2">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
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
            ) : (
              <ul className="space-y-3">
                {comments.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-start justify-between gap-2 rounded-lg bg-bg-secondary/50 p-3"
                  >
                    <div>
                      <span className="font-medium text-fg-primary">{c.username}</span>
                      <span className="text-fg-secondary text-sm ml-2">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                      <p className="text-fg-primary mt-1">{c.text}</p>
                    </div>
                    {currentUser && c.userId === currentUser.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-error shrink-0"
                        onClick={() => handleDeleteComment(c.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
