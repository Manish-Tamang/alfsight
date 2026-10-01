import { Hono } from "hono";
import { createFeedSchema, updateFeedSchema } from "@instagram-widget/validation";
import type { Env, AppVariables } from "../types";
import { requireAuth } from "../middleware";
import { apiError } from "../lib/utils";

const feedsRouter = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// ─── GET /feeds ─────────────────────────────────────────────
// List feeds for the authenticated user
feedsRouter.get("/", requireAuth, async (c) => {
  const feedService = c.get("feedService");
  const userId = c.get("userId")!;

  const userFeeds = await feedService.listByUser(userId);
  return c.json(userFeeds);
});

// ─── GET /feeds/:id ─────────────────────────────────────────
// Public — used by the widget to fetch feed data
feedsRouter.get("/:id", async (c) => {
  const feedId = c.req.param("id");
  const feedService = c.get("feedService");

  const feed = await feedService.getFeedResponse(feedId);
  if (!feed) {
    return apiError(c, 404, "FEED_NOT_FOUND", "Feed not found");
  }

  return c.json(feed);
});

// ─── POST /feeds ────────────────────────────────────────────
feedsRouter.post("/", requireAuth, async (c) => {
  const feedService = c.get("feedService");
  const userId = c.get("userId")!;

  const body = await c.req.json();
  const parsed = createFeedSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(c, 400, "VALIDATION_ERROR", "Invalid request body", parsed.error.flatten());
  }

  const feed = await feedService.create(userId, parsed.data);

  // If connected to an Instagram account, trigger initial sync
  if (parsed.data.instagramAccountId) {
    try {
      await feedService.syncInstagramMedia(feed.id, c.get("instagram"));
    } catch (err) {
      console.warn("Initial Instagram sync failed:", err);
    }
  }

  return c.json(feed, 201);
});

// ─── PATCH /feeds/:id ───────────────────────────────────────
feedsRouter.patch("/:id", requireAuth, async (c) => {
  const feedId = c.req.param("id");
  const feedService = c.get("feedService");

  const body = await c.req.json();
  const parsed = updateFeedSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(c, 400, "VALIDATION_ERROR", "Invalid request body", parsed.error.flatten());
  }

  const feed = await feedService.update(feedId, parsed.data);
  if (!feed) {
    return apiError(c, 404, "FEED_NOT_FOUND", "Feed not found");
  }

  return c.json(feed);
});

// ─── DELETE /feeds/:id ──────────────────────────────────────
feedsRouter.delete("/:id", requireAuth, async (c) => {
  const feedId = c.req.param("id");
  const feedService = c.get("feedService");

  const deleted = await feedService.delete(feedId);
  if (!deleted) {
    return apiError(c, 404, "FEED_NOT_FOUND", "Feed not found");
  }

  return c.json({ success: true });
});

// ─── GET /feeds/:id/posts ───────────────────────────────────
feedsRouter.get("/:id/posts", requireAuth, async (c) => {
  const feedId = c.req.param("id");
  const feedService = c.get("feedService");

  const feed = await feedService.getById(feedId);
  if (!feed) {
    return apiError(c, 404, "FEED_NOT_FOUND", "Feed not found");
  }

  const feedPosts = await feedService.getPosts(feedId);
  return c.json({ posts: feedPosts });
});

// ─── POST /feeds/:id/refresh ────────────────────────────────
feedsRouter.post("/:id/refresh", requireAuth, async (c) => {
  const feedId = c.req.param("id");
  const feedService = c.get("feedService");
  const instagram = c.get("instagram");

  const feed = await feedService.getById(feedId);
  if (!feed) {
    return apiError(c, 404, "FEED_NOT_FOUND", "Feed not found");
  }

  try {
    const count = await feedService.syncInstagramMedia(feedId, instagram);
    return c.json({
      message: "Feed refreshed successfully",
      syncedPosts: count,
    });
  } catch (err: any) {
    console.error("Feed refresh failed:", err);
    return apiError(c, 500, "INSTAGRAM_API_ERROR", err.message || "Failed to sync media");
  }
});

export { feedsRouter };
