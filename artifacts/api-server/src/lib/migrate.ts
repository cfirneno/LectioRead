import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { logger } from "./logger";

export async function runIdempotentMigrations(): Promise<void> {
  try {
    await db.execute(sql`ALTER TABLE texts ADD COLUMN IF NOT EXISTS publication_year integer`);
    logger.info("Idempotent migrations applied");
  } catch (err) {
    logger.error({ err }, "Idempotent migration failed");
  }
}
