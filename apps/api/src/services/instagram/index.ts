import type { InstagramProvider, InstagramAccount, InstagramMedia } from "@instagram-widget/types";

/**
 * Meta Instagram Graph API implementation.
 *
 * This is currently a skeleton — the actual Meta OAuth flow and
 * API calls require a registered Meta App with Instagram permissions.
 *
 * The implementation is isolated here so the rest of the codebase
 * programs against the InstagramProvider interface.
 */
export class MetaInstagramProvider implements InstagramProvider {
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly redirectUri: string;

  constructor(config: { appId: string; appSecret: string; redirectUri: string }) {
    this.appId = config.appId;
    this.appSecret = config.appSecret;
    this.redirectUri = config.redirectUri;
  }

  /**
   * Build the Meta OAuth authorization URL.
   *
   * Requires: Instagram Basic Display API or Instagram Graph API permissions.
   * Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
   */
  getAuthorizationUrl(state: string): string {
    if (!this.appId || !this.redirectUri) {
      throw new Error(
        "META_APP_ID or META_REDIRECT_URI is not set. Ensure apps/api/.dev.vars exists and restart the dev server."
      );
    }

    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      scope: "instagram_business_basic",
      response_type: "code",
      state,
    });

    return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange an authorization code for an access token.
   */
  async exchangeCode(code: string): Promise<InstagramAccount> {
    if (!this.appId || !this.appSecret || !this.redirectUri) {
      throw new Error("Missing Meta App credentials in environment variables.");
    }

    // 1. Exchange short-lived authorization code for short-lived access token
    const tokenForm = new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      grant_type: "authorization_code",
      redirect_uri: this.redirectUri,
      code,
    });

    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenForm.toString(),
    });

    const tokenData = (await tokenRes.json()) as any;

    if (!tokenRes.ok || tokenData.error_message || tokenData.error) {
      const err = tokenData.error_message || tokenData.error?.message || "Failed to exchange code";
      console.error("Instagram token exchange error:", tokenData);
      throw new Error(`Instagram token exchange failed: ${err}`);
    }

    const shortLivedToken = tokenData.access_token;
    const userId = String(tokenData.user_id);

    // 2. Exchange short-lived token for long-lived access token (60 days)
    let finalToken = shortLivedToken;
    let expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour default

    try {
      const longLivedUrl = new URL("https://graph.instagram.com/access_token");
      longLivedUrl.searchParams.set("grant_type", "ig_exchange_token");
      longLivedUrl.searchParams.set("client_secret", this.appSecret);
      longLivedUrl.searchParams.set("access_token", shortLivedToken);

      const longLivedRes = await fetch(longLivedUrl.toString());
      const longLivedData = (await longLivedRes.json()) as any;

      if (longLivedRes.ok && longLivedData.access_token) {
        finalToken = longLivedData.access_token;
        const expiresInSec = longLivedData.expires_in ?? 5184000; // 60 days
        expiresAt = new Date(Date.now() + expiresInSec * 1000);
      }
    } catch (err) {
      console.warn("Failed to get long-lived token, falling back to short-lived token:", err);
    }

    // 3. Get username and profile picture from /me
    let username = `instagram_user_${userId}`;
    let profilePictureUrl: string | null = null;
    try {
      const accountInfo = await this.getAccount(finalToken);
      if (accountInfo.username) {
        username = accountInfo.username;
      }
      if (accountInfo.profilePictureUrl) {
        profilePictureUrl = accountInfo.profilePictureUrl;
      }
    } catch (err) {
      console.warn("Failed to fetch username / profile picture:", err);
    }

    return {
      instagramUserId: userId,
      username,
      accessToken: finalToken,
      expiresAt,
      profilePictureUrl,
    };
  }

  /**
   * Refresh a long-lived access token.
   */
  async refreshToken(accessToken: string): Promise<{ accessToken: string; expiresAt: Date }> {
    const url = new URL("https://graph.instagram.com/refresh_access_token");
    url.searchParams.set("grant_type", "ig_refresh_token");
    url.searchParams.set("access_token", accessToken);

    const res = await fetch(url.toString());
    const data = (await res.json()) as any;

    if (!res.ok || data.error) {
      throw new Error(`Token refresh failed: ${data.error?.message || "Unknown error"}`);
    }

    const expiresInSec = data.expires_in ?? 5184000;
    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + expiresInSec * 1000),
    };
  }

  /**
   * Get the authenticated Instagram account info.
   */
  async getAccount(accessToken: string): Promise<{ instagramUserId: string; username: string; profilePictureUrl?: string | null }> {
    const url = new URL("https://graph.instagram.com/v21.0/me");
    url.searchParams.set("fields", "id,username,profile_picture_url");
    url.searchParams.set("access_token", accessToken);

    const res = await fetch(url.toString());
    const data = (await res.json()) as any;

    if (!res.ok || data.error) {
      throw new Error(`Failed to fetch account info: ${data.error?.message || "Unknown error"}`);
    }

    return {
      instagramUserId: String(data.id),
      username: data.username,
      profilePictureUrl: data.profile_picture_url || null,
    };
  }

  /**
   * Retrieve recent media for the authenticated Instagram account.
   */
  async getMedia(accessToken: string, limit = 25): Promise<InstagramMedia[]> {
    const url = new URL("https://graph.instagram.com/v21.0/me/media");
    url.searchParams.set("fields", "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("access_token", accessToken);

    const res = await fetch(url.toString());
    const data = (await res.json()) as any;

    if (!res.ok || data.error) {
      throw new Error(`Failed to fetch media: ${data.error?.message || "Unknown error"}`);
    }

    return (data.data || []).map((item: any) => ({
      id: String(item.id),
      mediaType: item.media_type,
      mediaUrl: item.media_url,
      thumbnailUrl: item.thumbnail_url ?? null,
      permalink: item.permalink,
      caption: item.caption ?? null,
      likeCount: typeof item.like_count === "number" ? item.like_count : null,
      timestamp: item.timestamp,
    }));
  }
}
