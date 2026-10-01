import type { ErrorCode, ApiError } from "@instagram-widget/types";
import { type Context } from "hono";

/**
 * Build a consistent API error response.
 */
export function apiError(
  c: Context,
  status: number,
  code: ErrorCode,
  message: string,
  details?: unknown
): Response {
  const body: ApiError = {
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
  return c.json(body, status as 400);
}

/**
 * Generate a URL-safe random ID.
 */
export function generateId(length = 16): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, length);
}
