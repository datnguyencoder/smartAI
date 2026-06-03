import type { ApiEnvelope } from '../types/api';
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

export function setToken(token: string | null) {
  if (token) localStorage.setItem('smartmart_token', token);
  else localStorage.removeItem('smartmart_token');
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  auth = true
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
    if (res.status === 401) setToken(null);
    throw new ApiClientError(
      mapErrorCode(body.errorCode, body.message ?? res.statusText),
      res.status,
      body.errorCode
    );
  }
  return body.data as T;
}
