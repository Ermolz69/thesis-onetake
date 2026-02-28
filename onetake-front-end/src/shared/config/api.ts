import { env } from './env';

export function resolveMediaUrl(mediaUrl: string): string {
  if (!mediaUrl) return mediaUrl;
  if (mediaUrl.startsWith('/')) return `${env.apiBaseUrl}${mediaUrl}`;
  return mediaUrl;
}

export const api = {
  baseURL: env.apiBaseUrl,
  endpoints: {
    auth: {
      login: '/api/auth/login',
      register: '/api/auth/register',
      refresh: '/api/auth/refresh',
      logout: '/api/auth/logout',
      me: '/api/auth/me',
    },
    products: {
      list: '/api/posts',
      details: (id: string | number) => `/api/posts/${id}`,
      create: '/api/posts',
      delete: (id: string | number) => `/api/posts/${id}`,
      like: (id: string | number) => `/api/posts/${id}/like`,
      unlike: (id: string | number) => `/api/posts/${id}/like`,
    },
    users: {
      profile: (id: string | number) => `/api/users/${id}`,
      updateProfile: '/api/users/me/profile',
      follow: (id: string | number) => `/api/users/${id}/follow`,
      unfollow: (id: string | number) => `/api/users/${id}/follow`,
    },
    comments: {
      list: (postId: string | number) => `/api/posts/${postId}/comments`,
      create: (postId: string | number) => `/api/posts/${postId}/comments`,
      delete: (postId: string | number, commentId: string) =>
        `/api/posts/${postId}/comments/${commentId}`,
    },
    uploads: {
      init: '/api/uploads/init',
      part: (uploadId: string, partIndex: number) => `/api/uploads/${uploadId}/parts/${partIndex}`,
      finalize: (uploadId: string) => `/api/uploads/${uploadId}/finalize`,
      status: (uploadId: string) => `/api/uploads/${uploadId}/status`,
    },
    analytics: {
      events: '/api/analytics/events',
    },
    notifications: {
      list: '/api/notifications',
      unreadCount: '/api/notifications/unread-count',
      markRead: (id: string) => `/api/notifications/${id}/read`,
      markAllRead: '/api/notifications/read-all',
    },
  },
} as const;
