/**
 * Cấu hình môi trường Vite — đọc biến tại một chỗ.
 * Thêm biến mới: cập nhật `.env.example`, `src/vite-env.d.ts`, và export tại đây.
 *
 * @see https://vitejs.dev/guide/env-and-mode
 */

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function resolveApiBaseUrl(): string {
  if (
    typeof window !== 'undefined' &&
    window.location.hostname === 'smartai.datnguyencoder.asia'
  ) {
    return '';
  }

  const fromEnv =
    import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_API_URL; // legacy alias
  if (fromEnv) return normalizeBaseUrl(fromEnv);
  return 'http://localhost:8080';
}

/** Base URL Spring Boot (`/api/v1/...`). */
export const API_BASE_URL = resolveApiBaseUrl();
