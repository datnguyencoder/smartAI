import * as React from 'react';
import { clearSession, getAccessToken, getRefreshToken, loadStoredUser, persistSession } from '@/lib/authSession';
import { fetchMe, login as loginApi, logout as logoutApi } from '@/services/wmsApi';
import type { UserDto } from '@/types/api';

type AuthContextValue = {
  authUser: UserDto | null;
  setAuthUser: React.Dispatch<React.SetStateAction<UserDto | null>>;
  sessionReady: boolean;
  login: (username: string, password: string) => Promise<UserDto>;
  logout: () => Promise<void>;
  token: string | null;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = React.useState<UserDto | null>(() => loadStoredUser());
  const [sessionReady, setSessionReady] = React.useState(() => !getAccessToken() && !getRefreshToken());

  React.useEffect(() => {
    const token = getAccessToken();
    const refreshToken = getRefreshToken();
    if (!token && !refreshToken) {
      setSessionReady(true);
      return;
    }
    fetchMe()
      .then((user) => {
        setAuthUser(user);
        sessionStorage.setItem('smartmart_user', JSON.stringify(user));
      })
      .catch(() => {
        clearSession();
        setAuthUser(null);
      })
      .finally(() => setSessionReady(true));
  }, []);

  const login = React.useCallback(async (username: string, password: string) => {
    const auth = await loginApi(username, password);
    persistSession(auth.user, auth.accessToken, auth.refreshToken);
    setAuthUser(auth.user);
    return auth.user;
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
    () => ({ authUser, setAuthUser, sessionReady, login, logout, token: getAccessToken() }),
    [authUser, sessionReady, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
