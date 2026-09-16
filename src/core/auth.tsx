import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { request } from './api';
import { sessionStore, type Session } from './session';

const AuthContext = createContext<{
  session: Session | null;
  login: (username: string, password: string) => Promise<Session>;
  logout: () => void;
} | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(sessionStore.subscribe, sessionStore.get);
  const cache = useQueryClient();
  useEffect(() => {
    if (!session) {
      cache.clear();
      return;
    }
    const timer = window.setTimeout(
      () => sessionStore.set(null),
      Math.max(0, session.expiresAt - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [session, cache]);
  const logout = () => {
    sessionStore.set(null);
    cache.clear();
  };
  async function login(username: string, password: string) {
    const result = await request('/AA/login', {
      method: 'POST',
      body: { Username: username, Password: password },
      anonymous: true,
    });
    const authorization = z
      .object({ UserToken: z.string().min(1), DisplayName: z.string() })
      .parse(result);
    const details = await request<{ UserTypeId: number }>(
      '/User/GetUserMasterDetailsforConfig?UserName=' + encodeURIComponent(username),
      { anonymous: true },
    );
    const profile = z.object({ UserTypeId: z.number() }).parse(details.Result);
    const configured = Number(import.meta.env.VITE_SESSION_MINUTES || 60);
    const minutes = Number.isFinite(configured) && configured > 0 ? Math.min(configured, 1440) : 60;
    const value = {
      token: authorization.UserToken,
      displayName: authorization.DisplayName,
      username,
      userTypeId: profile.UserTypeId,
      expiresAt: Date.now() + minutes * 60_000,
    };
    cache.clear();
    sessionStore.set(value);
    return value;
  }
  return <AuthContext.Provider value={{ session, login, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider is missing.');
  return context;
}
