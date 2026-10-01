import { Hono } from "hono";
import type { Env, AppVariables } from "../types";

const health = new Hono<{ Bindings: Env; Variables: AppVariables }>();

health.get("/", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT ?? "unknown",
  });
});

export { health };
