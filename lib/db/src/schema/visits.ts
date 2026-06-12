import { pgTable, serial, timestamp, text, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const visitsTable = pgTable(
  "visits",
  {
    id: serial("id").primaryKey(),
    visitorId: text("visitor_id").notNull(),
    path: text("path").notNull(),
    referrer: text("referrer"),
    source: text("source"),
    country: text("country"),
    city: text("city"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    createdAtIdx: index("visits_created_at_idx").on(t.createdAt),
    visitorIdx: index("visits_visitor_idx").on(t.visitorId),
    sourceIdx: index("visits_source_idx").on(t.source),
    countryIdx: index("visits_country_idx").on(t.country),
  })
);

export const insertVisitSchema = createInsertSchema(visitsTable).omit({ id: true, createdAt: true });
export type InsertVisit = z.infer<typeof insertVisitSchema>;
export type Visit = typeof visitsTable.$inferSelect;
