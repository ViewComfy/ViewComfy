/**
 * Shared-secret auth for self-hosted ViewComfy deployments where
 * Clerk is NOT enabled (NEXT_PUBLIC_USER_MANAGEMENT !== "true").
 *
 * The .env example ships with user management OFF and provides no
 * auth at all on the POST endpoints — anyone reaching the host can
 * burn GPU. This helper lets operators set VIEWCOMFY_API_TOKEN (a
 * shared secret, rotated by the operator) and require it on every
 * mutation endpoint.
 *
 * Usage:
 *   // In a route handler:
 *   const authError = requireApiToken(request);
 *   if (authError) return authError;
 *
 * The token can be supplied via:
 *   - Authorization: Bearer <token>
 *   - X-ViewComfy-Token: <token>
 *
 * When Clerk user management IS enabled, the existing route-level
 * Clerk auth runs first; this helper is a no-op.
 */

import { type NextRequest, NextResponse } from "next/server";
import { SettingsService } from "@/app/services/settings-service";
import { timingSafeEqual } from "node:crypto";

const settingsService = new SettingsService();

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

export function requireApiToken(request: NextRequest): NextResponse | null {
  // If Clerk user management is on, route handlers check auth() themselves.
  // This helper only gates the self-hosted (no-Clerk) path.
  if (settingsService.isUserManagementEnabled()) {
    return null;
  }

  const expected = process.env.VIEWCOMFY_API_TOKEN;
  if (!expected || expected.length < 16) {
    // Operator has not configured the token (or it's too short to be safe).
    // Reject all requests with a clear configuration error.
    return NextResponse.json(
      {
        error:
          "Server is not configured for unauthenticated access. " +
          "Either set NEXT_PUBLIC_USER_MANAGEMENT=true and configure Clerk, " +
          "or set VIEWCOMFY_API_TOKEN to a 16+ character shared secret.",
      },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization") || "";
  const headerToken = request.headers.get("x-viewcomfy-token") || "";

  let supplied = "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    supplied = auth.slice(7).trim();
  } else if (headerToken) {
    supplied = headerToken.trim();
  }

  if (!supplied || !safeEqual(supplied, expected)) {
    return NextResponse.json(
      { error: "Unauthorized: missing or invalid API token" },
      { status: 401 },
    );
  }

  return null;
}
