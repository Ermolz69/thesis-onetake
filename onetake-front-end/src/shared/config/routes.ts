export const routes = {
  home: '/',
  posts: '/posts',
  postDetails: (id: string | number) => `/posts/${id}`,
  auth: {
    login: '/auth/login',
    register: '/auth/register',
  },
} as const

export type Route = typeof routes

