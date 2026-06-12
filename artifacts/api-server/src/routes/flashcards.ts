import { Router, type IRouter } from "express";
import { eq, and, inArray } from "drizzle-orm";
import { db, textsTable, flashcardsTable } from "@workspace/db";
import { GetTextFlashcardsParams } from "@workspace/api-zod";
import { requireAuthed, type AuthedRequest } from "../lib/subscriptionGuard";
import { beginForeground } from "../lib/foregroundGate";
import { aggregateVocabulary, normalizeWord } from "../lib/vocab";
import { enrichVocabulary } from "../lib/ai";

const router: IRouter = Router();

router.use(requireAuthed);

const ENRICH_BATCH = 40;

router.get("/texts/:textId/flashcards", async (req: AuthedRequest, res): Promise<void> => {
  const params = GetTextFlashcardsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const textId = params.data.textId;

  const [text] = await db.select().from(textsTable).where(eq(textsTable.id, textId)).limit(1);
  if (!text) {
    res.status(404).json({ error: "Text not found" });
    return;
  }

  const { throughParagraphIndex, entries } = await aggregateVocabulary(req.userId!, textId);
  if (entries.length === 0) {
    res.json({ textId, throughParagraphIndex, cards: [] });
    return;
  }

  // Look up already-enriched words for this text.
  const normalizedWords = entries.map((e) => e.normalized);
  const cached = await db
    .select()
    .from(flashcardsTable)
    .where(and(eq(flashcardsTable.textId, textId), inArray(flashcardsTable.word, normalizedWords)));

  const cachedMap = new Map(cached.map((c) => [c.word, c]));
  const missing = entries.filter((e) => !cachedMap.has(e.normalized));

  if (missing.length > 0) {
    const release = beginForeground();
    try {
      for (let i = 0; i < missing.length; i += ENRICH_BATCH) {
        const batch = missing.slice(i, i + ENRICH_BATCH);
        const enriched = await enrichVocabulary(
          text.language,
          batch.map((e) => ({ word: e.original, translation: e.translation }))
        );
        // Correlate by normalized word identity, not array position, so a
        // reordered or partial AI response never binds the wrong meaning to a
        // word. Words the AI dropped are simply skipped and retried next time.
        const byNorm = new Map(enriched.map((en) => [normalizeWord(en.word), en]));
        const rows = batch
          .map((e) => {
            const en = byNorm.get(e.normalized);
            if (!en) return null;
            return {
              textId,
              word: e.normalized,
              displayWord: e.original,
              definition: en.definition,
              icon: en.icon,
              inflection: en.inflection,
              important: en.important,
            };
          })
          .filter((r): r is NonNullable<typeof r> => r !== null);
        if (rows.length === 0) continue;
        const inserted = await db
          .insert(flashcardsTable)
          .values(rows)
          .onConflictDoNothing({ target: [flashcardsTable.textId, flashcardsTable.word] })
          .returning();
        for (const row of inserted) cachedMap.set(row.word, row);
        // Cover rows skipped by conflict (already inserted by a concurrent request).
        for (const row of rows) {
          if (!cachedMap.has(row.word)) {
            const [existing] = await db
              .select()
              .from(flashcardsTable)
              .where(and(eq(flashcardsTable.textId, textId), eq(flashcardsTable.word, row.word)))
              .limit(1);
            if (existing) cachedMap.set(existing.word, existing);
          }
        }
      }
    } catch (err) {
      req.log.error({ err }, "Failed to enrich vocabulary flashcards");
      res.status(502).json({ error: "Could not build flashcards right now. Please try again." });
      return;
    } finally {
      release();
    }
  }

  const cards = entries
    .map((e) => {
      const card = cachedMap.get(e.normalized);
      if (!card || !card.important) return null;
      return {
        word: card.displayWord,
        definition: card.definition,
        icon: card.icon,
        inflection: card.inflection,
        count: e.count,
        firstParagraphIndex: e.firstParagraphIndex,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  res.json({ textId, throughParagraphIndex, cards });
});

export default router;
