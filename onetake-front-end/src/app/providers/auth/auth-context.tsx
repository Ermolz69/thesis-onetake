import { createContext, useContext } from 'react';
import type { AuthSnapshot, AuthUser } from '@/shared/lib/auth-store';
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

export function getSnapshot(): AuthSnapshot {
  return authStore.getSnapshot();
}

export function getServerSnapshot(): AuthSnapshot {
  return { ...initialState, restoreAttempted: false };
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  return value;
}
