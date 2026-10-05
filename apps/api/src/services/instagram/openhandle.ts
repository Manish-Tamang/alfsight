import { OpenHandle, OpenHandleError, type InstagramProfile, type InstagramProfileReference, type InstagramPost, type InstagramStory, type InstagramHighlight } from "@openhandle/sdk";
import type {
  InstagramAudienceMember,
  InstagramPage,
  InstagramPublicHighlight,
  InstagramPublicPost,
  InstagramPublicProfile,
  InstagramPublicStory,
  PublicInstagramProvider,
} from "@instagram-widget/types";

const freshness = "24h" as const;
const storiesFreshness = "live" as const;

export function normalizeInstagramIdentifier(value: string): string {
  const identifier = decodeURIComponent(value).trim();
  if (!identifier) throw new OpenHandleError({ code: "INVALID_IDENTIFIER", message: "Instagram identifier is required.", status: 400 });

  if (identifier.startsWith("http://") || identifier.startsWith("https://")) {
    const url = new URL(identifier);
    if (url.hostname !== "instagram.com" && !url.hostname.endsWith(".instagram.com")) {
      throw new OpenHandleError({ code: "INVALID_URL", message: "Unsupported Instagram URL.", status: 400 });
    }
    const handle = url.pathname.split("/").filter(Boolean)[0];
    if (!handle) throw new OpenHandleError({ code: "INVALID_IDENTIFIER", message: "Instagram username is required.", status: 400 });
    return `@${handle.replace(/^@/, "")}`;
  }

  return identifier.startsWith("@")
    ? identifier
    : `@${identifier}`;
}

function imageUrl(image: { url: string | null } | null | undefined): string | null {
  return image?.url ?? null;
}

function mapProfile(profile: InstagramProfile): InstagramPublicProfile {
  return {
    id: profile.id,
    username: profile.handle,
    name: profile.displayName,
    bio: profile.bio,
    avatarUrl: imageUrl(profile.avatar),
    url: profile.url,
    isPrivate: profile.isPrivate,
    isVerified: profile.isVerified,
    followers: profile.metrics.followers,
    following: profile.metrics.following,
    posts: profile.metrics.posts,
  };
}

function mapReference(reference: InstagramProfileReference): InstagramAudienceMember {
  return {
    id: reference.id ?? reference.handle ?? "unknown",
    username: reference.handle,
    name: reference.displayName,
    bio: reference.bio,
    avatarUrl: imageUrl(reference.avatar),
    url: reference.url,
    isVerified: reference.isVerified,
  };
}

function mapMedia(media: { id: string | null; type: string | null; url: string | null; thumbnail: { url: string | null } | null }) {
  return { id: media.id, type: media.type, url: media.url, thumbnailUrl: imageUrl(media.thumbnail) };
}

function mapPost(post: InstagramPost): InstagramPublicPost {
  return { id: post.id, type: post.type, createdAt: post.createdAt, url: post.url, caption: post.caption?.translation.text ?? null, media: post.media.map(mapMedia) };
}

function mapStory(story: InstagramStory): InstagramPublicStory {
  return { id: story.id, type: story.type, createdAt: story.createdAt, expiresAt: story.expiresAt, url: story.url, media: story.media.map(mapMedia) };
}

function mapHighlight(highlight: InstagramHighlight): InstagramPublicHighlight {
  return { id: highlight.id, title: highlight.title, coverUrl: imageUrl(highlight.cover), url: highlight.url, expiresAt: highlight.updatedAt, stories: (highlight.stories ?? []).map((story) => ({ id: story.id, title: story.title })) };
}

function page<T extends { id: string }>(response: { data: T[]; nextCursor: string | null }): InstagramPage<T> {
  return { data: response.data, nextCursor: response.nextCursor };
}

export class OpenHandleInstagramProvider implements PublicInstagramProvider {
  private readonly client: OpenHandle | null;

  constructor(apiKey: string) {
    this.client = apiKey
      ? new OpenHandle({ apiKey, fetch: globalThis.fetch.bind(globalThis) })
      : null;
  }

  private getClient(): OpenHandle {
    if (!this.client) {
      throw new OpenHandleError({ code: "UNAUTHENTICATED", message: "OpenHandle is not configured.", status: 401 });
    }
    return this.client;
  }

  async getProfile(identifier: string): Promise<InstagramPublicProfile> {
    const response = await this.getClient().instagram.profile(identifier).get({ freshness });
    return mapProfile(response.data);
  }

  async getPosts(identifier: string, cursor?: string): Promise<InstagramPage<InstagramPublicPost>> {
    const response = await this.getClient().instagram.profile(identifier).posts.list({ freshness, cursor });
    return page({ data: response.data.map(mapPost), nextCursor: response.nextCursor });
  }

  async getReels(identifier: string, cursor?: string): Promise<InstagramPage<InstagramPublicPost>> {
    const response = await this.getClient().instagram.profile(identifier).reels.list({ freshness, cursor });
    return page({ data: response.data.map(mapPost), nextCursor: response.nextCursor });
  }

  async getStories(identifier: string, cursor?: string): Promise<InstagramPage<InstagramPublicStory>> {
    const response = await this.getClient().instagram.profile(identifier).stories.list({ freshness: storiesFreshness, cursor });
    return page({ data: response.data.map(mapStory).filter((story) => !story.expiresAt || new Date(story.expiresAt).getTime() > Date.now()), nextCursor: response.nextCursor });
  }

  async getHighlights(identifier: string, cursor?: string): Promise<InstagramPage<InstagramPublicHighlight>> {
    const response = await this.getClient().instagram.profile(identifier).highlights.list({ freshness, cursor });
    return page({ data: response.data.map(mapHighlight), nextCursor: response.nextCursor });
  }

  async getFollowers(identifier: string, cursor?: string): Promise<InstagramPage<InstagramAudienceMember>> {
    const response = await this.getClient().instagram.profile(identifier).followers.list({ freshness, cursor });
    return page({ data: response.data.map(mapReference), nextCursor: response.nextCursor });
  }

  async getFollowing(identifier: string, cursor?: string): Promise<InstagramPage<InstagramAudienceMember>> {
    const response = await this.getClient().instagram.profile(identifier).following.list({ freshness, cursor });
    return page({ data: response.data.map(mapReference), nextCursor: response.nextCursor });
  }
}