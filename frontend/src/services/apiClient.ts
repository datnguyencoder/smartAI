import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  updateTokens,
} from '@/lib/authSession';
import { mapErrorCode } from '@/lib/errorMessages';
import type { ApiEnvelope, AuthDto } from '@/types/api';

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

/** @deprecated dùng authSession.getAccessToken */
export function setToken(token: string | null) {
  if (token) sessionStorage.setItem('smartmart_token', token);
  else sessionStorage.removeItem('smartmart_token');
}

export function setRefreshToken(token: string | null) {
  if (token) sessionStorage.setItem('smartmart_refresh_token', token);
  else sessionStorage.removeItem('smartmart_refresh_token');
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
        updateTokens(body.data.accessToken, body.data.refreshToken ?? refreshToken);
        if (body.data.user) {
          sessionStorage.setItem('smartmart_user', JSON.stringify(body.data.user));
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
    const token = getAccessToken();
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

/** Role-restricted endpoints (e.g. orders for WAREHOUSE) — skip without failing the whole batch. */
export async function ignoreForbidden<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (e) {
    if (e instanceof ApiClientError && e.status === 403) {
      return fallback;
    }
    throw e;
  }
}

export async function apiDownloadBlob(
  path: string,
  options: RequestInit = {},
  auth = true,
  retried = false
): Promise<Blob> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    if (res.status === 401 && auth && !retried) {
      const newToken = await tryRefreshToken();
      if (newToken) {
        return apiDownloadBlob(path, options, auth, true);
      }
      clearSession();
    } else if (res.status === 401) {
      clearSession();
    }
    throw new ApiClientError('Failed to download file', res.status);
  }
  
  return await res.blob();
}
