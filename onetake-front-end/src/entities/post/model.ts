import { create } from 'zustand';
import { postApi } from './api';
import type { Post } from './types';

interface PostState {
  posts: Post[];
  currentPost: Post | null;
  isLoading: boolean;
  error: string | null;
  nextCursor: string | null;
  hasMore: boolean;
  fetchPosts: (params?: {
    tag?: string;
    authorId?: string;
    cursor?: string;
    pageSize?: number;
  }) => Promise<void>;
  fetchPostById: (id: string) => Promise<void>;
  likePost: (id: string) => Promise<void>;
  unlikePost: (id: string) => Promise<void>;
  clearPosts: () => void;
}

export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  currentPost: null,
  isLoading: false,
  error: null,
  nextCursor: null,
  hasMore: false,

  fetchPosts: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await postApi.getPosts(params);
      set({
        posts: params?.cursor ? [...get().posts, ...response.posts] : response.posts,
        nextCursor: response.nextCursor,
        hasMore: response.hasMore,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch posts',
        isLoading: false,
      });
    }
  },

  fetchPostById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const post = await postApi.getPostById(id);
      set({ currentPost: post, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch post',
        isLoading: false,
      });
    }
  },

  likePost: async (id) => {
    try {
      await postApi.likePost(id);
      set((state) => ({
        posts: state.posts.map((p) => (p.id === id ? { ...p, likeCount: p.likeCount + 1 } : p)),
        currentPost:
          state.currentPost?.id === id
            ? { ...state.currentPost, likeCount: state.currentPost.likeCount + 1 }
            : state.currentPost,
      }));
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  },

  unlikePost: async (id) => {
    try {
      await postApi.unlikePost(id);
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === id ? { ...p, likeCount: Math.max(0, p.likeCount - 1) } : p
        ),
        currentPost:
          state.currentPost?.id === id
            ? { ...state.currentPost, likeCount: Math.max(0, state.currentPost.likeCount - 1) }
            : state.currentPost,
      }));
    } catch (error) {
      console.error('Failed to unlike post:', error);
    }
  },

  clearPosts: () => {
    set({ posts: [], nextCursor: null, hasMore: false });
  },
}));
