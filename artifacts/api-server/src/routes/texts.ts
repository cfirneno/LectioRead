import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, textsTable, paragraphsTable, progressTable } from "@workspace/db";
import {
  SearchTextBody,
  GetTextParams,
  GetTextStatsParams,
} from "@workspace/api-zod";
import { searchAndFetchText } from "../lib/ai";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/texts/search", async (req, res): Promise<void> => {
  const parsed = SearchTextBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { query } = parsed.data;
  req.log.info({ query }, "Searching for text");

  try {
    const result = await searchAndFetchText(query);

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
        lastAccessedAt: new Date(),
      })
      .returning();

    const paragraphInserts = result.paragraphs.map((p, i) => ({
      textId: text.id,
      index: i,
      originalText: p,
    }));

    await db.insert(paragraphsTable).values(paragraphInserts);

    res.json({
      id: text.id,
      title: text.title,
      author: text.author,
      language: text.language,
      targetLanguage: text.targetLanguage,
      sourceUrl: text.sourceUrl,
      description: text.description,
      paragraphCount: text.paragraphCount,
      createdAt: text.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to search/fetch text");
    res.status(500).json({ error: "Failed to find text" });
  }
});

router.get("/texts", async (_req, res): Promise<void> => {
  const texts = await db
    .select()
    .from(textsTable)
    .orderBy(desc(textsTable.createdAt));

  res.json(
    texts.map((t) => ({
      id: t.id,
      title: t.title,
      author: t.author,
      language: t.language,
      targetLanguage: t.targetLanguage,
      sourceUrl: t.sourceUrl,
      description: t.description,
      paragraphCount: t.paragraphCount,
      createdAt: t.createdAt.toISOString(),
    }))
  );
});

router.get("/texts/recent", async (_req, res): Promise<void> => {
  const texts = await db
    .select()
    .from(textsTable)
    .orderBy(desc(textsTable.lastAccessedAt))
    .limit(10);

  const results = await Promise.all(
    texts.map(async (t) => {
      const progressRecords = await db
        .select()
        .from(progressTable)
        .where(eq(progressTable.textId, t.id));

      const completedCount = progressRecords.filter((p) => p.completed).length;
      const lastProgress = progressRecords
        .filter((p) => p.completed)
        .sort((a, b) => b.paragraphIndex - a.paragraphIndex)[0];

      return {
        id: t.id,
        title: t.title,
        author: t.author,
        language: t.language,
        paragraphCount: t.paragraphCount,
        completedCount,
        lastParagraphIndex: lastProgress ? lastProgress.paragraphIndex : null,
        lastAccessedAt: t.lastAccessedAt ? t.lastAccessedAt.toISOString() : null,
      };
    })
  );

  res.json(results);
});

router.get("/texts/:textId", async (req, res): Promise<void> => {
  const params = GetTextParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [text] = await db
    .select()
    .from(textsTable)
    .where(eq(textsTable.id, params.data.textId));

  if (!text) {
    res.status(404).json({ error: "Text not found" });
    return;
  }

  await db
    .update(textsTable)
    .set({ lastAccessedAt: new Date() })
    .where(eq(textsTable.id, text.id));

  res.json({
    id: text.id,
    title: text.title,
    author: text.author,
    language: text.language,
    targetLanguage: text.targetLanguage,
    sourceUrl: text.sourceUrl,
    description: text.description,
    paragraphCount: text.paragraphCount,
    createdAt: text.createdAt.toISOString(),
  });
});

router.get("/texts/:textId/stats", async (req, res): Promise<void> => {
  const params = GetTextStatsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [text] = await db
    .select()
    .from(textsTable)
    .where(eq(textsTable.id, params.data.textId));

  if (!text) {
    res.status(404).json({ error: "Text not found" });
    return;
  }

  const progressRecords = await db
    .select()
    .from(progressTable)
    .where(eq(progressTable.textId, params.data.textId));

  const completedParagraphs = progressRecords.filter((p) => p.completed).length;
  const percentComplete =
    text.paragraphCount > 0
      ? Math.round((completedParagraphs / text.paragraphCount) * 100)
      : 0;

  res.json({
    textId: text.id,
    totalParagraphs: text.paragraphCount,
    completedParagraphs,
    percentComplete,
  });
});

export default router;
