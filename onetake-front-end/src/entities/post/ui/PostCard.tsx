import { Card, Badge, Button, HeartIcon, CommentIcon } from '@/shared/ui'
import { routes } from '@/shared/config'
import { useNavigate } from 'react-router-dom'
import type { Post } from '../types'
import { MediaType } from '../types'

export interface PostCardProps {
  post: Post
  onLike?: (id: string) => void
  onUnlike?: (id: string) => void
  isLiked?: boolean
}

export const PostCard = ({ post, onLike, onUnlike, isLiked }: PostCardProps) => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(routes.postDetails(post.id))
  }

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLiked && onUnlike) {
      onUnlike(post.id)
    } else if (!isLiked && onLike) {
      onLike(post.id)
    }
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleClick}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-fg-primary line-clamp-2">
              {post.contentText || 'Untitled'}
            </h3>
            <p className="text-sm text-fg-secondary mt-1">
              by {post.authorName}
            </p>
          </div>
          {post.mediaType === MediaType.Video && (
            <Badge variant="primary">Video</Badge>
          )}
          {post.mediaType === MediaType.Audio && (
            <Badge variant="secondary">Audio</Badge>
          )}
        </div>

        {post.mediaUrl && (
          <div className="w-full aspect-video bg-bg-secondary rounded-md overflow-hidden">
            {post.mediaType === MediaType.Video ? (
              <video
                src={post.mediaUrl}
                className="w-full h-full object-cover"
                controls={false}
              />
            ) : (
              <audio
                src={post.mediaUrl}
                className="w-full"
                controls={false}
              />
            )}
          </div>
        )}

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="default">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-4 text-sm text-fg-secondary">
            <span className="flex items-center gap-1">
              <HeartIcon 
                className="w-4 h-4" 
                color={isLiked ? '#ef4444' : 'currentColor'} 
                filled={isLiked}
              />
              {post.likeCount}
            </span>
            <span className="flex items-center gap-1">
              <CommentIcon className="w-4 h-4" color="currentColor" />
              {post.commentCount}
            </span>
          </div>
          <Button
            variant={isLiked ? 'primary' : 'outline'}
            size="sm"
            onClick={handleLikeClick}
          >
            {isLiked ? 'Unlike' : 'Like'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

