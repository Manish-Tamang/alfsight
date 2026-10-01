/**
 * Styles for the <instagram-feed> Web Component.
 * Injected into the Shadow DOM for complete CSS isolation.
 */
export const widgetStyles = `
  :host {
    display: block;
    width: 100%;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #111827;
    --ig-grid-columns: 4;
    --ig-grid-gap: 14px;
    --ig-border-radius: 6px;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .ig-feed-container {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
  }

  /* ── Header ── */
  .ig-feed-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    margin-bottom: 22px;
    padding: 0 4px;
  }

  .ig-header-avatar-link {
    display: block;
    position: relative;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    padding: 2px;
    background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
    text-decoration: none;
    flex-shrink: 0;
    transition: transform 0.2s ease;
  }

  .ig-header-avatar-link:hover {
    transform: scale(1.04);
  }

  .ig-header-avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #ffffff;
  }

  .ig-avatar-placeholder {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #f3f4f6;
    color: #4b5563;
    font-weight: 700;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #ffffff;
    text-transform: uppercase;
  }

  .ig-header-meta {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .ig-header-title {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
    line-height: 1.25;
    text-decoration: none;
    transition: color 0.15s ease;
  }

  .ig-header-title:hover {
    color: #2563eb;
  }

  .ig-header-handle {
    font-size: 13px;
    color: #6b7280;
    font-weight: 400;
    text-decoration: none;
    margin-top: 2px;
    line-height: 1.2;
    transition: color 0.15s ease;
  }

  .ig-header-handle:hover {
    color: #374151;
  }

  .ig-follow-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #0095f6;
    color: #ffffff;
    font-size: 13px;
    font-weight: 600;
    padding: 7px 16px;
    border-radius: 6px;
    text-decoration: none;
    line-height: 1;
    margin-left: 6px;
    cursor: pointer;
    transition: background-color 0.15s ease, transform 0.1s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    flex-shrink: 0;
  }

  .ig-follow-btn:hover {
    background: #1877f2;
  }

  .ig-follow-btn:active {
    transform: scale(0.97);
  }

  .ig-follow-btn svg {
    width: 14px;
    height: 14px;
    fill: currentColor;
    flex-shrink: 0;
  }

  /* ── Grid ── */
  .ig-feed-grid {
    display: grid;
    grid-template-columns: repeat(var(--ig-grid-columns), 1fr);
    gap: var(--ig-grid-gap);
    width: 100%;
  }

  .ig-feed-item {
    position: relative;
    overflow: hidden;
    border-radius: var(--ig-border-radius);
    aspect-ratio: 1;
    background-color: #f3f4f6;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }

  .ig-feed-item a {
    display: block;
    width: 100%;
    height: 100%;
    text-decoration: none;
    position: relative;
  }

  .ig-feed-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .ig-feed-item:hover img {
    transform: scale(1.05);
  }

  /* Media Badges in Top Right Corner */
  .ig-media-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.7));
    pointer-events: none;
    z-index: 2;
  }

  .ig-media-badge svg {
    width: 18px;
    height: 18px;
    fill: currentColor;
  }

  /* Hover Overlay */
  .ig-feed-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    opacity: 0;
    transition: opacity 0.25s ease;
    z-index: 3;
    pointer-events: none;
  }

  .ig-feed-item:hover .ig-feed-overlay {
    opacity: 1;
  }

  .ig-feed-overlay-text {
    color: #ffffff;
    font-size: 13px;
    line-height: 1.4;
    text-align: center;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    word-break: break-word;
    font-weight: 500;
  }

  /* ── State Views ── */
  .ig-feed-loading,
  .ig-feed-empty,
  .ig-feed-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    padding: 36px 20px;
    text-align: center;
    color: #6b7280;
    font-size: 14px;
    background: #fafafa;
    border-radius: 8px;
    border: 1px dashed #e5e7eb;
  }

  .ig-feed-error {
    color: #dc2626;
    background: #fef2f2;
    border-color: #fecaca;
  }

  .ig-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e5e7eb;
    border-top-color: #0095f6;
    border-radius: 50%;
    animation: ig-spin 0.8s linear infinite;
    margin-bottom: 12px;
  }

  @keyframes ig-spin {
    to { transform: rotate(360deg); }
  }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    :host {
      --ig-grid-columns: 2;
      --ig-grid-gap: 8px;
    }

    .ig-feed-header {
      gap: 12px;
    }

    .ig-header-avatar-link {
      width: 44px;
      height: 44px;
    }

    .ig-header-title {
      font-size: 15px;
    }

    .ig-follow-btn {
      padding: 6px 12px;
      font-size: 12px;
    }
  }

  @media (max-width: 480px) {
    :host {
      --ig-grid-columns: 2;
      --ig-grid-gap: 6px;
    }

    .ig-feed-header {
      flex-wrap: wrap;
      justify-content: center;
    }
  }
`;
