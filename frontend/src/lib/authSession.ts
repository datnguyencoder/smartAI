import { setToken } from '../services/apiClient';
import type { UserDto } from '../types/api';

const USER_KEY = 'smartmart_user';

export function persistSession(user: UserDto, accessToken: string) {
  setToken(accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  setToken(null);
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
