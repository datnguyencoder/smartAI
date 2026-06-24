/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend REST base URL — chuẩn dự án. */
  readonly VITE_API_BASE_URL?: string;
  /** @deprecated Dùng VITE_API_BASE_URL — giữ tạm cho .env cũ. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
