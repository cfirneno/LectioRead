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

/**
 * Reading and all features are free. We still track subscription status for the
 * handful of legacy $1/month subscribers so they can reach the Stripe billing
 * portal and cancel. Nothing in the app is gated on this anymore.
 */
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

/**
 * Attaches req.userId when a Clerk session is present, but never blocks the
 * request. Use on public endpoints that still personalise for signed-in users.
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
 * Requires a signed-in user (but not a subscription). Use on endpoints that
 * store or read per-user data: progress, review, flashcards, vocabulary.
 */
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
