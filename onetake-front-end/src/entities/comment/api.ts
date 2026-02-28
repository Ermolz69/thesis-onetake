import { http } from '@/shared/api';
import { api } from '@/shared/config';
import type { Comment, CreateCommentRequest } from './types';

export const commentApi = {
  getComments: async (postId: string): Promise<Comment[]> => {
    return http.get<Comment[]>(api.endpoints.comments.list(postId));
  },

  createComment: async (postId: string, data: CreateCommentRequest): Promise<Comment> => {
    return http.post<Comment>(api.endpoints.comments.create(postId), data);
  },

  deleteComment: async (postId: string, commentId: string): Promise<void> => {
    return http.delete(api.endpoints.comments.delete(postId, commentId));
  },
};
