import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authStore } from './auth-store';

describe('authStore', () => {
  beforeEach(() => {
    authStore.clearSession();
  });

  it('updates snapshot when session is set and cleared', () => {
    authStore.setSession('token-1', {
      id: 'user-1',
      username: 'tester',
      email: 'tester@example.com',
    });

    expect(authStore.getSnapshot()).toMatchObject({
      accessToken: 'token-1',
      hasAuth: true,
      user: {
        id: 'user-1',
        username: 'tester',
        email: 'tester@example.com',
      },
    });

    authStore.clearSession();

    expect(authStore.getSnapshot()).toMatchObject({
      accessToken: null,
      hasAuth: false,
      user: null,
    });
  });

  it('notifies subscribers on state changes', () => {
    const listener = vi.fn();
    const unsubscribe = authStore.subscribe(listener);

    authStore.setRestoreAttempted();
    authStore.setSession('token-2', {
      id: 'user-2',
      username: 'author',
      email: 'author@example.com',
    });
    authStore.clearSession();

    expect(listener).toHaveBeenCalledTimes(3);
    unsubscribe();
  });
});
