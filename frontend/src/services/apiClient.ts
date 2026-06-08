import type { ApiEnvelope, AuthDto } from '../types/api';
import { mapErrorCode } from '../lib/errorMessages';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export class ApiClientError extends Error {
  errorCode?: string;
  status: number;

  constructor(message: string, status: number, errorCode?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.errorCode = errorCode;
  }
}

function getToken(): string | null {
  return localStorage.getItem('smartmart_token');
}

function getRefreshToken(): string | null {
  return localStorage.getItem('smartmart_refresh_token');
}


export function setToken(token: string | null) {
  if (token) localStorage.setItem('smartmart_token', token);
  else localStorage.removeItem('smartmart_token');
}

export function setRefreshToken(token: string | null) {
  if (token) localStorage.setItem('smartmart_refresh_token', token);
  else localStorage.removeItem('smartmart_refresh_token');
}

export function setAuthTokens(accessToken: string, refreshToken: string) {
  setToken(accessToken);
  setRefreshToken(refreshToken);
}

export function clearAuthTokens() {
  setToken(null);
  setRefreshToken(null);
}

let refreshInFlight: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        const body = (await res.json().catch(() => ({}))) as ApiEnvelope<AuthDto>;

        if (!res.ok || body.success === false || !body.data?.accessToken) {
          return null;
        }

        setAuthTokens(body.data.accessToken, body.data.refreshToken ?? refreshToken);

        if (body.data.user) {
          localStorage.setItem('smartmart_user', JSON.stringify(body.data.user));
        }

        return body.data.accessToken;
      } catch {
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

function clearSession() {
  clearAuthTokens();
  localStorage.removeItem('smartmart_user');
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
  retried = false
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const body = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;

  if (!res.ok || body.success === false) {
    if (res.status === 401 && auth && !retried) {
      const newToken = await tryRefreshToken();
      if (newToken) {
        return apiRequest<T>(path, options, auth, true);
      }
      clearSession();
    } else if (res.status === 401) {
      clearSession();
    }
    throw new ApiClientError(
      mapErrorCode(body.errorCode, body.message ?? res.statusText),
      res.status,
      body.errorCode
    );
  }
  return body.data as T;
}


