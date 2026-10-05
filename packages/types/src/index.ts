// ─── Media Types ───────────────────────────────────────────────

export type MediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";

export type FeedOrder = "newest" | "oldest";
export type FeedLayout = "showcase" | "grid" | "masonry";
export type FeedCardStyle = "clean" | "rounded" | "elevated";
export type FeedHoverStyle = "zoom" | "overlay" | "lift" | "none";

// ─── API Response: Feed Post ───────────────────────────────────

export interface FeedPost {
  id: string;
  type: MediaType;
  imageUrl: string;
  thumbnailUrl: string | null;
  permalink: string;
  caption: string | null;
  likeCount: number | null;
  timestamp: string;
}

// ─── API Response: Feed ────────────────────────────────────────

export interface FeedSettings {
  instagramHandle?: string;
  columns?: number;
  rows?: number;
  layout?: FeedLayout;
  postCount?: number;
  order?: FeedOrder;
  gap?: number;
  borderRadius?: number;
  cardStyle?: FeedCardStyle;
  showCaption?: boolean;
  hoverEffect?: boolean;
  hoverStyle?: FeedHoverStyle;
  showHeader?: boolean;
  headerName?: string;
  headerUsername?: string;
  headerAvatarUrl?: string;
  headerPostCount?: number;
  headerFollowers?: number;
  headerFollowing?: number;
  followButtonText?: string;
}

export interface FeedProfile {
  name: string;
  username: string;
  avatarUrl: string;
  followUrl: string;
  posts?: number | null;
  followers?: number | null;
  following?: number | null;
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
  likeCount: number | null;
  timestamp: string;
}

export interface InstagramProvider {
  getAuthorizationUrl(state: string): string;
  exchangeCode(code: string): Promise<InstagramAccount>;
  refreshToken(accessToken: string): Promise<{ accessToken: string; expiresAt: Date }>;
  getAccount(accessToken: string): Promise<{ instagramUserId: string; username: string; profilePictureUrl?: string | null }>;
  getMedia(accessToken: string, limit?: number): Promise<InstagramMedia[]>;
}

export interface InstagramPublicProfile {
  id: string;
  username: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  url: string;
  isPrivate: boolean | null;
  isVerified: boolean | null;
  followers: number | null;
  following: number | null;
  posts: number | null;
}

export interface InstagramAudienceMember {
  id: string;
  username: string | null;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  url: string | null;
  isVerified: boolean | null;
}

export interface InstagramPublicPost {
  id: string;
  type: string | null;
  createdAt: string;
  url: string;
  caption: string | null;
  media: Array<{ id: string | null; type: string | null; url: string | null; thumbnailUrl: string | null }>;
}

export interface InstagramPublicStory {
  id: string;
  type: string | null;
  createdAt: string;
  expiresAt: string | null;
  url: string;
  media: Array<{ id: string | null; type: string | null; url: string | null; thumbnailUrl: string | null }>;
}

export interface InstagramPublicHighlight {
  id: string;
  title: string | null;
  coverUrl: string | null;
  url: string;
  expiresAt: string | null;
  stories: Array<{ id: string | null; title: string | null }>;
}

export interface InstagramPage<T> {
  data: T[];
  nextCursor: string | null;
}

export interface PublicInstagramProvider {
  getProfile(identifier: string): Promise<InstagramPublicProfile>;
  getPosts(identifier: string, cursor?: string): Promise<InstagramPage<InstagramPublicPost>>;
  getReels(identifier: string, cursor?: string): Promise<InstagramPage<InstagramPublicPost>>;
  getStories(identifier: string, cursor?: string): Promise<InstagramPage<InstagramPublicStory>>;
  getHighlights(identifier: string, cursor?: string): Promise<InstagramPage<InstagramPublicHighlight>>;
  getFollowers(identifier: string, cursor?: string): Promise<InstagramPage<InstagramAudienceMember>>;
  getFollowing(identifier: string, cursor?: string): Promise<InstagramPage<InstagramAudienceMember>>;
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
