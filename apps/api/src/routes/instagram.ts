import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { users, instagramAccounts } from "@instagram-widget/database";
import type { Env, AppVariables } from "../types";
import { requireAuth } from "../middleware";
import { apiError } from "../lib/utils";

const instagramRouter = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// ─── GET /instagram/accounts ────────────────────────────────
// List connected Instagram accounts for the current user
instagramRouter.get("/accounts", requireAuth, async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.get("userId")!;

  const accounts = await db
    .select({
      id: instagramAccounts.id,
      instagramUserId: instagramAccounts.instagramUserId,
      username: instagramAccounts.username,
      accessToken: instagramAccounts.accessToken,
      profilePictureUrl: instagramAccounts.profilePictureUrl,
      expiresAt: instagramAccounts.expiresAt,
      createdAt: instagramAccounts.createdAt,
    })
    .from(instagramAccounts)
    .where(eq(instagramAccounts.userId, userId));

  // If any account has missing profilePictureUrl, attempt to fetch and save in background
  const instagram = c.get("instagram");
  const enrichedAccounts = await Promise.all(
    accounts.map(async (acc) => {
      let profilePictureUrl = acc.profilePictureUrl;
      if (!profilePictureUrl && acc.accessToken) {
        try {
          const info = await instagram.getAccount(acc.accessToken);
          if (info.profilePictureUrl) {
            profilePictureUrl = info.profilePictureUrl;
            await db
              .update(instagramAccounts)
              .set({ profilePictureUrl, updatedAt: new Date().toISOString() })
              .where(eq(instagramAccounts.id, acc.id));
          }
        } catch {
          // Token might be expired or limited
        }
      }
      return {
        id: acc.id,
        instagramUserId: acc.instagramUserId,
        username: acc.username,
        profilePictureUrl,
        expiresAt: acc.expiresAt,
        createdAt: acc.createdAt,
      };
    })
  );

  return c.json(enrichedAccounts);
});

// ─── DELETE /instagram/accounts/:id ──────────────────────────
// Disconnect an Instagram account
instagramRouter.delete("/accounts/:id", requireAuth, async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.get("userId")!;
  const accountId = c.req.param("id");

  await db
    .delete(instagramAccounts)
    .where(and(eq(instagramAccounts.id, accountId), eq(instagramAccounts.userId, userId)));

  return c.json({ success: true });
});

// ─── POST /instagram/connect ────────────────────────────────
// Initiates the Instagram OAuth flow by returning an authorization URL
instagramRouter.post("/connect", requireAuth, async (c) => {
  const instagram = c.get("instagram");

  try {
    const state = crypto.randomUUID();
    const authUrl = instagram.getAuthorizationUrl(state);
    return c.json({ authorizationUrl: authUrl, state });
  } catch (err) {
    console.error("Instagram connect error:", err);
    return apiError(c, 500, "INSTAGRAM_API_ERROR", "Failed to generate authorization URL");
  }
});

// ─── GET /instagram/callback ────────────────────────────────
// Handles the OAuth callback from Instagram
instagramRouter.get("/callback", async (c) => {
  const code = c.req.query("code");
  const errorParam = c.req.query("error");

  if (errorParam) {
    const errorDescription = c.req.query("error_description") ?? "Unknown error";
    console.error("Instagram OAuth error param:", errorParam, errorDescription);
    return c.redirect(
      `http://localhost:5173/instagram?error=${encodeURIComponent(`Instagram authorization failed: ${errorDescription}`)}`
    );
  }

  if (!code) {
    return c.redirect(
      `http://localhost:5173/instagram?error=${encodeURIComponent("Missing authorization code from Instagram.")}`
    );
  }

  const instagram = c.get("instagram");
  const db = drizzle(c.env.DB);
  const userId = "dev-user-1"; // Dev user context

  try {
    // 1. Ensure user exists
    await db
      .insert(users)
      .values({
        id: userId,
        email: "dev@alfsight.local",
      })
      .onConflictDoNothing();

    // 2. Exchange code for access token and profile info
    const account = await instagram.exchangeCode(code);

    // 3. Upsert into instagram_accounts
    const existing = await db
      .select()
      .from(instagramAccounts)
      .where(eq(instagramAccounts.instagramUserId, account.instagramUserId))
      .get();

    if (existing) {
      await db
        .update(instagramAccounts)
        .set({
          accessToken: account.accessToken,
          expiresAt: account.expiresAt.toISOString(),
          username: account.username,
          profilePictureUrl: account.profilePictureUrl ?? existing.profilePictureUrl,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(instagramAccounts.id, existing.id));
    } else {
      await db.insert(instagramAccounts).values({
        id: crypto.randomUUID().replace(/-/g, "").slice(0, 16),
        userId,
        instagramUserId: account.instagramUserId,
        username: account.username,
        accessToken: account.accessToken,
        expiresAt: account.expiresAt.toISOString(),
        profilePictureUrl: account.profilePictureUrl,
      });
    }

    // 4. Redirect to dashboard with success message
    return c.redirect("http://localhost:5173/instagram?connected=true");
  } catch (err: any) {
    console.error("Failed to complete Instagram OAuth callback:", err);
    return c.redirect(
      `http://localhost:5173/instagram?error=${encodeURIComponent(err.message || "Failed to exchange Instagram code")}`
    );
  }
});

export { instagramRouter };
