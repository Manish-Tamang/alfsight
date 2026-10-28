/** Deployed dashboard URL. Set PUBLIC_DASHBOARD_URL in apps/web/.env.production. */
export const DASHBOARD_URL =
  import.meta.env.PUBLIC_DASHBOARD_URL ||
  (import.meta.env.DEV ? "http://localhost:5173" : "https://alfsight-dashboard.pages.dev");

/** Live widget shown on the homepage. */
export const DEMO_FEED_ID = import.meta.env.PUBLIC_DEMO_FEED_ID || "12dce34501db4d9a";
export const API_BASE = import.meta.env.PUBLIC_API_BASE || "https://api.manishtamang.com";
export const WIDGET_URL = import.meta.env.PUBLIC_WIDGET_URL || "https://alfsight-widget.manishtamang.com";
