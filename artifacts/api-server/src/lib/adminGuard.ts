import type { Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import type { AuthedRequest } from "./subscriptionGuard";

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Returns true when the Clerk user owns an email address listed in the
 * ADMIN_EMAILS env var (comma-separated, case-insensitive). Returns false when
 * no allowlist is configured, so the dashboard fails closed.
 */
export async function isAdminUser(userId: string): Promise<boolean> {
  const allow = adminEmails();
  if (allow.length === 0) return false;
  const user = await clerkClient.users.getUser(userId);
  return user.emailAddresses.some((e) =>
    allow.includes(e.emailAddress.toLowerCase()),
  );
}

/**
 * Blocks the request unless the signed-in user is an admin (see isAdminUser).
 * 401 when not signed in, 403 when signed in but not on the allowlist.
 */
export async function requireAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    if (!(await isAdminUser(userId))) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  } catch (err) {
    req.log.error({ err }, "Admin check failed");
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  req.userId = userId;
  next();
}
