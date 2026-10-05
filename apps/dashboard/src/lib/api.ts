import type { FeedMeta, FeedSettings } from "@instagram-widget/types";

const DEV_USER_HEADER: HeadersInit = { "x-dev-user-id": "dev-user-1" };

async function parse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  async listFeeds(): Promise<FeedMeta[]> {
    const res = await fetch("/api/feeds", { headers: DEV_USER_HEADER });
    return parse<FeedMeta[]>(res);
  },

  async getFeed(id: string): Promise<FeedMeta> {
    const res = await fetch(`/api/feeds/${id}`, { headers: DEV_USER_HEADER });
    return parse<FeedMeta>(res);
  },

  async createFeed(input: { name: string; settings: FeedSettings }): Promise<FeedMeta> {
    const res = await fetch("/api/feeds", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...DEV_USER_HEADER },
      body: JSON.stringify(input),
    });
    return parse<FeedMeta>(res);
  },

  async updateFeed(
    id: string,
    input: Partial<{ name: string; settings: FeedSettings }>,
  ): Promise<FeedMeta> {
    const res = await fetch(`/api/feeds/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...DEV_USER_HEADER },
      body: JSON.stringify(input),
    });
    return parse<FeedMeta>(res);
  },

  async deleteFeed(id: string): Promise<void> {
    const res = await fetch(`/api/feeds/${id}`, {
      method: "DELETE",
      headers: DEV_USER_HEADER,
    });
    if (!res.ok) throw new Error(`Delete failed (${res.status})`);
  },

  async syncFeed(id: string): Promise<{ syncedPosts: number }> {
    const res = await fetch(`/api/feeds/${id}/refresh`, {
      method: "POST",
      headers: DEV_USER_HEADER,
    });
    return parse(res);
  },
};

export const defaultFeedSettings: FeedSettings = {
  instagramHandle: "",
  columns: 4,
  rows: 2,
  layout: "grid",
  postCount: 8,
  order: "newest",
  gap: 16,
  borderRadius: 8,
  cardStyle: "clean",
  showCaption: true,
  hoverEffect: true,
  hoverStyle: "zoom",
};
