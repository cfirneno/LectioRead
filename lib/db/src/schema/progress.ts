import { pgTable, serial, timestamp, integer, boolean, text, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const progressTable = pgTable(
  "progress",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    textId: integer("text_id").notNull(),
    paragraphIndex: integer("paragraph_index").notNull(),
    completed: boolean("completed").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => ({
    userTextParagraphIdx: uniqueIndex("progress_user_text_paragraph_idx").on(t.userId, t.textId, t.paragraphIndex),
  })
);

export const insertProgressSchema = createInsertSchema(progressTable).omit({ id: true });
export type InsertProgress = z.infer<typeof insertProgressSchema>;
export type Progress = typeof progressTable.$inferSelect;
