import type { CacheProvider } from "@instagram-widget/types";

/**
 * Cloudflare KV-backed cache implementation.
 *
 * Wraps the KV binding behind the CacheProvider interface
 * so the rest of the app never touches KV directly.
 */
export class KVCacheService implements CacheProvider {
  constructor(private readonly kv: KVNamespace) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.kv.get(key, "text");
    if (raw === null) return null;

    try {
      return JSON.parse(raw) as T;
    } catch {
      // Corrupted value — treat as cache miss
      await this.kv.delete(key);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const options: KVNamespacePutOptions = {};
    if (ttlSeconds !== undefined && ttlSeconds > 0) {
      options.expirationTtl = ttlSeconds;
    }
    await this.kv.put(key, JSON.stringify(value), options);
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }
}

/** Default cache TTL: 1 hour */
export const DEFAULT_CACHE_TTL = 3600;

export const INSTAGRAM_CACHE_TTL = {
  profile: 86400,
  posts: 3600,
  reels: 3600,
  stories: 300,
  highlights: 3600,
  audience: 86400,
} as const;

export function instagramCacheKey(resource: string, stableId: string, cursor?: string): string {
  return `instagram:${resource}:${stableId}${cursor ? `:${cursor}` : ""}`;
}

/** Build a cache key for a feed response */
export function feedCacheKey(feedId: string): string {
  return `feed:${feedId}`;
}
