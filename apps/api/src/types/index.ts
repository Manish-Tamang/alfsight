import type { CacheProvider } from "@instagram-widget/types";
import type { FeedService } from "../services/feeds";
import type { MetaInstagramProvider } from "../services/instagram";

/**
 * Cloudflare Worker environment bindings.
 */
export interface Env {
  // Cloudflare bindings
  DB: D1Database;
  FEED_CACHE: KVNamespace;

  // Environment variables
  ENVIRONMENT: string;

  // Secrets (set via `wrangler secret put`)
  META_APP_ID: string;
  META_APP_SECRET: string;
  META_REDIRECT_URI: string;
}

/**
 * Extended Hono variables available in request context.
 */
export interface AppVariables {
  feedService: FeedService;
  cache: CacheProvider;
  instagram: MetaInstagramProvider;
  userId: string | null;
}
