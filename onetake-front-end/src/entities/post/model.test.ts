import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePostStore } from './model';
import { postApi } from './api';
import { MediaType, Visibility, type Post } from './types';

vi.mock('./api', () => ({
  postApi: {
    getPosts: vi.fn(),
    getPostById: vi.fn(),
    likePost: vi.fn(),
    unlikePost: vi.fn(),
  },
}));

const samplePost: Post = {
  id: 'post-1',
  contentText: 'Sample',
  mediaUrl: '/media/sample.mp4',
  mediaType: MediaType.Video,
  visibility: Visibility.Public,
  authorName: 'author',
  authorDisplayName: 'Author',
  authorAvatarUrl: null,
  authorId: 'author-1',
  createdAt: new Date().toISOString(),
  likeCount: 2,
  isLikedByCurrentUser: false,
  commentCount: 1,
  tags: ['tag'],
  thumbnailUrl: null,
  durationSec: 12,
};

describe('usePostStore', () => {
  beforeEach(() => {
    usePostStore.setState({
      posts: [],
      currentPost: null,
      isLoading: false,
      error: null,
      nextCursor: null,
      hasMore: false,
    });
    vi.clearAllMocks();
  });

  it('hydrates fetched post into currentPost', async () => {
    vi.mocked(postApi.getPostById).mockResolvedValue(samplePost);

    await usePostStore.getState().fetchPostById('post-1');

    expect(usePostStore.getState().currentPost).toEqual(samplePost);
  });

  it('marks post as liked without double-incrementing on repeat like', async () => {
    vi.mocked(postApi.likePost).mockResolvedValue(undefined);
    usePostStore.setState({
      posts: [samplePost],
      currentPost: samplePost,
    });

    await usePostStore.getState().likePost('post-1');
    await usePostStore.getState().likePost('post-1');

    expect(usePostStore.getState().currentPost).toMatchObject({
      likeCount: 3,
      isLikedByCurrentUser: true,
    });
  });

  it('removes like state without decrementing below original unliked count', async () => {
    vi.mocked(postApi.unlikePost).mockResolvedValue(undefined);
    usePostStore.setState({
      posts: [{ ...samplePost, likeCount: 3, isLikedByCurrentUser: true }],
      currentPost: { ...samplePost, likeCount: 3, isLikedByCurrentUser: true },
    });

    await usePostStore.getState().unlikePost('post-1');
    await usePostStore.getState().unlikePost('post-1');

    expect(usePostStore.getState().currentPost).toMatchObject({
      likeCount: 2,
      isLikedByCurrentUser: false,
    });
  });
});
