import type { UserDto } from '@/types/api';

const TOKEN_KEY = 'smartmart_token';
const REFRESH_KEY = 'smartmart_refresh_token';
const USER_KEY = 'smartmart_user';

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function persistSession(user: UserDto, accessToken: string, refreshToken?: string | null) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function updateTokens(accessToken: string, refreshToken?: string | null) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function loadStoredUser(): UserDto | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserDto;
  } catch {
    return null;
  }
}
