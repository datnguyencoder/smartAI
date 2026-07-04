import { getAccessToken } from '@/lib/authSession';
import { API_BASE_URL } from '@/lib/env';

export async function uploadMedia(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  const headers: Record<string, string> = {};
  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/api/v1/media/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Failed to upload media');
  }

  const body = await res.json();
  return body.data;
}
