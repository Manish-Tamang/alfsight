/** Deployed dashboard URL. Set PUBLIC_DASHBOARD_URL in apps/web/.env.production. */
export const DASHBOARD_URL =
  import.meta.env.PUBLIC_DASHBOARD_URL ||
  (import.meta.env.DEV ? "http://localhost:5173" : "https://alfsight-dashboard.pages.dev");
