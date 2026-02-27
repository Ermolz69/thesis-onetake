import { env } from './env'

export const api = {
  baseURL: env.apiBaseUrl,
  endpoints: {
    auth: {
      login: '/api/auth/login',
      register: '/api/auth/register',
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
    },
    comments: {
      list: (postId: string | number) => `/api/posts/${postId}/comments`,
      create: (postId: string | number) => `/api/posts/${postId}/comments`,
    },
  },
} as const

