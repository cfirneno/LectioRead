import { Router, type IRouter } from "express";
import { CreateDonationCheckoutBody } from "@workspace/api-zod";
import { getUncachableStripeClient } from "../lib/stripeClient";

const router: IRouter = Router();

// One-time, no-account donation (Wikipedia style). Stripe Checkout collects the
// payer's email and card; we don't store anything — Stripe is the record.
router.post("/donate/checkout", async (req, res): Promise<void> => {
  const parsed = CreateDonationCheckoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!Number.isInteger(parsed.data.amountCents)) {
    res.status(400).json({ error: "amountCents must be a whole number of cents" });
    return;
  }

  try {
    const stripe = await getUncachableStripeClient();
    const host = req.get("host");
    const proto = req.get("x-forwarded-proto") ?? req.protocol;
    const origin = `${proto}://${host}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      submit_type: "donate",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Donation to Lectio" },
            unit_amount: parsed.data.amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/support/thanks`,
      cancel_url: `${origin}/support?canceled=1`,
    });

    res.json({ url: session.url });
  } catch (err) {
    req.log.error({ err }, "Failed to create donation checkout session");
    res.status(500).json({ error: "Failed to start checkout" });
  }
});

export default router;
