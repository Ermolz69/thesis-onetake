import { useCallback, ReactNode, useSyncExternalStore, useRef, useEffect } from 'react';
import { type AuthUser } from '@/shared/lib/auth-store';
import { api } from '@/shared/config';
import { http } from '@/shared/api';
import { AuthContext, getSnapshot, getServerSnapshot } from './auth-context';
import { authStore } from '@/shared/lib/auth-store';

export function AuthProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(authStore.subscribe, getSnapshot, getServerSnapshot);
  const restoreAttempted = useRef(false);

  const setSession = useCallback((accessToken: string, user: AuthUser) => {
    authStore.setSession(accessToken, user);
  }, []);

  const clearSession = useCallback(() => {
    authStore.clearSession();
  }, []);

  const restoreSession = useCallback(async (): Promise<boolean> => {
    try {
      const refreshResponse = await http.post<{ accessToken: string }>(
        api.endpoints.auth.refresh,
        undefined,
        {
          withCredentials: true,
        }
      );
      authStore.setSession(
        refreshResponse.accessToken,
        authStore.getUser() ?? { id: '', username: '', email: '' }
      );
      const me = await http.get<{ id: string; username: string; email: string }>(
        api.endpoints.auth.me,
        {
          withCredentials: true,
        }
      );
      authStore.setSession(authStore.getAccessToken()!, {
        id: me.id,
        username: me.username,
        email: me.email,
      });
      authStore.setRestoreAttempted();
      return true;
    } catch {
      authStore.clearSession();
      authStore.setRestoreAttempted();
      return false;
    }
  }, []);

  useEffect(() => {
    if (restoreAttempted.current || typeof window === 'undefined') return;
    restoreAttempted.current = true;
    restoreSession()
      .then(() => {})
      .catch(() => {});
  }, [restoreSession]);

  const value = {
    ...state,
    setSession,
    clearSession,
    restoreSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
