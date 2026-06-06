import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, visitsTable } from "@workspace/db";
import { RecordVisitBody } from "@workspace/api-zod";

const router: IRouter = Router();

// Public — every site visit is recorded, including anonymous visitors.
router.post("/visits", async (req, res): Promise<void> => {
  const parsed = RecordVisitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { visitorId, path, referrer } = parsed.data;
  const userAgent = (req.get("user-agent") ?? "").slice(0, 512) || null;

  await db.insert(visitsTable).values({
    visitorId,
    path,
    referrer: referrer ?? null,
    userAgent,
  });

  res.json({ recorded: true });
});

router.get("/visits/stats", async (_req, res): Promise<void> => {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      uniqueVisitors: sql<number>`count(distinct ${visitsTable.visitorId})::int`,
      last24h: sql<number>`count(*) filter (where ${visitsTable.createdAt} >= now() - interval '24 hours')::int`,
      last7d: sql<number>`count(*) filter (where ${visitsTable.createdAt} >= now() - interval '7 days')::int`,
    })
    .from(visitsTable);

  res.json({
    total: row?.total ?? 0,
    uniqueVisitors: row?.uniqueVisitors ?? 0,
    last24h: row?.last24h ?? 0,
    last7d: row?.last7d ?? 0,
  });
});

export default router;
