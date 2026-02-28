export const routes = {
  home: '/',
  posts: '/posts',
  record: '/record',
  recordControls: '/record/controls',
  postDetails: (id: string | number) => `/posts/${id}`,
  profile: (id: string | number) => `/users/${id}`,
  profileEdit: '/profile/me/edit',
  notifications: '/notifications',
  auth: {
    login: '/auth/login',
    register: '/auth/register',
  },
} as const;

export type Route = typeof routes;
