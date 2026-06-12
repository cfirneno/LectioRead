import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db, subscribersTable } from "@workspace/db";
import { SubscribeNewsletterBody } from "@workspace/api-zod";

const router: IRouter = Router();

// Simple in-memory rate limit for this public, write endpoint — curbs automated
// list-pollution. Fixed window, per-IP plus a global ceiling.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_PER_IP = 10;
const RATE_LIMIT_GLOBAL = 300;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
let globalBucket = { count: 0, resetAt: Date.now() + RATE_LIMIT_WINDOW_MS };

function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const now = Date.now();
  if (now > globalBucket.resetAt) {
    globalBucket = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }
  globalBucket.count++;
  if (globalBucket.count > RATE_LIMIT_GLOBAL) {
    res.status(429).json({ error: "Too many requests, slow down." });
    return;
  }

  const ip = (req.ip || req.socket.remoteAddress || "unknown").toString();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else {
    bucket.count++;
    if (bucket.count > RATE_LIMIT_PER_IP) {
      res.status(429).json({ error: "Too many requests from this address." });
      return;
    }
  }

  if (rateBuckets.size > 5000) {
    for (const [k, v] of rateBuckets) {
      if (now > v.resetAt) rateBuckets.delete(k);
    }
  }

  next();
}

// Public — anyone can subscribe to the newsletter. Idempotent on lowercased email.
router.post("/subscribe", rateLimit, async (req, res): Promise<void> => {
  const parsed = SubscribeNewsletterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const source = parsed.data.source ?? null;

  await db.insert(subscribersTable).values({ email, source }).onConflictDoNothing();

  res.json({ ok: true });
});

export default router;
