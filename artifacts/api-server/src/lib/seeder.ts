import { ilike } from "drizzle-orm";
import { db, textsTable, paragraphsTable } from "@workspace/db";
import { searchAndFetchText } from "./ai";
import { logger } from "./logger";

const CATALOG_QUERIES: Array<{ query: string; title: string }> = [
  { query: "Il Principe by Machiavelli, chapters 1-3", title: "Il Principe" },
  { query: "Divina Commedia, Inferno Canto I by Dante Alighieri", title: "Inferno" },
  { query: "De Bello Gallico Book I chapters 1-5 by Julius Caesar", title: "Bello Gallico" },
  { query: "Meditations Book I by Marcus Aurelius in Greek", title: "εἰς ἑαυτόν" },
  { query: "Aeneid Book I opening by Virgil in Latin", title: "Aeneis" },
  { query: "Iliad Book I opening by Homer in Ancient Greek", title: "Ἰλιάς" },
  { query: "Don Quijote Part 1 Chapter 1 by Cervantes in Spanish", title: "Quijote" },
  { query: "Les Misérables Part 1 Book 1 Chapter 1 by Victor Hugo in French", title: "Misérables" },
  { query: "Epistulae Morales Ad Lucilium Letter 1 by Seneca in Latin", title: "Epistulae Morales" },
  { query: "Faust Part I opening monologue by Goethe in German", title: "Faust" },
  { query: "Odyssey Book I opening by Homer in Ancient Greek", title: "Ὀδύσσεια" },
  { query: "De Rerum Natura Book I opening by Lucretius in Latin", title: "Rerum Natura" },
  { query: "Carmen I.1 Maecenas atavis by Horace in Latin", title: "Carmina" },
  { query: "Nicomachean Ethics Book I opening by Aristotle in Greek", title: "Νικομάχεια" },
  { query: "Les Fleurs du Mal opening poems by Baudelaire in French", title: "Fleurs du Mal" },
  { query: "Republic Book I opening by Plato in Ancient Greek", title: "Πολιτεία" },
];

async function titleExistsInDb(partialTitle: string): Promise<boolean> {
  const [row] = await db
    .select({ id: textsTable.id })
    .from(textsTable)
    .where(ilike(textsTable.title, `%${partialTitle}%`))
    .limit(1);
  return !!row;
}

async function fetchAndStore(query: string, catalogTitle: string): Promise<void> {
  // Check before calling AI using a keyword from the catalog title to handle
  // minor title format variations the AI might return
  if (await titleExistsInDb(catalogTitle)) {
    logger.info({ catalogTitle }, "Catalog text already in DB, skipping");
    return;
  }

  const result = await searchAndFetchText(query);

  // Check again after AI call to guard against concurrent inserts
  if (await titleExistsInDb(catalogTitle)) {
    logger.info({ title: result.title }, "Skipping duplicate catalog text");
    return;
  }

  const [text] = await db
    .insert(textsTable)
    .values({
      title: result.title,
      author: result.author,
      language: result.language,
      targetLanguage: "English",
      sourceUrl: result.sourceUrl,
      description: result.description,
      paragraphCount: result.paragraphs.length,
      // Do not set lastAccessedAt — only user-initiated reads should set this
    })
    .returning();

  const paragraphInserts = result.paragraphs.map((p, i) => ({
    textId: text.id,
    index: i,
    originalText: p,
  }));

  await db.insert(paragraphsTable).values(paragraphInserts);
  logger.info({ title: result.title }, "Seeded catalog text");
}

async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number
): Promise<void> {
  const queue = [...tasks];
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      const task = queue.shift();
      if (task) await task();
    }
  });
  await Promise.all(workers);
}

export async function seedCatalog(): Promise<void> {
  const missing: Array<{ query: string; title: string }> = [];

  for (const item of CATALOG_QUERIES) {
    if (!(await titleExistsInDb(item.title))) {
      missing.push(item);
    }
  }

  if (missing.length === 0) {
    logger.info("Catalog already seeded — nothing to do");
    return;
  }

  logger.info({ count: missing.length }, "Seeding catalog texts in background");

  const tasks = missing.map(
    (c) => () =>
      fetchAndStore(c.query, c.title).catch((err) => {
        logger.error({ err, query: c.query }, "Failed to seed catalog text");
      })
  );

  runWithConcurrency(tasks, 2).catch((err) => {
    logger.error({ err }, "Catalog seed failed");
  });
}
