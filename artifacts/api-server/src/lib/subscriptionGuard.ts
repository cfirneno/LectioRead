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
