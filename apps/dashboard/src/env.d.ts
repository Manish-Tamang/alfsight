/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** API Worker URL, e.g. https://instagram-widget-api.you.workers.dev. Empty in dev (Vite proxy). */
  readonly PUBLIC_API_BASE?: string;
  /** Widget Pages URL, e.g. https://alfsight-widget.pages.dev. */
  readonly PUBLIC_WIDGET_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
