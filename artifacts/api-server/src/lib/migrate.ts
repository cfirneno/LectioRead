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
    logger.info("Idempotent migrations applied");
  } catch (err) {
    logger.error({ err }, "Idempotent migration failed");
  }
}
