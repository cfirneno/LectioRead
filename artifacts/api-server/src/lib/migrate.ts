import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { logger } from "./logger";

export async function runIdempotentMigrations(): Promise<void> {
  try {
    await db.execute(sql`ALTER TABLE texts ADD COLUMN IF NOT EXISTS publication_year integer`);
    await db.execute(sql`ALTER TABLE texts ADD COLUMN IF NOT EXISTS english_title text`);
    await db.execute(sql`ALTER TABLE texts ADD COLUMN IF NOT EXISTS english_author text`);
    await db.execute(sql`ALTER TABLE texts ADD COLUMN IF NOT EXISTS catalog_key text`);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS texts_catalog_key_unique ON texts(catalog_key) WHERE catalog_key IS NOT NULL`);
    await db.execute(sql`ALTER TABLE paragraphs ADD COLUMN IF NOT EXISTS scansion text`);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS quizzes (
        id serial PRIMARY KEY,
        text_id integer NOT NULL,
        paragraph_index integer NOT NULL,
        content text NOT NULL,
        created_at timestamp with time zone NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS quizzes_text_paragraph_idx ON quizzes(text_id, paragraph_index)`);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id serial PRIMARY KEY,
        user_id text NOT NULL,
        text_id integer NOT NULL,
        paragraph_index integer NOT NULL,
        score integer NOT NULL,
        total integer NOT NULL,
        missed_items text NOT NULL,
        created_at timestamp with time zone NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS quiz_attempts_user_idx ON quiz_attempts(user_id, created_at)`);
    logger.info("Idempotent migrations applied");
  } catch (err) {
    logger.error({ err }, "Idempotent migration failed");
  }
}
