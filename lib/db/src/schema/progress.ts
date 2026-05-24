import { pgTable, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const progressTable = pgTable("progress", {
  id: serial("id").primaryKey(),
  textId: integer("text_id").notNull(),
  paragraphIndex: integer("paragraph_index").notNull(),
  completed: boolean("completed").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProgressSchema = createInsertSchema(progressTable).omit({ id: true });
export type InsertProgress = z.infer<typeof insertProgressSchema>;
export type Progress = typeof progressTable.$inferSelect;
