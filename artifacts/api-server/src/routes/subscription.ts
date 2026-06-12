import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, userSubscriptionsTable } from "@workspace/db";
import { getUncachableStripeClient } from "../lib/stripeClient";
import { getEffectiveSubscriptionStatus } from "../lib/subscriptionGuard";

// Reading is free for everyone — there are no new subscriptions. These routes
// remain only so the handful of legacy $1/month subscribers can check their
// status and open the Stripe billing portal to cancel.

const router: IRouter = Router();

interface AuthedRequest extends Request {
  userId?: string;
}

async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
}

router.get("/subscription/me", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const { active, status } = await getEffectiveSubscriptionStatus(req.userId!);
  res.json({ active, status });
});

router.post("/subscription/portal", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  try {
    const [existing] = await db.select().from(userSubscriptionsTable).where(eq(userSubscriptionsTable.userId, req.userId!));
    if (!existing?.stripeCustomerId) {
      res.status(400).json({ error: "No subscription found" });
      return;
    }
    const stripe = await getUncachableStripeClient();
    const host = req.get("host");
    const proto = req.get("x-forwarded-proto") ?? req.protocol;
    const session = await stripe.billingPortal.sessions.create({
      customer: existing.stripeCustomerId,
      return_url: `${proto}://${host}/app`,
    });
    res.json({ url: session.url });
  } catch (err) {
    req.log.error({ err }, "Failed to create portal session");
    res.status(500).json({ error: "Failed to open portal" });
  }
});

export default router;
