export enum MediaType {
  Audio = 1,
  Video = 2,
}

export interface Post {
  id: string
  contentText: string
  mediaUrl: string
  mediaType: MediaType
  authorName: string
  authorId: string
  createdAt: string
  likeCount: number
  commentCount: number
  tags: string[]
}

export interface PagedPostResponse {
  posts: Post[]
  nextCursor: string | null
  hasMore: boolean
}

