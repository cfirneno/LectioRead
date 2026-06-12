import { Router, type IRouter } from "express";
import { eq, desc, ilike, and } from "drizzle-orm";
import { db, textsTable, paragraphsTable, progressTable } from "@workspace/db";
import {
  SearchTextBody,
  GetTextParams,
  GetTextStatsParams,
  GetTextVocabularyParams,
} from "@workspace/api-zod";
import { searchAndFetchText, CopyrightedTextError } from "../lib/ai";
import { requireAuthed, attachOptionalUser, type AuthedRequest } from "../lib/subscriptionGuard";
import { beginForeground } from "../lib/foregroundGate";
import { aggregateVocabulary } from "../lib/vocab";

const router: IRouter = Router();

router.post("/texts/search", attachOptionalUser, async (req: AuthedRequest, res): Promise<void> => {
  const parsed = SearchTextBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { query } = parsed.data;
  req.log.info({ query }, "Searching for text");

  const releaseForeground = beginForeground();
  try {
    const result = await searchAndFetchText(query);

    // Return existing text if the AI resolved to a title already in the library
    const [existing] = await db
      .select()
      .from(textsTable)
      .where(ilike(textsTable.title, result.title))
      .limit(1);

    if (existing) {
      req.log.info({ title: result.title, id: existing.id }, "Returning existing text");
      await db.update(textsTable).set({ lastAccessedAt: new Date() }).where(eq(textsTable.id, existing.id));
      res.json({
        id: existing.id,
        title: existing.title,
        author: existing.author,
        language: existing.language,
        targetLanguage: existing.targetLanguage,
        sourceUrl: existing.sourceUrl,
        description: existing.description,
        paragraphCount: existing.paragraphCount,
        createdAt: existing.createdAt.toISOString(),
      });
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
    if (err instanceof CopyrightedTextError) {
      req.log.info({ query, message: err.message }, "Refused copyrighted text");
      res.status(400).json({ error: err.message });
      return;
    }
    req.log.error({ err }, "Failed to search/fetch text");
    res.status(500).json({ error: "Failed to find text" });
  } finally {
    releaseForeground();
  }
});

router.get("/texts", attachOptionalUser, async (_req: AuthedRequest, res): Promise<void> => {
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
      publicationYear: t.publicationYear,
      englishTitle: t.englishTitle,
      englishAuthor: t.englishAuthor,
      catalogKey: t.catalogKey,
      nationality: t.nationality,
      createdAt: t.createdAt.toISOString(),
    }))
  );
});

router.get("/texts/recent", attachOptionalUser, async (req: AuthedRequest, res): Promise<void> => {
  const userId = req.userId;
  if (!userId) {
    res.json([]);
    return;
  }
  const userProgress = await db
    .select()
    .from(progressTable)
    .where(eq(progressTable.userId, userId));

  if (userProgress.length === 0) {
    res.json([]);
    return;
  }

  // Per-user last-activity timestamp per text
  const lastActivityByText = new Map<number, Date>();
  for (const p of userProgress) {
    const prev = lastActivityByText.get(p.textId);
    if (!prev || p.updatedAt > prev) lastActivityByText.set(p.textId, p.updatedAt);
  }

  const textIds = Array.from(lastActivityByText.keys());
  const allTexts = await db.select().from(textsTable);
  const texts = allTexts
    .filter((t) => textIds.includes(t.id))
    .sort(
      (a, b) =>
        (lastActivityByText.get(b.id)?.getTime() ?? 0) -
        (lastActivityByText.get(a.id)?.getTime() ?? 0),
    )
    .slice(0, 10);

  const results = texts.map((t) => {
    const progressRecords = userProgress.filter((p) => p.textId === t.id);
    const completedCount = progressRecords.filter((p) => p.completed).length;
    const lastProgress = progressRecords
      .filter((p) => p.completed)
      .sort((a, b) => b.paragraphIndex - a.paragraphIndex)[0];
    const lastActivity = lastActivityByText.get(t.id);
    return {
      id: t.id,
      title: t.title,
      author: t.author,
      language: t.language,
      paragraphCount: t.paragraphCount,
      completedCount,
      lastParagraphIndex: lastProgress ? lastProgress.paragraphIndex : null,
      lastAccessedAt: lastActivity ? lastActivity.toISOString() : null,
    };
  });

  res.json(results);
});

router.get("/texts/:textId", async (req: AuthedRequest, res): Promise<void> => {
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
    nationality: text.nationality,
    createdAt: text.createdAt.toISOString(),
  });
});

router.get("/texts/:textId/stats", requireAuthed, async (req: AuthedRequest, res): Promise<void> => {
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
    .where(
      and(
        eq(progressTable.userId, req.userId!),
        eq(progressTable.textId, params.data.textId)
      )
    );

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

router.get("/texts/:textId/vocabulary", requireAuthed, async (req: AuthedRequest, res): Promise<void> => {
  const params = GetTextVocabularyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { throughParagraphIndex, entries } = await aggregateVocabulary(req.userId!, params.data.textId);

  res.json({
    textId: params.data.textId,
    throughParagraphIndex,
    entries: entries.map((e) => ({
      original: e.original,
      translation: e.translation,
      count: e.count,
      firstParagraphIndex: e.firstParagraphIndex,
    })),
  });
});

export default router;
