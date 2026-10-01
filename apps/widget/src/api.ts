import type { FeedResponse } from "@instagram-widget/types";

const DEFAULT_API_BASE = "https://api.instagram-widget.com";

/**
 * Fetch feed data from the API.
 * Uses the same response shape defined in @instagram-widget/types.
 */
export async function fetchFeed(
  feedId: string,
  apiBase?: string
): Promise<FeedResponse> {
  const base = apiBase && apiBase.trim() !== "" ? apiBase : "";
  const url = `${base}/api/feeds/${encodeURIComponent(feedId)}`;

  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      (body as { error?: { message?: string } })?.error?.message ??
      `HTTP ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<FeedResponse>;
}
