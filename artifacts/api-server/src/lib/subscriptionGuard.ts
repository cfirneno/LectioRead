import type { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, userSubscriptionsTable } from "@workspace/db";
import { reconcileFromStripe } from "./subscriptionSync";

export interface AuthedRequest extends Request {
  userId?: string;
}

function isActive(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

export async function getEffectiveSubscriptionStatus(userId: string): Promise<{
  status: string | null;
  active: boolean;
}> {
  const [sub] = await db.select().from(userSubscriptionsTable).where(eq(userSubscriptionsTable.userId, userId));
  if (!sub) return { status: null, active: false };
  if (isActive(sub.status)) return { status: sub.status, active: true };
  // If we have a customer but no active local status, ask Stripe directly.
  if (sub.stripeCustomerId) {
    const reconciled = await reconcileFromStripe(userId);
    return reconciled;
  }
  return { status: sub.status, active: false };
}

export async function requireSubscribedUser(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;

  const { active, status } = await getEffectiveSubscriptionStatus(userId);
  if (!active) {
    res.status(402).json({ error: "Subscription required", status });
    return;
  }
  next();
}

/**
 * Number of opening paragraphs of every text that are readable for free,
 * with no sign-in and no subscription. Anything at or beyond this index
 * requires an active subscription.
 */
export const FREE_PREVIEW_PARAGRAPHS = 3;

/**
 * Attaches req.userId when a Clerk session is present, but never blocks the
 * request. Use on endpoints that serve free-preview content to anonymous
 * visitors while still personalising for signed-in users.
 */
export function attachOptionalUser(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction
): void {
  const auth = getAuth(req);
  if (auth?.userId) req.userId = auth.userId;
  next();
}

/**
 * Allows anonymous access to the first FREE_PREVIEW_PARAGRAPHS paragraphs of a
 * text (by :index param); anything beyond falls through to the subscription
 * gate (401 if signed out, 402 if not subscribed).
 */
export async function requirePreviewOrSubscribed(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const auth = getAuth(req);
  if (auth?.userId) req.userId = auth.userId;

  const index = Number(req.params.index);
  if (Number.isInteger(index) && index >= 0 && index < FREE_PREVIEW_PARAGRAPHS) {
    next();
    return;
  }

  await requireSubscribedUser(req, res, next);
}

export async function requireAuthed(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
}

export { clerkClient };
