/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_DEBUG_LOGGING: string;
  readonly VITE_TOKEN_REFRESH_INTERVAL: string;
  readonly VITE_DEFAULT_THEME: 'light' | 'dark';
  readonly VITE_ENABLE_NOTIFICATIONS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
