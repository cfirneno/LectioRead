import { pgTable, text, serial, timestamp, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paragraphTranslationsTable = pgTable(
  "paragraph_translations",
  {
    id: serial("id").primaryKey(),
    paragraphId: integer("paragraph_id").notNull(),
    kind: text("kind").notNull(),
    language: text("language").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueKey: uniqueIndex("paragraph_translations_unique").on(
      table.paragraphId,
      table.kind,
      table.language
    ),
  })
);

export const insertParagraphTranslationSchema = createInsertSchema(paragraphTranslationsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertParagraphTranslation = z.infer<typeof insertParagraphTranslationSchema>;
export type ParagraphTranslation = typeof paragraphTranslationsTable.$inferSelect;
