/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Sitekey pública del widget de Turnstile (definida en .env). */
  readonly VITE_TURNSTILE_SITE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
