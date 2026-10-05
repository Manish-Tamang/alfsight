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

/**
 * Placeholder auth middleware.
 *
 * In development, it optionally reads a dev user header.
 * Replace this with a real auth provider (e.g. JWT, session) later.
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
    // TODO: Implement real authentication
    c.set("userId", null);
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
