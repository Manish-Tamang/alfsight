import { Hono, type Context } from "hono";
import { OpenHandleError } from "@openhandle/sdk";
import type { CacheProvider, InstagramPage, InstagramAudienceMember, InstagramPublicProfile } from "@instagram-widget/types";
import type { Env, AppVariables } from "../types";
import { instagramCacheKey, INSTAGRAM_CACHE_TTL } from "../services/cache";
import { normalizeInstagramIdentifier } from "../services/instagram/openhandle";

const publicInstagramRouter = new Hono<{ Bindings: Env; Variables: AppVariables }>();

type PublicContext = Context<{ Bindings: Env; Variables: AppVariables }>;

function errorResponse(c: PublicContext, error: unknown) {
  if (error instanceof OpenHandleError) {
    console.error("OpenHandle request failed", {
      code: error.code,
      status: error.status,
      requestId: error.requestId,
    });
    const status = error.status ?? ({
      PROFILE_PRIVATE: 403,
      PROFILE_NOT_FOUND: 404,
      INVALID_IDENTIFIER: 400,
      INVALID_URL: 400,
      RATE_LIMITED: 429,
      UNAUTHENTICATED: 503,
    } as Record<string, number>)[error.code] ?? 502;
    const messages: Record<string, string> = {
      PROFILE_PRIVATE: "This Instagram profile is private.",
      PROFILE_NOT_FOUND: "This Instagram profile was not found.",
      INVALID_IDENTIFIER: "Enter a valid Instagram username, ID, or URL.",
      INVALID_URL: "Enter a supported Instagram URL.",
      RATE_LIMITED: "Instagram data is temporarily rate limited. Try again shortly.",
      UNAUTHENTICATED: "Instagram data is not configured on the server.",
    };
    if (error.code === "RATE_LIMITED") c.header("Retry-After", String(error.retryAfter ?? 30));
    return c.json({ error: { code: error.code, message: messages[error.code] ?? "Instagram data could not be loaded." } }, status as 400 | 401 | 402 | 403 | 404 | 409 | 429 | 451 | 500 | 502 | 503);
  }
  if (error instanceof Error) {
    console.error("Public Instagram provider failure", { name: error.name, message: error.message });
  } else {
    console.error("Public Instagram provider failure", { errorType: typeof error });
  }
  return c.json({ error: { code: "INSTAGRAM_API_ERROR", message: "Instagram data could not be loaded." } }, 502);
}

async function profileFor(c: PublicContext, identifier: string) {
  const normalized = normalizeInstagramIdentifier(identifier);
  const cache = c.get("cache");
  const provider = c.get("publicInstagram");
  const aliasKey = instagramCacheKey("profile", normalized);
  const cached = await cache.get<InstagramPublicProfile>(aliasKey);
  if (cached) return { profile: cached, identifier: normalized };
  const profile = await provider.getProfile(normalized);
  await cache.set(aliasKey, profile, INSTAGRAM_CACHE_TTL.profile);
  await cache.set(instagramCacheKey("profile", profile.id), profile, INSTAGRAM_CACHE_TTL.profile);
  return { profile, identifier: normalized };
}

async function listResource<T>(c: PublicContext, identifier: string, resource: string, ttl: number, load: (id: string, cursor?: string) => Promise<InstagramPage<T>>) {
  const { profile, identifier: normalized } = await profileFor(c, identifier);
  const cursor = c.req.query("cursor") || undefined;
  const key = instagramCacheKey(resource, profile.id, cursor);
  const cache: CacheProvider = c.get("cache");
  const cached = await cache.get<InstagramPage<T>>(key);
  if (cached) return c.json(cached);
  const result = await load(normalized, cursor);
  if (result.data.length > 0) await cache.set(key, result, ttl);
  return c.json(result);
}

publicInstagramRouter.get("/:identifier/posts", async (c) => {
  try { return await listResource(c, c.req.param("identifier"), "posts", INSTAGRAM_CACHE_TTL.posts, (id, cursor) => c.get("publicInstagram").getPosts(id, cursor)); }
  catch (error) { return errorResponse(c, error); }
});

publicInstagramRouter.get("/:identifier/reels", async (c) => {
  try { return await listResource(c, c.req.param("identifier"), "reels", INSTAGRAM_CACHE_TTL.reels, (id, cursor) => c.get("publicInstagram").getReels(id, cursor)); }
  catch (error) { return errorResponse(c, error); }
});

publicInstagramRouter.get("/:identifier/stories", async (c) => {
  try { return await listResource(c, c.req.param("identifier"), "stories", INSTAGRAM_CACHE_TTL.stories, (id, cursor) => c.get("publicInstagram").getStories(id, cursor)); }
  catch (error) { return errorResponse(c, error); }
});

publicInstagramRouter.get("/:identifier/highlights", async (c) => {
  try { return await listResource(c, c.req.param("identifier"), "highlights", INSTAGRAM_CACHE_TTL.highlights, (id, cursor) => c.get("publicInstagram").getHighlights(id, cursor)); }
  catch (error) { return errorResponse(c, error); }
});

publicInstagramRouter.get("/:identifier/followers", async (c) => {
  try { return await listResource<InstagramAudienceMember>(c, c.req.param("identifier"), "followers", INSTAGRAM_CACHE_TTL.audience, (id, cursor) => c.get("publicInstagram").getFollowers(id, cursor)); }
  catch (error) { return errorResponse(c, error); }
});

publicInstagramRouter.get("/:identifier/following", async (c) => {
  try { return await listResource<InstagramAudienceMember>(c, c.req.param("identifier"), "following", INSTAGRAM_CACHE_TTL.audience, (id, cursor) => c.get("publicInstagram").getFollowing(id, cursor)); }
  catch (error) { return errorResponse(c, error); }
});

publicInstagramRouter.get("/:identifier", async (c) => {
  try {
    const { profile } = await profileFor(c, c.req.param("identifier"));
    return c.json(profile);
  } catch (error) {
    return errorResponse(c, error);
  }
});

export { publicInstagramRouter };