import { clearAuthTokens, setAuthTokens } from '../services/apiClient';
import type { UserDto } from '../types/api';

const USER_KEY = 'smartmart_user';

export function persistSession(user: UserDto, accessToken: string, refreshToken: string) {
  setAuthTokens(accessToken, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  clearAuthTokens();
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
