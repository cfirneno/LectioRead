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
    await db.execute(sql`ALTER TABLE paragraphs ADD COLUMN IF NOT EXISTS audio text`);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS flashcards (
        id serial PRIMARY KEY,
        text_id integer NOT NULL,
        word text NOT NULL,
        display_word text NOT NULL,
        definition text NOT NULL,
        icon text NOT NULL,
        inflection text NOT NULL,
        important boolean NOT NULL DEFAULT true,
        created_at timestamp with time zone NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS flashcards_text_word_idx ON flashcards(text_id, word)`);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS visits (
        id serial PRIMARY KEY,
        visitor_id text NOT NULL,
        path text NOT NULL,
        referrer text,
        user_agent text,
        created_at timestamp with time zone NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`ALTER TABLE visits ADD COLUMN IF NOT EXISTS source text`);
    await db.execute(sql`ALTER TABLE visits ADD COLUMN IF NOT EXISTS country text`);
    await db.execute(sql`ALTER TABLE visits ADD COLUMN IF NOT EXISTS city text`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS visits_created_at_idx ON visits(created_at)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS visits_visitor_idx ON visits(visitor_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS visits_source_idx ON visits(source)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS visits_country_idx ON visits(country)`);
    await db.execute(sql`ALTER TABLE texts ADD COLUMN IF NOT EXISTS nationality text`);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS paragraph_translations (
        id serial PRIMARY KEY,
        paragraph_id integer NOT NULL,
        kind text NOT NULL,
        language text NOT NULL,
        content text NOT NULL,
        created_at timestamp with time zone NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS paragraph_translations_unique ON paragraph_translations(paragraph_id, kind, language)`);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subscribers (
        id serial PRIMARY KEY,
        email text NOT NULL,
        source text,
        created_at timestamp with time zone NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS subscribers_email_unique ON subscribers(lower(email))`);
    logger.info("Idempotent migrations applied");
  } catch (err) {
    logger.error({ err }, "Idempotent migration failed");
  }
}
