import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, userSubscriptionsTable } from "@workspace/db";
import { getUncachableStripeClient } from "../lib/stripeClient";
import { getEffectiveSubscriptionStatus } from "../lib/subscriptionGuard";

const router: IRouter = Router();

const PRICE_AMOUNT_CENTS = 100;
const PRODUCT_NAME = "Lectio Subscription";

interface AuthedRequest extends Request {
  userId?: string;
  userEmail?: string | null;
}

async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  try {
    const user = await clerkClient.users.getUser(userId);
    req.userEmail = user.emailAddresses[0]?.emailAddress ?? null;
  } catch {
    req.userEmail = null;
  }
  next();
}

async function getOrCreatePriceId(): Promise<string> {
  const stripe = await getUncachableStripeClient();
  const existing = await stripe.products.search({
    query: `name:'${PRODUCT_NAME}' AND active:'true'`,
  });
  let productId: string;
  if (existing.data.length > 0) {
    productId = existing.data[0].id;
  } else {
    const product = await stripe.products.create({
      name: PRODUCT_NAME,
      description: "Unlimited reading access to all classical texts",
    });
    productId = product.id;
  }
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 10 });
  const monthly = prices.data.find(
    (p) => p.unit_amount === PRICE_AMOUNT_CENTS && p.currency === "usd" && p.recurring?.interval === "month"
  );
  if (monthly) return monthly.id;
  const newPrice = await stripe.prices.create({
    product: productId,
    unit_amount: PRICE_AMOUNT_CENTS,
    currency: "usd",
    recurring: { interval: "month" },
  });
  return newPrice.id;
}

router.get("/subscription/me", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const { active, status } = await getEffectiveSubscriptionStatus(req.userId!);
  res.json({ active, status });
});

router.post("/subscription/checkout", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  try {
    const stripe = await getUncachableStripeClient();
    const priceId = await getOrCreatePriceId();

    const [existing] = await db.select().from(userSubscriptionsTable).where(eq(userSubscriptionsTable.userId, req.userId!));
    let customerId = existing?.stripeCustomerId ?? null;

    if (!customerId) {
      // Search Stripe first to avoid creating duplicate customers from
      // concurrent /subscription/checkout calls (mitigates the race).
      const existingCustomers = await stripe.customers.search({
        query: `metadata['clerkUserId']:'${req.userId!}'`,
        limit: 1,
      });
      const found = existingCustomers.data[0];
      if (found) {
        customerId = found.id;
      } else {
        const customer = await stripe.customers.create({
          email: req.userEmail ?? undefined,
          metadata: { clerkUserId: req.userId! },
        });
        customerId = customer.id;
      }
      if (existing) {
        await db
          .update(userSubscriptionsTable)
          .set({ stripeCustomerId: customerId, email: req.userEmail ?? existing.email })
          .where(eq(userSubscriptionsTable.userId, req.userId!));
      } else {
        await db.insert(userSubscriptionsTable).values({
          userId: req.userId!,
          email: req.userEmail,
          stripeCustomerId: customerId,
        });
      }
    }

    const host = req.get("host");
    const proto = req.get("x-forwarded-proto") ?? req.protocol;
    const origin = `${proto}://${host}`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscribe?canceled=1`,
      client_reference_id: req.userId!,
      metadata: { clerkUserId: req.userId! },
    });

    res.json({ url: session.url });
  } catch (err) {
    req.log.error({ err }, "Failed to create checkout session");
    res.status(500).json({ error: "Failed to start checkout" });
  }
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
