import { getRefreshToken } from '@/lib/authSession';
import { apiRequest } from '@/services/apiClient';
import type { AuthDto, UserDto } from '@/types/api';

export async function login(username: string, password: string) {
  return apiRequest<AuthDto>(
    '/api/v1/auth/login',
    { method: 'POST', body: JSON.stringify({ username, password }) },
    false
  );
}

export function logout() {
  const refreshToken = getRefreshToken();
  return apiRequest<void>('/api/v1/auth/logout', {
    method: 'POST',
    body: JSON.stringify(refreshToken ? { refreshToken } : {}),
  });
}

export function fetchMe() {
  return apiRequest<UserDto>('/api/v1/auth/me');
}

export function refreshAuth() {
  const refreshToken = getRefreshToken();
  return apiRequest<AuthDto>(
    '/api/v1/auth/refresh',
    {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    },
    false
  );
}
