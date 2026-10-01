// ─── Media Types ───────────────────────────────────────────────

export type MediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";

// ─── API Response: Feed Post ───────────────────────────────────

export interface FeedPost {
  id: string;
  type: MediaType;
  imageUrl: string;
  thumbnailUrl: string | null;
  permalink: string;
  caption: string | null;
  timestamp: string;
}

// ─── API Response: Feed ────────────────────────────────────────

export interface FeedSettings {
  columns?: number;
  rows?: number;
  gap?: number;
  borderRadius?: number;
  showCaption?: boolean;
  hoverEffect?: boolean;
  showHeader?: boolean;
  headerName?: string;
  headerUsername?: string;
  headerAvatarUrl?: string;
  followButtonText?: string;
}

export interface FeedProfile {
  name: string;
  username: string;
  avatarUrl: string;
  followUrl: string;
}

export interface FeedResponse {
  id: string;
  name: string;
  settings: FeedSettings;
  profile?: FeedProfile;
  posts: FeedPost[];
}

// ─── API Response: Feed (without posts) ────────────────────────

export interface FeedMeta {
  id: string;
  name: string;
  instagramAccountId: string | null;
  settings: FeedSettings;
  createdAt: string;
  updatedAt: string;
}

// ─── API Error ─────────────────────────────────────────────────

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "FEED_NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INTERNAL_ERROR"
  | "INSTAGRAM_API_ERROR"
  | "RATE_LIMITED";

export interface ApiError {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

// ─── Instagram Provider Interface ──────────────────────────────

export interface InstagramAccount {
  instagramUserId: string;
  username: string;
  accessToken: string;
  expiresAt: Date;
  profilePictureUrl?: string | null;
}

export interface InstagramMedia {
  id: string;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl: string | null;
  permalink: string;
  caption: string | null;
  timestamp: string;
}

export interface InstagramProvider {
  getAuthorizationUrl(state: string): string;
  exchangeCode(code: string): Promise<InstagramAccount>;
  refreshToken(accessToken: string): Promise<{ accessToken: string; expiresAt: Date }>;
  getAccount(accessToken: string): Promise<{ instagramUserId: string; username: string; profilePictureUrl?: string | null }>;
  getMedia(accessToken: string, limit?: number): Promise<InstagramMedia[]>;
}

// ─── Auth Interface ────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthProvider<TRequest = unknown> {
  verifyRequest(request: TRequest): Promise<AuthUser | null>;
}

// ─── Cache Interface ───────────────────────────────────────────

export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
}
