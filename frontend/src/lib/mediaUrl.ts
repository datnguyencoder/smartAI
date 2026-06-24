import { API_BASE_URL } from '@/lib/env';

const API_BASE = API_BASE_URL;

export function resolveMediaUrl(imageUrl?: string | null): string | undefined {
  if (!imageUrl) return undefined;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  return `${API_BASE}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
}
