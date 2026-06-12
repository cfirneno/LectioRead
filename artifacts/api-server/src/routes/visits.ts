import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, visitsTable } from "@workspace/db";
import { RecordVisitBody } from "@workspace/api-zod";
import { requireAdmin } from "../lib/adminGuard";
import { clientIpFrom, lookupGeo } from "../lib/geo";

const router: IRouter = Router();

// Public — every site visit is recorded, including anonymous visitors.
router.post("/visits", async (req, res): Promise<void> => {
  const parsed = RecordVisitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { visitorId, path, referrer, source } = parsed.data;
  const userAgent = (req.get("user-agent") ?? "").slice(0, 512) || null;
  const normalizedSource = source?.trim();

  const ip = clientIpFrom(req.headers["x-forwarded-for"], req.socket.remoteAddress);
  const geo = await lookupGeo(ip);

  await db.insert(visitsTable).values({
    visitorId,
    path,
    referrer: referrer ?? null,
    source: normalizedSource ? normalizedSource.slice(0, 64) : null,
    country: geo?.country ?? null,
    city: geo?.city ?? null,
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

  const bySourceRows = await db
    .select({
      source: sql<string>`coalesce(${visitsTable.source}, 'direct')`,
      visits: sql<number>`count(*)::int`,
      uniqueVisitors: sql<number>`count(distinct ${visitsTable.visitorId})::int`,
    })
    .from(visitsTable)
    .groupBy(sql`coalesce(${visitsTable.source}, 'direct')`)
    .orderBy(sql`count(*) desc`);

  const byCountryRows = await db
    .select({
      country: sql<string>`coalesce(${visitsTable.country}, 'Unknown')`,
      visits: sql<number>`count(*)::int`,
      uniqueVisitors: sql<number>`count(distinct ${visitsTable.visitorId})::int`,
    })
    .from(visitsTable)
    .groupBy(sql`coalesce(${visitsTable.country}, 'Unknown')`)
    .orderBy(sql`count(*) desc`);

  res.json({
    total: row?.total ?? 0,
    uniqueVisitors: row?.uniqueVisitors ?? 0,
    last24h: row?.last24h ?? 0,
    last7d: row?.last7d ?? 0,
    bySource: bySourceRows,
    byCountry: byCountryRows,
  });
});

router.get("/visits/recent", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: visitsTable.id,
      at: visitsTable.createdAt,
      source: visitsTable.source,
      referrer: visitsTable.referrer,
      path: visitsTable.path,
      country: visitsTable.country,
      city: visitsTable.city,
    })
    .from(visitsTable)
    .orderBy(sql`${visitsTable.createdAt} desc`)
    .limit(200);

  res.json({
    visits: rows.map((r) => ({
      id: r.id,
      at: (r.at instanceof Date ? r.at : new Date(r.at as unknown as string)).toISOString(),
      source: r.source,
      referrer: r.referrer,
      path: r.path,
      country: r.country,
      city: r.city,
    })),
  });
});

export default router;
