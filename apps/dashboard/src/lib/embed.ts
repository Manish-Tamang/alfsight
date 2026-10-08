export const WIDGET_ORIGIN =
  typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? `${window.location.protocol}//${window.location.hostname}:5174`
    : "http://localhost:5174";

export const API_BASE =
  typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? `${window.location.origin.replace(/:\d+$/, "")}:8787`
    : "https://localhost:8787";

export function getEmbedSnippet(feedId: string, apiBase = API_BASE, widgetOrigin = WIDGET_ORIGIN) {
  return `<instagram-feed feed="${feedId}" api-base="${apiBase}"></instagram-feed>
<script src="${widgetOrigin}/src/index.ts" type="module"></script>`;
}
