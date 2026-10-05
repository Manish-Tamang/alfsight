import { eq } from "drizzle-orm";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import { feeds, posts, instagramAccounts } from "@instagram-widget/database";
import type { FeedResponse, FeedMeta, FeedSettings, CacheProvider, InstagramProvider, PublicInstagramProvider } from "@instagram-widget/types";
import type { CreateFeedInput, UpdateFeedInput } from "@instagram-widget/validation";
import { feedCacheKey, DEFAULT_CACHE_TTL } from "../cache";
import { normalizeInstagramIdentifier } from "../instagram/openhandle";

export class FeedService {
  private readonly db: DrizzleD1Database;
  private readonly cache: CacheProvider;

  constructor(d1: D1Database, cache: CacheProvider) {
    this.db = drizzle(d1);
    this.cache = cache;
  }

  /** Generate a URL-safe unique ID */
  private generateId(): string {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  }

  /** Parse stored JSON settings safely */
  private parseSettings(raw: string): FeedSettings {
    try {
      return JSON.parse(raw) as FeedSettings;
    } catch {
      return {};
    }
  }

  // ─── CRUD ──────────────────────────────────────────────────

  async create(userId: string, input: CreateFeedInput): Promise<FeedMeta> {
    const id = this.generateId();
    const now = new Date().toISOString();

    await this.db.insert(feeds).values({
      id,
      userId,
      instagramAccountId: input.instagramAccountId ?? null,
      name: input.name,
      settings: JSON.stringify(input.settings ?? {}),
      createdAt: now,
      updatedAt: now,
    });

    return {
      id,
      name: input.name,
      instagramAccountId: input.instagramAccountId ?? null,
      settings: input.settings ?? {},
      createdAt: now,
      updatedAt: now,
    };
  }

  async getById(feedId: string): Promise<FeedMeta | null> {
    const rows = await this.db
      .select()
      .from(feeds)
      .where(eq(feeds.id, feedId))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      instagramAccountId: row.instagramAccountId,
      settings: this.parseSettings(row.settings),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async update(feedId: string, input: UpdateFeedInput): Promise<FeedMeta | null> {
    const existing = await this.getById(feedId);
    if (!existing) return null;

    const now = new Date().toISOString();
    const values: Record<string, unknown> = { updatedAt: now };

    if (input.name !== undefined) values["name"] = input.name;
    if (input.instagramAccountId !== undefined) values["instagramAccountId"] = input.instagramAccountId;
    if (input.settings !== undefined) values["settings"] = JSON.stringify(input.settings);

    await this.db.update(feeds).set(values).where(eq(feeds.id, feedId));

    // Invalidate cache
    await this.cache.delete(feedCacheKey(feedId));

    const updated = await this.getById(feedId);
    return updated;
  }

  async delete(feedId: string): Promise<boolean> {
    const existing = await this.getById(feedId);
    if (!existing) return false;

    await this.db.delete(feeds).where(eq(feeds.id, feedId));
    await this.cache.delete(feedCacheKey(feedId));

    return true;
  }

  async listByUser(userId: string): Promise<FeedMeta[]> {
    const rows = await this.db
      .select()
      .from(feeds)
      .where(eq(feeds.userId, userId));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      instagramAccountId: row.instagramAccountId,
      settings: this.parseSettings(row.settings),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async applyPublicProfileToSettings(
    settings: FeedSettings,
    publicInstagram: PublicInstagramProvider,
  ): Promise<FeedSettings> {
    const handle = settings.instagramHandle?.trim();
    if (!handle) return settings;

    const normalizedHandle = normalizeInstagramIdentifier(handle);
    const profile = await publicInstagram.getProfile(normalizedHandle);

    return {
      ...settings,
      instagramHandle: normalizedHandle,
      headerName: profile.name ?? profile.username,
      headerUsername: profile.username,
      headerAvatarUrl: profile.avatarUrl ?? undefined,
      headerPostCount: profile.posts ?? undefined,
      headerFollowers: profile.followers ?? undefined,
      headerFollowing: profile.following ?? undefined,
    };
  }

  async ensureStoredProfileAvatar(
    feedId: string,
    publicInstagram: PublicInstagramProvider,
  ): Promise<FeedMeta | null> {
    const feed = await this.getById(feedId);
    if (!feed?.settings.instagramHandle?.trim()) return feed;
    if (
      feed.settings.headerAvatarUrl &&
      feed.settings.headerPostCount !== undefined &&
      feed.settings.headerFollowers !== undefined &&
      feed.settings.headerFollowing !== undefined
    ) return feed;

    try {
      const settings = await this.applyPublicProfileToSettings(feed.settings, publicInstagram);
      return await this.update(feedId, { settings });
    } catch {
      return feed;
    }
  }

  // ─── Feed + Posts (for widget) ──────────────────────────────

  /**
   * Get a feed response suitable for the widget.
   * Checks KV cache first; falls back to D1.
   */
  async getFeedResponse(feedId: string): Promise<FeedResponse | null> {
    // Try cache
    const cached = await this.cache.get<FeedResponse>(feedCacheKey(feedId));
    if (cached) return cached;

    // Fetch from D1
    const feed = await this.getById(feedId);
    if (!feed) return null;

    const feedPosts = await this.db
      .select()
      .from(posts)
      .where(eq(posts.feedId, feedId))
      .orderBy(posts.timestamp);

    let profileUsername = feed.settings.headerUsername;
    let profileName = feed.settings.headerName;
    let profileAvatarUrl = feed.settings.headerAvatarUrl;

    if (feed.instagramAccountId) {
      const accounts = await this.db
        .select()
        .from(instagramAccounts)
        .where(eq(instagramAccounts.id, feed.instagramAccountId))
        .limit(1);

      if (accounts[0]) {
        if (!profileUsername) profileUsername = accounts[0].username;
        if (!profileName) profileName = accounts[0].username;
        if (!profileAvatarUrl && accounts[0].profilePictureUrl) {
          profileAvatarUrl = accounts[0].profilePictureUrl;
        }
      }
    }

    if (!profileUsername) profileUsername = "instagram";
    if (!profileName) profileName = feed.name || profileUsername;
    if (!profileAvatarUrl && profileUsername && profileUsername !== "instagram") {
      profileAvatarUrl = `https://unavatar.io/instagram/${encodeURIComponent(profileUsername)}`;
    }

    const response: FeedResponse = {
      id: feed.id,
      name: feed.name,
      settings: feed.settings,
      profile: {
        name: profileName,
        username: profileUsername,
        avatarUrl: profileAvatarUrl || "",
        followUrl: `https://www.instagram.com/${profileUsername}/`,
        posts: feed.settings.headerPostCount ?? null,
        followers: feed.settings.headerFollowers ?? null,
        following: feed.settings.headerFollowing ?? null,
      },
      posts: feedPosts.map((p) => ({
        id: p.id,
        type: p.mediaType as FeedResponse["posts"][number]["type"],
        imageUrl: p.mediaUrl,
        thumbnailUrl: p.thumbnailUrl,
        permalink: p.permalink,
        caption: p.caption,
        likeCount: p.likeCount ?? null,
        timestamp: p.timestamp,
      })),
    };

    // Populate cache
    await this.cache.set(feedCacheKey(feedId), response, DEFAULT_CACHE_TTL);

    return response;
  }

  /**
   * Get posts for a feed (dashboard view).
   */
  async getPosts(feedId: string) {
    const feedPosts = await this.db
      .select()
      .from(posts)
      .where(eq(posts.feedId, feedId))
      .orderBy(posts.timestamp);

    return feedPosts;
  }

  /**
   * Fetch latest media from Instagram and update D1 and KV cache.
   */
  async syncInstagramMedia(feedId: string, instagramProvider: InstagramProvider): Promise<number> {
    const feed = await this.getById(feedId);
    if (!feed || !feed.instagramAccountId) {
      return 0;
    }

    const accounts = await this.db
      .select()
      .from(instagramAccounts)
      .where(eq(instagramAccounts.id, feed.instagramAccountId))
      .limit(1);

    const account = accounts[0];
    if (!account || !account.accessToken) {
      return 0;
    }

    const mediaList = await instagramProvider.getMedia(account.accessToken, 25);
    const now = new Date().toISOString();

    for (const media of mediaList) {
      const postId = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
      await this.db
        .insert(posts)
        .values({
          id: postId,
          feedId,
          instagramMediaId: media.id,
          mediaType: media.mediaType,
          mediaUrl: media.mediaUrl,
          thumbnailUrl: media.thumbnailUrl,
          permalink: media.permalink,
          caption: media.caption,
          likeCount: media.likeCount,
          timestamp: media.timestamp,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [posts.feedId, posts.instagramMediaId],
          set: {
            mediaType: media.mediaType,
            mediaUrl: media.mediaUrl,
            thumbnailUrl: media.thumbnailUrl,
            permalink: media.permalink,
            caption: media.caption,
            likeCount: media.likeCount,
            timestamp: media.timestamp,
            updatedAt: now,
          },
        });
    }

    await this.cache.delete(feedCacheKey(feedId));
    return mediaList.length;
  }

  async syncPublicMedia(feedId: string, instagramProvider: PublicInstagramProvider): Promise<number> {
    const feed = await this.getById(feedId);
    const handle = feed?.settings.instagramHandle;
    if (!feed || !handle) return 0;

    const page = await instagramProvider.getPosts(handle);
    const now = new Date().toISOString();
    let synced = 0;

    for (const post of page.data) {
      const media = post.media.find((item) => item.url);
      if (!media?.url) continue;

      const mediaType = post.type?.toLowerCase().includes("video")
        ? "VIDEO"
        : post.type?.toLowerCase().includes("carousel")
          ? "CAROUSEL_ALBUM"
          : "IMAGE";

      await this.db
        .insert(posts)
        .values({
          id: crypto.randomUUID().replace(/-/g, "").slice(0, 16),
          feedId,
          instagramMediaId: post.id,
          mediaType,
          mediaUrl: media.url,
          thumbnailUrl: media.thumbnailUrl,
          permalink: post.url,
          caption: post.caption,
          likeCount: null,
          timestamp: post.createdAt,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [posts.feedId, posts.instagramMediaId],
          set: {
            mediaType,
            mediaUrl: media.url,
            thumbnailUrl: media.thumbnailUrl,
            permalink: post.url,
            caption: post.caption,
            timestamp: post.createdAt,
            updatedAt: now,
          },
        });
      synced += 1;
    }

    await this.cache.delete(feedCacheKey(feedId));
    return synced;
  }
}
