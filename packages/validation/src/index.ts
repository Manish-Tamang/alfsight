import { z } from "zod";

// ─── Media Type ────────────────────────────────────────────────

export const mediaTypeSchema = z.enum(["IMAGE", "VIDEO", "CAROUSEL_ALBUM"]);

// ─── Feed Settings ─────────────────────────────────────────────

export const feedSettingsSchema = z
  .object({
    columns: z.number().int().min(1).max(12).optional(),
    rows: z.number().int().min(1).max(20).optional(),
    gap: z.number().int().min(0).max(64).optional(),
    borderRadius: z.number().int().min(0).max(64).optional(),
    showCaption: z.boolean().optional(),
    hoverEffect: z.boolean().optional(),
    showHeader: z.boolean().optional(),
    headerName: z.string().optional(),
    headerUsername: z.string().optional(),
    headerAvatarUrl: z.string().optional(),
    followButtonText: z.string().optional(),
  })
  .strict();

// ─── Create Feed ───────────────────────────────────────────────

export const createFeedSchema = z.object({
  name: z.string().min(1).max(255),
  instagramAccountId: z.string().min(1).optional(),
  settings: feedSettingsSchema.optional().default({}),
});

export type CreateFeedInput = z.infer<typeof createFeedSchema>;

// ─── Update Feed ───────────────────────────────────────────────

export const updateFeedSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  instagramAccountId: z.string().min(1).optional(),
  settings: feedSettingsSchema.optional(),
});

export type UpdateFeedInput = z.infer<typeof updateFeedSchema>;

// ─── Feed Post (API response) ──────────────────────────────────

export const feedPostSchema = z.object({
  id: z.string(),
  type: mediaTypeSchema,
  imageUrl: z.string().url(),
  thumbnailUrl: z.string().url().nullable(),
  permalink: z.string().url(),
  caption: z.string().nullable(),
  timestamp: z.string(),
});

// ─── Feed Profile (API response) ───────────────────────────────

export const feedProfileSchema = z.object({
  name: z.string().optional(),
  username: z.string().optional(),
  avatarUrl: z.string().optional(),
  followUrl: z.string().optional(),
}).optional();

// ─── Feed Response (API response) ──────────────────────────────

export const feedResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  settings: feedSettingsSchema,
  profile: feedProfileSchema,
  posts: z.array(feedPostSchema),
});

// ─── Instagram Connect ─────────────────────────────────────────

export const instagramConnectSchema = z.object({
  redirectUrl: z.string().url().optional(),
});

// ─── Pagination ────────────────────────────────────────────────

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
