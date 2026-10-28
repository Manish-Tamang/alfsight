import { createMiddleware } from "hono/factory";
import type { Env, AppVariables } from "../types";
import { KVCacheService } from "../services/cache";
import { FeedService } from "../services/feeds";
import { MetaInstagramProvider } from "../services/instagram";
import { OpenHandleInstagramProvider } from "../services/instagram/openhandle";

/**
 * Initializes shared services and attaches them to the Hono context.
 * Runs once per request so services have access to the correct env bindings.
 */
export const servicesMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: AppVariables;
}>(async (c, next) => {
  const cache = new KVCacheService(c.env.FEED_CACHE);
  const feedService = new FeedService(c.env.DB, cache);
  const instagram = new MetaInstagramProvider({
    appId: c.env.META_APP_ID ?? "",
    appSecret: c.env.META_APP_SECRET ?? "",
    redirectUri: c.env.META_REDIRECT_URI ?? "",
  });
  const publicInstagram = new OpenHandleInstagramProvider(
    c.env.OPENHANDLE_LIVE_KEY ?? c.env.OPENHANDLE_TEST_KEY ?? ""
  );

  c.set("cache", cache);
  c.set("feedService", feedService);
  c.set("instagram", instagram);
  c.set("publicInstagram", publicInstagram);

  await next();
});

/** User id that owns feeds created with the admin token. */
export const ADMIN_USER_ID = "admin";

/** Compare two strings without leaking where they differ. */
async function safeEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [hashA, hashB] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(a)),
    crypto.subtle.digest("SHA-256", encoder.encode(b)),
  ]);
  return crypto.subtle.timingSafeEqual(hashA, hashB);
}

/**
 * Single-tenant auth middleware.
 *
 * In development, it reads the `x-dev-user-id` header.
 * In production, `Authorization: Bearer <ADMIN_TOKEN>` signs in as the admin.
 */
export const authMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: AppVariables;
}>(async (c, next) => {
  // Development-only: allow a dev user header
  if (c.env.ENVIRONMENT === "development") {
    const devUserId = c.req.header("x-dev-user-id");
    c.set("userId", devUserId ?? null);
  } else {
    const header = c.req.header("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    const adminToken = c.env.ADMIN_TOKEN ?? "";
    const valid = token !== "" && adminToken !== "" && (await safeEqual(token, adminToken));
    c.set("userId", valid ? ADMIN_USER_ID : null);
  }

  await next();
});

/**
 * Requires an authenticated user. Returns 401 if no user is set.
 */
export const requireAuth = createMiddleware<{
  Bindings: Env;
  Variables: AppVariables;
}>(async (c, next) => {
  const userId = c.get("userId");
  if (!userId) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      401
    );
  }
  await next();
});
