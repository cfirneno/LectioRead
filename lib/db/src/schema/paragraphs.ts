import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paragraphsTable = pgTable("paragraphs", {
  id: serial("id").primaryKey(),
  textId: integer("text_id").notNull(),
  index: integer("index").notNull(),
  originalText: text("original_text").notNull(),
  interlinearTranslation: text("interlinear_translation"),
  fullTranslation: text("full_translation"),
  scansion: text("scansion"),
  audio: text("audio"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertParagraphSchema = createInsertSchema(paragraphsTable).omit({ id: true, createdAt: true });
export type InsertParagraph = z.infer<typeof insertParagraphSchema>;
export type Paragraph = typeof paragraphsTable.$inferSelect;
