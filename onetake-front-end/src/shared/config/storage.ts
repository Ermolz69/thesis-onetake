export const storageKeys = {
  auth: {
    token: 'auth_token',
    user: 'auth_user',
  },
  analytics: {
    sessionId: 'analytics_session_id',
  },
  theme: 'theme',
  filters: {
    posts: 'posts_filters',
  },
} as const;

export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },
  remove: (key: string): void => {
    localStorage.removeItem(key);
  },
  clear: (): void => {
    localStorage.clear();
  },
};
