import { pgTable, serial, integer, text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";

export const quizzesTable = pgTable(
  "quizzes",
  {
    id: serial("id").primaryKey(),
    textId: integer("text_id").notNull(),
    paragraphIndex: integer("paragraph_index").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    quizTextParagraphIdx: uniqueIndex("quizzes_text_paragraph_idx").on(t.textId, t.paragraphIndex),
  }),
);
export type Quiz = typeof quizzesTable.$inferSelect;

export const quizAttemptsTable = pgTable(
  "quiz_attempts",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    textId: integer("text_id").notNull(),
    paragraphIndex: integer("paragraph_index").notNull(),
    score: integer("score").notNull(),
    total: integer("total").notNull(),
    missedItems: text("missed_items").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    attemptsUserIdx: index("quiz_attempts_user_idx").on(t.userId, t.createdAt),
  }),
);
export type QuizAttempt = typeof quizAttemptsTable.$inferSelect;
