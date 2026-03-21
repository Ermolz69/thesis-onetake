import { Badge, Button, Card, CommentIcon, HeartIcon, VideoPlayer } from '@/shared/ui';
import { actionRow, mediaCardBody, mediaFrame, metaRow } from '@/shared/ui/recipes';
import { routes, resolveMediaUrl } from '@/shared/config';
import { useNavigate, Link } from 'react-router-dom';
import type { Post } from '@/entities/post/types';
import { MediaType } from '@/entities/post/types';

export interface PostCardProps {
  post: Post;
  onLike?: (id: string) => void;
  onUnlike?: (id: string) => void;
  isLiked?: boolean;
}

export const PostCard = ({ post, onLike, onUnlike, isLiked }: PostCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(routes.postDetails(post.id));
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiked && onUnlike) {
      onUnlike(post.id);
    } else if (!isLiked && onLike) {
      onLike(post.id);
    }
  };

  return (
    <Card
      variant="interactive"
      radius="xl"
      elevation="raised"
      className="cursor-pointer p-0"
      onClick={handleClick}
    >
      <div className={mediaFrame}>
        {post.mediaUrl ? (
          post.mediaType === MediaType.Video ? (
            <VideoPlayer
              src={resolveMediaUrl(post.mediaUrl)}
              poster={post.thumbnailUrl ? resolveMediaUrl(post.thumbnailUrl) : undefined}
              className="h-full w-full object-cover"
              controls={false}
            />
          ) : (
            <audio
              src={resolveMediaUrl(post.mediaUrl)}
              className="h-full w-full"
              controls={false}
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-text-secondary">
            No media
          </div>
        )}
      </div>

      <div className={`${mediaCardBody} space-y-3`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-lg font-semibold text-text-primary">
              {post.contentText || 'Untitled'}
            </h3>
            <div className={metaRow}>
              <span>by</span>
              <Link
                to={routes.profile(post.authorId)}
                className="font-medium text-text-primary transition hover:text-accent"
                onClick={(e) => e.stopPropagation()}
              >
                {post.authorDisplayName || post.authorName}
              </Link>
            </div>
          </div>
          <Badge
            variant="soft"
            tone={post.mediaType === MediaType.Video ? 'accent' : 'neutral'}
            size="sm"
          >
            {post.mediaType === MediaType.Video ? 'Video' : 'Audio'}
          </Badge>
        </div>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="soft" tone="neutral" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className={actionRow}>
          <div className="flex items-center gap-4 text-sm text-text-secondary">
            <span className="flex items-center gap-1">
              <span className={isLiked ? 'text-danger' : 'text-text-secondary'}>
                <HeartIcon className="h-4 w-4" color="currentColor" filled={isLiked} />
              </span>
              {post.likeCount}
            </span>
            <span className="flex items-center gap-1">
              <CommentIcon className="h-4 w-4" color="currentColor" />
              {post.commentCount}
            </span>
          </div>
          <Button
            variant={isLiked ? 'soft' : 'outline'}
            tone={isLiked ? 'danger' : 'neutral'}
            size="sm"
            onClick={handleLikeClick}
          >
            {isLiked ? 'Unlike' : 'Like'}
          </Button>
        </div>
      </div>
    </Card>
  );
};
