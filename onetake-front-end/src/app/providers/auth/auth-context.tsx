import { createContext, useContext } from 'react';
import type { AuthUser } from '@/shared/lib/auth-store';
import { authStore } from '@/shared/lib/auth-store';

export interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  hasAuth: boolean;
  restoreAttempted?: boolean;
}

export interface AuthContextValue extends AuthState {
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

export function getSnapshot(): AuthStateWithRestore {
  return {
    accessToken: authStore.getAccessToken(),
    user: authStore.getUser(),
    hasAuth: !!(authStore.getAccessToken() && authStore.getUser()),
    restoreAttempted: authStore.getRestoreAttempted(),
  };
}

export function getServerSnapshot(): AuthStateWithRestore {
  return { ...initialState, restoreAttempted: false };
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  return value;
}
