import type { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { eq, sql } from "drizzle-orm";
import { db, userSubscriptionsTable } from "@workspace/db";

export interface AuthedRequest extends Request {
  userId?: string;
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

  const [sub] = await db.select().from(userSubscriptionsTable).where(eq(userSubscriptionsTable.userId, userId));
  if (!sub) {
    res.status(402).json({ error: "Subscription required" });
    return;
  }

  let status = sub.status;
  if (sub.stripeSubscriptionId) {
    try {
      const row = await db.execute(
        sql`SELECT status FROM stripe.subscriptions WHERE id = ${sub.stripeSubscriptionId} LIMIT 1`
      );
      const liveStatus = (row.rows[0] as { status?: string } | undefined)?.status;
      if (liveStatus) {
        status = liveStatus;
        if (liveStatus !== sub.status) {
          await db.update(userSubscriptionsTable).set({ status: liveStatus }).where(eq(userSubscriptionsTable.userId, userId));
        }
      }
    } catch {
      /* ignore */
    }
  }

  if (status !== "active" && status !== "trialing") {
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
