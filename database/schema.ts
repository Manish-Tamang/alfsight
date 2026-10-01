import { sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ─── Users ─────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Instagram Accounts ───────────────────────────────────────

export const instagramAccounts = sqliteTable(
  "instagram_accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    instagramUserId: text("instagram_user_id").notNull(),
    username: text("username").notNull(),
    accessToken: text("access_token").notNull(),
    expiresAt: text("expires_at").notNull(),
    profilePictureUrl: text("profile_picture_url"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    instagramUserIdUnique: uniqueIndex("ig_accounts_instagram_user_id_unique").on(table.instagramUserId),
    userIdIdx: index("ig_accounts_user_id_idx").on(table.userId),
  })
);

// ─── Feeds ─────────────────────────────────────────────────────

export const feeds = sqliteTable(
  "feeds",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    instagramAccountId: text("instagram_account_id").references(
      () => instagramAccounts.id,
      { onDelete: "set null" }
    ),
    name: text("name").notNull(),
    /** JSON-serialized FeedSettings */
    settings: text("settings").notNull().default("{}"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    userIdIdx: index("feeds_user_id_idx").on(table.userId),
    instagramAccountIdIdx: index("feeds_instagram_account_id_idx").on(table.instagramAccountId),
  })
);

// ─── Posts ──────────────────────────────────────────────────────

export const posts = sqliteTable(
  "posts",
  {
    id: text("id").primaryKey(),
    feedId: text("feed_id")
      .notNull()
      .references(() => feeds.id, { onDelete: "cascade" }),
    instagramMediaId: text("instagram_media_id").notNull(),
    mediaType: text("media_type").notNull(), // IMAGE | VIDEO | CAROUSEL_ALBUM
    mediaUrl: text("media_url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    permalink: text("permalink").notNull(),
    caption: text("caption"),
    timestamp: text("timestamp").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    feedIdIdx: index("posts_feed_id_idx").on(table.feedId),
    feedMediaUnique: uniqueIndex("posts_feed_media_unique").on(table.feedId, table.instagramMediaId),
  })
);
