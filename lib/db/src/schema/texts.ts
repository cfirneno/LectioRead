import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const textsTable = pgTable("texts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  language: text("language").notNull(),
  targetLanguage: text("target_language").default("English"),
  sourceUrl: text("source_url"),
  description: text("description"),
  paragraphCount: integer("paragraph_count").notNull().default(0),
  lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTextSchema = createInsertSchema(textsTable).omit({ id: true, createdAt: true });
export type InsertText = z.infer<typeof insertTextSchema>;
export type Text = typeof textsTable.$inferSelect;
