const devHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
const trimSlash = (url: string) => url.replace(/\/+$/, "");

/** Where the dashboard sends API requests. Empty means same origin (the Vite dev proxy). */
export const API_BASE = trimSlash(import.meta.env.PUBLIC_API_BASE ?? "");

/** Absolute API URL baked into embed snippets and previews. */
export const PUBLIC_API_URL = API_BASE || `https://${devHost}:8787`;

/** Where the widget script and preview page are served. */
export const WIDGET_URL = trimSlash(import.meta.env.PUBLIC_WIDGET_URL || `http://${devHost}:5174`);
export const WIDGET_ORIGIN = new URL(WIDGET_URL).origin;

/** Live preview page for a feed. In dev the widget server proxies /api itself. */
export function getPreviewUrl(feedId: string) {
  const params = new URLSearchParams({ feed: feedId });
  if (API_BASE) params.set("api", API_BASE);
  return `${WIDGET_URL}/?${params}`;
}

export function getEmbedSnippet(feedId: string, apiBase = PUBLIC_API_URL, widgetUrl = WIDGET_URL) {
  const script = import.meta.env.DEV
    ? `<script src="${widgetUrl}/src/index.ts" type="module"></script>`
    : `<script src="${widgetUrl}/instagram.iife.js" defer></script>`;
  return `<instagram-feed feed="${feedId}" api-base="${apiBase}"></instagram-feed>
${script}`;
}
