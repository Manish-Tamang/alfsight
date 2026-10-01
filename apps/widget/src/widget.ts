import type { FeedResponse, FeedPost, FeedSettings, FeedProfile } from "@instagram-widget/types";
import { fetchFeed } from "./api";
import { widgetStyles } from "./styles";

/**
 * <instagram-feed> Web Component
 *
 * Usage:
 *   <instagram-feed feed="abc123" api-base="https://localhost:8787"></instagram-feed>
 */
class InstagramFeedWidget extends HTMLElement {
  private shadow: ShadowRoot;
  private feedId: string | null = null;
  private apiBase: string | undefined;

  static get observedAttributes(): string[] {
    return ["feed", "api-base"];
  }

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  connectedCallback(): void {
    this.feedId = this.getAttribute("feed");
    this.apiBase = this.getAttribute("api-base") ?? undefined;
    this.render();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;

    if (name === "feed") {
      this.feedId = newValue;
      this.render();
    } else if (name === "api-base") {
      this.apiBase = newValue ?? undefined;
      this.render();
    }
  }

  private async render(): Promise<void> {
    if (!this.feedId) {
      this.renderError("No feed ID provided. Add a feed=\"...\" attribute.");
      return;
    }

    this.renderLoading();

    try {
      const data = await fetchFeed(this.feedId, this.apiBase);
      this.renderFeed(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load feed";
      this.renderError(message);
    }
  }

  // ─── Render States ───

  private renderLoading(): void {
    this.shadow.innerHTML = `
      <style>${widgetStyles}</style>
      <div class="ig-feed-loading" aria-label="Loading Instagram feed">
        <div class="ig-spinner"></div>
        <p>Loading feed...</p>
      </div>
    `;
  }

  private renderError(message: string): void {
    this.shadow.innerHTML = `
      <style>${widgetStyles}</style>
      <div class="ig-feed-error" role="alert">
        <p>${this.escapeHtml(message)}</p>
      </div>
    `;
  }

  private renderEmpty(profileHtml: string): void {
    this.shadow.innerHTML = `
      <style>${widgetStyles}</style>
      <div class="ig-feed-container">
        ${profileHtml}
        <div class="ig-feed-empty">
          <p>No posts to display yet.</p>
        </div>
      </div>
    `;
  }

  private renderFeed(data: FeedResponse): void {
    const settings = data.settings ?? {};
    const profile = data.profile;
    const showHeader = settings.showHeader !== false && !!profile;

    const profileHtml = showHeader ? this.renderHeader(profile, settings) : "";

    if (!data.posts || data.posts.length === 0) {
      this.renderEmpty(profileHtml);
      return;
    }

    const cssVars = this.buildCssVars(settings);
    const posts = [...data.posts]
      .sort((a, b) => {
        const difference = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        return settings.order === "oldest" ? difference : -difference;
      })
      .slice(0, settings.postCount ?? ((settings.columns ?? 4) * (settings.rows ?? 2)));
    const postsHtml = posts
      .map((post) => this.renderPost(post, settings))
      .join("");

    this.shadow.innerHTML = `
      <style>${widgetStyles}</style>
      <div class="ig-feed-container">
        ${profileHtml}
        <div class="ig-feed-grid" style="${cssVars}" role="feed" aria-label="${this.escapeHtml(data.name)}">
          ${postsHtml}
        </div>
      </div>
    `;
  }

  private renderHeader(profile: FeedProfile, settings: FeedSettings): string {
    const name = profile.name || profile.username || "Instagram";
    const username = profile.username || "instagram";
    const followUrl = profile.followUrl || `https://www.instagram.com/${encodeURIComponent(username)}/`;
    const followBtnText = settings.followButtonText || "Follow";

    // Avatar image with unavatar fallback
    const effectiveAvatar = profile.avatarUrl || (username ? `https://unavatar.io/instagram/${encodeURIComponent(username)}` : "");
    const avatarHtml = effectiveAvatar
      ? `<img src="${this.escapeHtml(effectiveAvatar)}" alt="${this.escapeHtml(name)}" class="ig-header-avatar" onerror="if(this.dataset.fallback!=='1'){this.dataset.fallback='1';this.src='https://unavatar.io/instagram/${encodeURIComponent(username)}';}" />`
      : `<div class="ig-avatar-placeholder">${this.escapeHtml(name.charAt(0).toUpperCase())}</div>`;

    // Official Instagram Camera Glyph Icon
    const instagramIcon = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    `;

    return `
      <div class="ig-feed-header">
        <a href="${this.escapeHtml(followUrl)}" target="_blank" rel="noopener noreferrer" class="ig-header-avatar-link">
          ${avatarHtml}
        </a>
        <div class="ig-header-meta">
          <a href="${this.escapeHtml(followUrl)}" target="_blank" rel="noopener noreferrer" class="ig-header-title">
            ${this.escapeHtml(name)}
          </a>
          <a href="${this.escapeHtml(followUrl)}" target="_blank" rel="noopener noreferrer" class="ig-header-handle">
            @${this.escapeHtml(username)}
          </a>
        </div>
        <a href="${this.escapeHtml(followUrl)}" target="_blank" rel="noopener noreferrer" class="ig-follow-btn">
          ${instagramIcon}
          <span>${this.escapeHtml(followBtnText)}</span>
        </a>
      </div>
    `;
  }

  private renderPost(post: FeedPost, settings: FeedSettings): string {
    const imgSrc = post.thumbnailUrl ?? post.imageUrl;
    const showCaption = settings.showCaption !== false;

    const captionOverlay =
      showCaption && post.caption
        ? `<div class="ig-feed-overlay"><p class="ig-feed-overlay-text">${this.escapeHtml(post.caption)}</p></div>`
        : "";
    const likesOverlay =
      post.likeCount !== null && post.likeCount !== undefined
        ? `<div class="ig-feed-likes" aria-label="${post.likeCount} likes"><span class="ig-feed-heart">♡</span><span>${post.likeCount.toLocaleString()}</span></div>`
        : "";

    // Badges in top-right corner matching Instagram
    let typeBadge = "";
    if (post.type === "VIDEO") {
      // Video Camera Icon
      typeBadge = `
        <div class="ig-media-badge" aria-label="Video">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/>
          </svg>
        </div>
      `;
    } else if (post.type === "CAROUSEL_ALBUM") {
      // Stacked Sheets / Album Icon
      typeBadge = `
        <div class="ig-media-badge" aria-label="Multiple photos">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 6h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm16-4a2 2 0 0 1 2 2v12h-2V4H6V2h14z"/>
          </svg>
        </div>
      `;
    }

    const hoverStyle = settings.hoverStyle ?? (settings.hoverEffect === false ? "none" : "zoom");
    const cardStyle = settings.cardStyle ?? "clean";

    return `
      <div class="ig-feed-item ig-card-${cardStyle} ig-hover-${hoverStyle}">
        <a href="${this.escapeHtml(post.permalink)}" target="_blank" rel="noopener noreferrer">
          <img
            src="${this.escapeHtml(imgSrc)}"
            alt="${post.caption ? this.escapeHtml(post.caption.slice(0, 100)) : "Instagram post"}"
            loading="lazy"
          />
          ${typeBadge}
          ${likesOverlay}
          ${captionOverlay}
        </a>
      </div>
    `;
  }

  // ─── Helpers ───

  private buildCssVars(settings: FeedSettings): string {
    const vars: string[] = [];
    if (settings.columns) vars.push(`--ig-grid-columns: ${settings.columns}`);
    if (settings.gap !== undefined) vars.push(`--ig-grid-gap: ${settings.gap}px`);
    if (settings.borderRadius !== undefined) vars.push(`--ig-border-radius: ${settings.borderRadius}px`);
    return vars.join("; ");
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Register the custom element
if (!customElements.get("instagram-feed")) {
  customElements.define("instagram-feed", InstagramFeedWidget);
}
