import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePostStore } from '@/entities/post'
import { Card, Loader, Button, Badge, HeartIcon, CommentIcon } from '@/shared/ui'
import { MediaType } from '@/entities/post'
import { routes } from '@/shared/config'

export const PostDetailsPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentPost, isLoading, error, fetchPostById, likePost, unlikePost } = usePostStore()
  const [isLiked, setIsLiked] = useState(false)

  useEffect(() => {
    if (id) {
      fetchPostById(id)
    }
  }, [id, fetchPostById])

  const handleLike = () => {
    if (id) {
      if (isLiked) {
        unlikePost(id)
      } else {
        likePost(id)
      }
      setIsLiked(!isLiked)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Loader size="lg" />
      </div>
    )
  }

  if (error || !currentPost) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <p className="text-error mb-4">{error || 'Post not found'}</p>
          <Button onClick={() => navigate(routes.posts)}>Back to Posts</Button>
        </Card>
      </div>
    )
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
                <video
                  src={currentPost.mediaUrl}
                  className="w-full h-auto"
                  controls
                  autoPlay={false}
                />
              ) : (
                <audio
                  src={currentPost.mediaUrl}
                  className="w-full"
                  controls
                />
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
              by <span className="font-medium">{currentPost.authorName}</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant={currentPost.mediaType === MediaType.Video ? 'primary' : 'secondary'}>
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
            <Button
              variant={isLiked ? 'primary' : 'outline'}
              onClick={handleLike}
            >
              {isLiked ? 'Unlike' : 'Like'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

