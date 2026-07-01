import { API_BASE_URL } from '@/lib/env';

const API_BASE = API_BASE_URL;

export function resolveMediaUrl(imageUrl?: string | null): string | undefined {
  const url = imageUrl?.trim();
  if (!url) return undefined;
  if (/^(https?:|data:|blob:)/i.test(url)) {
    return url;
  }
  return `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`;
}
