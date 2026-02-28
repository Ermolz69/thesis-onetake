export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

type Listener = () => void;

let accessToken: string | null = null;
let user: AuthUser | null = null;
let restoreAttempted = false;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export const authStore = {
  getAccessToken(): string | null {
    return accessToken;
  },

  getUser(): AuthUser | null {
    return user;
  },

  getRestoreAttempted(): boolean {
    return restoreAttempted;
  },

  setRestoreAttempted(): void {
    restoreAttempted = true;
    emit();
  },

  setSession(token: string, userData: AuthUser): void {
    accessToken = token;
    user = userData;
    emit();
  },

  clearSession(): void {
    accessToken = null;
    user = null;
    emit();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
