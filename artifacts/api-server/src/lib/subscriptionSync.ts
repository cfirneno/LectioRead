import { eq } from "drizzle-orm";
import { db, userSubscriptionsTable } from "@workspace/db";
import { getUncachableStripeClient } from "./stripeClient";
import { logger } from "./logger";

interface SubscriptionLike {
  id?: string;
  status?: string;
  customer?: string;
  current_period_end?: number;
  metadata?: Record<string, string> | null;
}

interface CheckoutSessionLike {
  customer?: string;
  subscription?: string;
  client_reference_id?: string | null;
  metadata?: Record<string, string> | null;
}

interface StripeEventLike {
  type?: string;
  data?: { object?: unknown };
}

async function resolveClerkUserId(opts: {
  metadataUserId?: string | null;
  clientReferenceId?: string | null;
  customerId?: string | null;
}): Promise<string | null> {
  if (opts.metadataUserId) return opts.metadataUserId;
  if (opts.clientReferenceId) return opts.clientReferenceId;
  if (opts.customerId) {
    const [row] = await db
      .select()
      .from(userSubscriptionsTable)
      .where(eq(userSubscriptionsTable.stripeCustomerId, opts.customerId));
    if (row) return row.userId;
    // Last resort: ask Stripe for the customer's metadata
    try {
      const stripe = await getUncachableStripeClient();
      const customer = await stripe.customers.retrieve(opts.customerId);
      if (customer && !("deleted" in customer && customer.deleted)) {
        const md = (customer as { metadata?: Record<string, string> }).metadata;
        if (md?.clerkUserId) return md.clerkUserId;
      }
    } catch (err) {
      logger.warn({ err, customerId: opts.customerId }, "Failed to fetch Stripe customer for user resolution");
    }
  }
  return null;
}

async function upsertSubscription(input: {
  userId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  status?: string | null;
  currentPeriodEnd?: number | null;
}): Promise<void> {
  const periodEnd = input.currentPeriodEnd ? new Date(input.currentPeriodEnd * 1000) : null;
  const [existing] = await db
    .select()
    .from(userSubscriptionsTable)
    .where(eq(userSubscriptionsTable.userId, input.userId));

  if (existing) {
    await db
      .update(userSubscriptionsTable)
      .set({
        stripeCustomerId: input.stripeCustomerId ?? existing.stripeCustomerId,
        stripeSubscriptionId: input.stripeSubscriptionId ?? existing.stripeSubscriptionId,
        status: input.status ?? existing.status,
        currentPeriodEnd: periodEnd ?? existing.currentPeriodEnd,
      })
      .where(eq(userSubscriptionsTable.userId, input.userId));
  } else {
    await db.insert(userSubscriptionsTable).values({
      userId: input.userId,
      stripeCustomerId: input.stripeCustomerId ?? null,
      stripeSubscriptionId: input.stripeSubscriptionId ?? null,
      status: input.status ?? null,
      currentPeriodEnd: periodEnd,
    });
  }
}

export async function applyStripeEventToSubscriptions(event: StripeEventLike): Promise<void> {
  const type = event?.type;
  if (!type) return;

  if (
    type === "customer.subscription.created" ||
    type === "customer.subscription.updated" ||
    type === "customer.subscription.deleted"
  ) {
    const sub = event.data?.object as SubscriptionLike | undefined;
    if (!sub?.id || !sub.customer) return;
    const userId = await resolveClerkUserId({
      metadataUserId: sub.metadata?.clerkUserId,
      customerId: sub.customer,
    });
    if (!userId) {
      logger.warn({ subscriptionId: sub.id }, "Stripe subscription event: cannot resolve Clerk user");
      return;
    }
    await upsertSubscription({
      userId,
      stripeCustomerId: sub.customer,
      stripeSubscriptionId: sub.id,
      status: sub.status ?? null,
      currentPeriodEnd: sub.current_period_end ?? null,
    });
    return;
  }

  if (type === "checkout.session.completed") {
    const session = event.data?.object as CheckoutSessionLike | undefined;
    if (!session) return;
    const userId = await resolveClerkUserId({
      metadataUserId: session.metadata?.clerkUserId,
      clientReferenceId: session.client_reference_id,
      customerId: session.customer,
    });
    if (!userId) {
      logger.warn("checkout.session.completed: cannot resolve Clerk user");
      return;
    }
    let status: string | null = "active";
    let periodEnd: number | null = null;
    if (session.subscription) {
      try {
        const stripe = await getUncachableStripeClient();
        const sub = (await stripe.subscriptions.retrieve(session.subscription)) as unknown as SubscriptionLike;
        status = sub.status ?? status;
        periodEnd = sub.current_period_end ?? null;
      } catch (err) {
        logger.warn({ err }, "Failed to retrieve subscription on checkout completion");
      }
    }
    await upsertSubscription({
      userId,
      stripeCustomerId: session.customer ?? null,
      stripeSubscriptionId: session.subscription ?? null,
      status,
      currentPeriodEnd: periodEnd,
    });
  }
}

// Fallback: if user has a Stripe customer but no subscription row yet, ask Stripe
// directly and persist. Returns the resolved active status.
export async function reconcileFromStripe(userId: string): Promise<{
  status: string | null;
  active: boolean;
}> {
  const [existing] = await db
    .select()
    .from(userSubscriptionsTable)
    .where(eq(userSubscriptionsTable.userId, userId));

  if (!existing?.stripeCustomerId) return { status: existing?.status ?? null, active: false };

  try {
    const stripe = await getUncachableStripeClient();
    const subs = await stripe.subscriptions.list({
      customer: existing.stripeCustomerId,
      status: "all",
      limit: 5,
    });
    const sub = subs.data.find((s) =>
      ["active", "trialing", "past_due", "incomplete"].includes(s.status),
    ) ?? subs.data[0];
    if (!sub) return { status: existing.status ?? null, active: false };
    const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end ?? null;
    await db
      .update(userSubscriptionsTable)
      .set({
        stripeSubscriptionId: sub.id,
        status: sub.status,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : existing.currentPeriodEnd,
      })
      .where(eq(userSubscriptionsTable.userId, userId));
    const active = sub.status === "active" || sub.status === "trialing";
    return { status: sub.status, active };
  } catch (err) {
    logger.warn({ err, userId }, "reconcileFromStripe failed");
    return { status: existing.status ?? null, active: false };
  }
}
