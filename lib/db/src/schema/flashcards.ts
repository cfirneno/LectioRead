import { pgTable, serial, text, integer, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Cached vocabulary enrichment per (textId, normalized word).
 * Shared across users — the emoji, definition and inflection for a word in a
 * given text are the same for everyone, so we only generate them once.
 * Which cards a given user sees is driven by their reading progress.
 */
export const flashcardsTable = pgTable(
  "flashcards",
  {
    id: serial("id").primaryKey(),
    textId: integer("text_id").notNull(),
    word: text("word").notNull(),
    displayWord: text("display_word").notNull(),
    definition: text("definition").notNull(),
    icon: text("icon").notNull(),
    inflection: text("inflection").notNull(),
    important: boolean("important").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    textWordIdx: uniqueIndex("flashcards_text_word_idx").on(t.textId, t.word),
  })
);

export const insertFlashcardSchema = createInsertSchema(flashcardsTable).omit({ id: true, createdAt: true });
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type Flashcard = typeof flashcardsTable.$inferSelect;
