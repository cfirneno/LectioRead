import Stripe from "stripe";
import { StripeSync } from "stripe-replit-sync";

async function getCredentials(): Promise<{ publishableKey: string; secretKey: string }> {
  const envSecret = process.env.STRIPE_SECRET_KEY;
  const envPublishable = process.env.STRIPE_PUBLISHABLE_KEY;
  if (envSecret && envPublishable) {
    const secretMode = envSecret.startsWith("sk_live_") ? "live" : envSecret.startsWith("sk_test_") ? "test" : null;
    const publishableMode = envPublishable.startsWith("pk_live_") ? "live" : envPublishable.startsWith("pk_test_") ? "test" : null;
    if (!secretMode || !publishableMode) {
      throw new Error("STRIPE_SECRET_KEY must start with sk_live_ or sk_test_, STRIPE_PUBLISHABLE_KEY must start with pk_live_ or pk_test_");
    }
    if (secretMode !== publishableMode) {
      throw new Error(`Stripe key mode mismatch: secret is ${secretMode}, publishable is ${publishableMode}. Both must be live or both test.`);
    }
    return { publishableKey: envPublishable, secretKey: envSecret };
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!hostname || !xReplitToken) {
    throw new Error("Missing Replit connector env vars. Connect Stripe via Integrations or set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY.");
  }

  const isProduction = process.env.REPLIT_DEPLOYMENT === "1";
  const targetEnvironment = isProduction ? "production" : "development";

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set("include_secrets", "true");
  url.searchParams.set("connector_names", "stripe");
  url.searchParams.set("environment", targetEnvironment);

  const resp = await fetch(url.toString(), {
    headers: { Accept: "application/json", X_REPLIT_TOKEN: xReplitToken },
    signal: AbortSignal.timeout(10_000),
  });
  if (!resp.ok) throw new Error(`Failed to fetch Stripe credentials: ${resp.status}`);
  const data = (await resp.json()) as { items?: Array<{ settings?: { publishable?: string; secret?: string } }> };
  const settings = data.items?.[0]?.settings;
  if (!settings?.publishable || !settings?.secret) {
    throw new Error(`Stripe ${targetEnvironment} connection not found or missing keys`);
  }
  return { publishableKey: settings.publishable, secretKey: settings.secret };
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getCredentials();
  return new Stripe(secretKey);
}

export async function getStripePublishableKey(): Promise<string> {
  const { publishableKey } = await getCredentials();
  return publishableKey;
}

let stripeSync: StripeSync | null = null;

export async function getStripeSync(): Promise<StripeSync> {
  if (stripeSync) return stripeSync;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL required");
  const { secretKey } = await getCredentials();
  stripeSync = new StripeSync({
    poolConfig: { connectionString: databaseUrl, max: 2 },
    stripeSecretKey: secretKey,
  });
  return stripeSync;
}
