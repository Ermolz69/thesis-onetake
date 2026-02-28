import {
  createContext,
  useCallback,
  ReactNode,
  useSyncExternalStore,
  useRef,
  useEffect,
} from 'react';
import { authStore, type AuthUser } from '@/shared/lib/auth-store';
import { api } from '@/shared/config';
import { http } from '@/shared/api';

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  hasAuth: boolean;
  restoreAttempted?: boolean;
}

interface AuthContextValue extends AuthState {
  setSession: (accessToken: string, user: AuthUser) => void;
  clearSession: () => void;
  restoreSession: () => Promise<boolean>;
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
  hasAuth: false,
  restoreAttempted: false,
};

interface AuthStateWithRestore extends AuthState {
  restoreAttempted: boolean;
}

function getSnapshot(): AuthStateWithRestore {
  return {
    accessToken: authStore.getAccessToken(),
    user: authStore.getUser(),
    hasAuth: !!(authStore.getAccessToken() && authStore.getUser()),
    restoreAttempted: authStore.getRestoreAttempted(),
  };
}

function getServerSnapshot(): AuthStateWithRestore {
  return { ...initialState, restoreAttempted: false };
}

export const AuthContext = createContext<AuthContextValue | null>(null);

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

  const value: AuthContextValue = {
    ...state,
    setSession,
    clearSession,
    restoreSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
