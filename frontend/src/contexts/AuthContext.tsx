import * as React from 'react';
import { clearSession, loadStoredUser, persistSession } from '../lib/authSession';
import { fetchMe, login as loginApi, logout as logoutApi } from '../services/wmsApi';
import type { UserDto } from '../types/api';

type AuthContextValue = {
  authUser: UserDto | null;
  setAuthUser: React.Dispatch<React.SetStateAction<UserDto | null>>;
  sessionReady: boolean;
  login: (username: string, password: string) => Promise<UserDto>;
  logout: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = React.useState<UserDto | null>(() => loadStoredUser());
  const [sessionReady, setSessionReady] = React.useState(() => !localStorage.getItem('smartmart_token'));

  React.useEffect(() => {
    const token = localStorage.getItem('smartmart_token');
    if (!token) {
      setSessionReady(true);
      return;
    }
    fetchMe()
      .then((user) => {
        const cleanUser = { ...user, role: user.role?.replace('ROLE_', '') || user.role };
        setAuthUser(cleanUser);
        localStorage.setItem('smartmart_user', JSON.stringify(cleanUser));
      })
      .catch(() => {
        clearSession();
        setAuthUser(null);
      })
      .finally(() => setSessionReady(true));
  }, []);

  const login = React.useCallback(async (username: string, password: string) => {
    const auth = await loginApi(username, password);
    const cleanUser = { ...auth.user, role: auth.user.role?.replace('ROLE_', '') || auth.user.role };
    persistSession(cleanUser, auth.accessToken);
    setAuthUser(cleanUser);
    return cleanUser;
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      /* vẫn xóa session */
    }
    clearSession();
    setAuthUser(null);
  }, []);

  const value = React.useMemo(
    () => ({ authUser, setAuthUser, sessionReady, login, logout }),
    [authUser, sessionReady, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
