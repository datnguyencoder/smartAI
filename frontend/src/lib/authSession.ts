import type { UserDto } from '@/types/api';

const TOKEN_KEY = 'smartmart_token';
const REFRESH_KEY = 'smartmart_refresh_token';
const USER_KEY = 'smartmart_user';

export function getAccessToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_KEY);
}

export function persistSession(user: UserDto, accessToken: string, refreshToken?: string | null) {
  sessionStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    sessionStorage.setItem(REFRESH_KEY, refreshToken);
  }
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function updateTokens(accessToken: string, refreshToken?: string | null) {
  sessionStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    sessionStorage.setItem(REFRESH_KEY, refreshToken);
  }
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function loadStoredUser(): UserDto | null {
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserDto;
  } catch {
    return null;
  }
}
