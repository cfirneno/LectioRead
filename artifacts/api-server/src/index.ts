import app from "./app";
import { logger } from "./lib/logger";
import { seedCatalog, cleanBrokenCatalogEntries, backfillPublicationYears, backfillEnglishTitles, deduplicateCatalogTexts } from "./lib/seeder";
import { runIdempotentMigrations } from "./lib/migrate";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  runIdempotentMigrations()
    .catch((err) => logger.error({ err }, "Migrations failed"))
    .finally(() => {
      deduplicateCatalogTexts()
        .catch((err) => logger.error({ err }, "Dedup failed"))
        .finally(() => {
      cleanBrokenCatalogEntries()
        .catch((err) => logger.error({ err }, "Cleanup failed"))
        .finally(() => {
          backfillPublicationYears()
            .catch((err) => logger.error({ err }, "Year backfill failed"))
            .finally(() => {
              backfillEnglishTitles()
                .catch((err) => logger.error({ err }, "English title backfill failed"))
                .finally(() => {
                  seedCatalog().catch((err) => logger.error({ err }, "Seed failed"));
                });
            });
        });
        });
    });
});
