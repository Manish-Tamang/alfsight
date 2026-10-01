import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { Env, AppVariables } from "./types";
import { servicesMiddleware, authMiddleware } from "./middleware";
import { health } from "./routes/health";
import { feedsRouter } from "./routes/feeds";
import { instagramRouter } from "./routes/instagram";

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// ─── Global Middleware ─────────────────────────────────────────

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*", // TODO: restrict to dashboard and widget origins in production
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Dev-User-Id"],
  })
);
app.use("*", servicesMiddleware);
app.use("*", authMiddleware);

// ─── Routes ────────────────────────────────────────────────────

app.route("/api/health", health);
app.route("/api/feeds", feedsRouter);
app.route("/api/instagram", instagramRouter);

// ─── 404 fallback ──────────────────────────────────────────────

app.notFound((c) => {
  return c.json(
    { error: { code: "NOT_FOUND", message: "Route not found" } },
    404
  );
});

// ─── Global error handler ──────────────────────────────────────

app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message:
          c.env.ENVIRONMENT === "development"
            ? err.message
            : "An unexpected error occurred",
      },
    },
    500
  );
});

// ─── Export ────────────────────────────────────────────────────

export default {
  fetch: app.fetch,

  /**
   * Cloudflare Cron Trigger handler.
   *
   * Runs on the schedule defined in wrangler.jsonc (default: every 6 hours).
   * Eventually this will:
   *   1. Query D1 for feeds that need refreshing
   *   2. Fetch new media from the Instagram API
   *   3. Update D1 with new/changed posts
   *   4. Refresh KV cache for each feed
   */
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log(`[Cron] Scheduled event fired at ${new Date(controller.scheduledTime).toISOString()}`);

    ctx.waitUntil(
      (async () => {
        try {
          // TODO: Implement feed refresh logic
          // 1. const db = drizzle(env.DB);
          // 2. Query feeds with connected Instagram accounts
          // 3. For each feed, call Instagram API to get latest media
          // 4. Upsert posts in D1
          // 5. Update KV cache

          console.log("[Cron] Feed refresh completed (no-op — Instagram integration pending)");
        } catch (error) {
          console.error("[Cron] Feed refresh failed:", error);
        }
      })()
    );
  },
} satisfies ExportedHandler<Env>;
