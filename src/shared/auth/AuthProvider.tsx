import { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import type { PropsWithChildren } from 'react';
import { queryClient } from '@/app/providers/AppProviders';
import { clearAuthState, getAuthState, hasPermission, setAuthState, subscribeAuthState, type AuthState } from '@/shared/auth/session';

type AuthContextValue = {
  auth: AuthState | null;
  isAuthenticated: boolean;
  setAuth: (state: AuthState) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (...roles: string[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const auth = useSyncExternalStore(subscribeAuthState, getAuthState, getAuthState);

  const value = useMemo<AuthContextValue>(() => ({
    auth,
    isAuthenticated: auth !== null,
    setAuth: (state) => {
      queryClient.clear();
      setAuthState(state);
    },
    logout: () => {
      clearAuthState();
      queryClient.clear();
    },
    hasPermission: (permission) => hasPermission(auth?.session ?? null, permission),
    hasRole: (...roles) => {
      const role = auth?.session.role;
      return role ? roles.includes(role) : false;
    },
  }), [auth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
