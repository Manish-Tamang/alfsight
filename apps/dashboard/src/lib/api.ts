import type { FeedMeta, FeedSettings } from "@instagram-widget/types";
import { authHeaders, redirectToLogin } from "@/lib/auth";
import { API_BASE } from "@/lib/embed";

function request(path: string, init: RequestInit = {}) {
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers as Record<string, string>) },
  });
}

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 401 && !import.meta.env.DEV) {
    redirectToLogin();
    throw new Error("Sign in required");
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  async listFeeds(): Promise<FeedMeta[]> {
    const res = await request("/api/feeds");
    return parse<FeedMeta[]>(res);
  },

  async getFeed(id: string): Promise<FeedMeta> {
    const res = await request(`/api/feeds/${id}`);
    return parse<FeedMeta>(res);
  },

  async createFeed(input: { name: string; settings: FeedSettings }): Promise<FeedMeta> {
    const res = await request("/api/feeds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return parse<FeedMeta>(res);
  },

  async updateFeed(
    id: string,
    input: Partial<{ name: string; settings: FeedSettings }>,
  ): Promise<FeedMeta> {
    const res = await request(`/api/feeds/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return parse<FeedMeta>(res);
  },

  async deleteFeed(id: string): Promise<void> {
    const res = await request(`/api/feeds/${id}`, {
      method: "DELETE",
    });
    await parse(res);
  },

  async syncFeed(id: string): Promise<{ syncedPosts: number }> {
    const res = await request(`/api/feeds/${id}/refresh`, {
      method: "POST",
    });
    return parse(res);
  },
};

/** Check a token without the 401 redirect. Used by the login page. */
export async function verifyToken(token: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/feeds`, { headers: authHeaders(token) });
  return res.ok;
}

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
