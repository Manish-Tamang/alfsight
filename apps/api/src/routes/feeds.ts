import { Hono } from "hono";
import { createFeedSchema, updateFeedSchema } from "@instagram-widget/validation";
import type { Env, AppVariables } from "../types";
import { requireAuth } from "../middleware";
import { apiError } from "../lib/utils";
import { normalizeInstagramIdentifier } from "../services/instagram/openhandle";
import { OpenHandleError } from "@openhandle/sdk";

const feedsRouter = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// ─── GET /feeds ─────────────────────────────────────────────
// List feeds for the authenticated user
feedsRouter.get("/", requireAuth, async (c) => {
  const feedService = c.get("feedService");
  const userId = c.get("userId")!;
  const publicInstagram = c.get("publicInstagram");

  const userFeeds = await feedService.listByUser(userId);
  const feedsWithAvatar = await Promise.all(
    userFeeds.map(async (feed) => {
      if (
        !feed.settings.instagramHandle?.trim() ||
        (feed.settings.headerAvatarUrl &&
          feed.settings.headerPostCount !== undefined &&
          feed.settings.headerFollowers !== undefined &&
          feed.settings.headerFollowing !== undefined)
      ) {
        return feed;
      }
      const updated = await feedService.ensureStoredProfileAvatar(feed.id, publicInstagram);
      return updated ?? feed;
    }),
  );

  return c.json(feedsWithAvatar);
});

// ─── GET /feeds/:id ─────────────────────────────────────────
// Public — used by the widget to fetch feed data
feedsRouter.get("/:id", async (c) => {
  const feedId = c.req.param("id");
  const feedService = c.get("feedService");
  await feedService.ensureStoredProfileAvatar(feedId, c.get("publicInstagram"));

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

  const handle = parsed.data.settings.instagramHandle?.trim();
  if (!handle) {
    return apiError(c, 400, "VALIDATION_ERROR", "An Instagram username is required to create a feed");
  }

  try {
    const settings = await feedService.applyPublicProfileToSettings(
      parsed.data.settings,
      c.get("publicInstagram"),
    );
    const feed = await feedService.create(userId, {
      ...parsed.data,
      settings,
    });
    await feedService.syncPublicMedia(feed.id, c.get("publicInstagram"));
    return c.json(feed, 201);
  } catch (error) {
    if (error instanceof OpenHandleError) {
      const status = error.status === 401 ? 503 : error.status === 403 ? 403 : error.status === 404 ? 404 : 400;
      const message = error.code === "UNAUTHENTICATED"
        ? "OpenHandle is not configured for the API. Add OPENHANDLE_TEST_KEY to apps/api/.dev.vars and restart the API."
        : error.code === "PROFILE_PRIVATE"
          ? "That Instagram profile is private."
          : error.code === "PROFILE_NOT_FOUND"
            ? "That Instagram profile was not found."
            : "Could not load that public Instagram profile.";
      return apiError(c, status, "INSTAGRAM_API_ERROR", message);
    }
    return apiError(c, 502, "INSTAGRAM_API_ERROR", "Could not load that public Instagram profile");
  }
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

  const existing = await feedService.getById(feedId);
  if (!existing) {
    return apiError(c, 404, "FEED_NOT_FOUND", "Feed not found");
  }

  const settings = parsed.data.settings;
  if (settings?.instagramHandle) {
    const normalizedHandle = normalizeInstagramIdentifier(settings.instagramHandle.trim());
    const previousHandle = existing.settings.instagramHandle?.trim();
    const handleChanged = previousHandle
      ? normalizedHandle !== normalizeInstagramIdentifier(previousHandle)
      : true;
    const missingAvatar = !existing.settings.headerAvatarUrl;

    if (handleChanged || missingAvatar) {
      try {
        parsed.data.settings = await feedService.applyPublicProfileToSettings(
          settings,
          c.get("publicInstagram"),
        );
      } catch (error) {
        if (error instanceof OpenHandleError && error.code === "UNAUTHENTICATED") {
          return apiError(c, 503, "INSTAGRAM_API_ERROR", "OpenHandle is not configured for the API. Add OPENHANDLE_TEST_KEY to apps/api/.dev.vars and restart the API.");
        }
        return apiError(c, 400, "INSTAGRAM_API_ERROR", "Could not load that public Instagram profile");
      }
    } else {
      parsed.data.settings = {
        ...settings,
        instagramHandle: normalizedHandle,
      };
    }
  }

  const feed = await feedService.update(feedId, parsed.data);
  if (!feed) {
    return apiError(c, 404, "FEED_NOT_FOUND", "Feed not found");
  }

  if (feed?.settings.instagramHandle) {
    await feedService.syncPublicMedia(feed.id, c.get("publicInstagram"));
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
    const publicHandle = feed.settings.instagramHandle;
    if (publicHandle) {
      const count = await feedService.syncPublicMedia(feedId, c.get("publicInstagram"));
      return c.json({ message: "Feed refreshed successfully", syncedPosts: count });
    }
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
