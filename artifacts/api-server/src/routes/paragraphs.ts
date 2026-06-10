import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, textsTable, paragraphsTable, progressTable, paragraphTranslationsTable } from "@workspace/db";
import {
  ListParagraphsParams,
  GetParagraphParams,
  GetInterlinearTranslationParams,
  GetFullTranslationParams,
  GetScansionParams,
  GetParagraphAudioParams,
} from "@workspace/api-zod";
import {
  generateInterlinearTranslation,
  generateFullTranslation,
  generateScansion,
  generateSpeech,
} from "../lib/ai";
import { requireSubscribedUser, type AuthedRequest } from "../lib/subscriptionGuard";
import { beginForeground } from "../lib/foregroundGate";

const router: IRouter = Router();

router.use(requireSubscribedUser);

router.get("/texts/:textId/paragraphs", async (req: AuthedRequest, res): Promise<void> => {
  const params = ListParagraphsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const paragraphs = await db
    .select()
    .from(paragraphsTable)
    .where(eq(paragraphsTable.textId, params.data.textId))
    .orderBy(paragraphsTable.index);

  const progressRecords = await db
    .select()
    .from(progressTable)
    .where(
      and(
        eq(progressTable.textId, params.data.textId),
        eq(progressTable.userId, req.userId!)
      )
    );

  const progressMap = new Map(
    progressRecords.map((p) => [p.paragraphIndex, p.completed])
  );

  res.json(
    paragraphs.map((p) => ({
      id: p.id,
      textId: p.textId,
      index: p.index,
      originalText: p.originalText,
      completed: progressMap.get(p.index) ?? false,
    }))
  );
});

router.get(
  "/texts/:textId/paragraphs/:index",
  async (req: AuthedRequest, res): Promise<void> => {
    const params = GetParagraphParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [paragraph] = await db
      .select()
      .from(paragraphsTable)
      .where(
        and(
          eq(paragraphsTable.textId, params.data.textId),
          eq(paragraphsTable.index, params.data.index)
        )
      );

    if (!paragraph) {
      res.status(404).json({ error: "Paragraph not found" });
      return;
    }

    const [progressRecord] = await db
      .select()
      .from(progressTable)
      .where(
        and(
          eq(progressTable.userId, req.userId!),
          eq(progressTable.textId, params.data.textId),
          eq(progressTable.paragraphIndex, params.data.index)
        )
      );

    res.json({
      id: paragraph.id,
      textId: paragraph.textId,
      index: paragraph.index,
      originalText: paragraph.originalText,
      completed: progressRecord?.completed ?? false,
      interlinearTranslation: paragraph.interlinearTranslation,
      fullTranslation: paragraph.fullTranslation,
    });
  }
);

router.post(
  "/texts/:textId/paragraphs/:index/interlinear",
  async (req, res): Promise<void> => {
    const params = GetInterlinearTranslationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const requestedLanguage =
      typeof req.body?.language === "string" ? req.body.language.trim() : "";

    const [paragraph] = await db
      .select()
      .from(paragraphsTable)
      .where(
        and(
          eq(paragraphsTable.textId, params.data.textId),
          eq(paragraphsTable.index, params.data.index)
        )
      );

    if (!paragraph) {
      res.status(404).json({ error: "Paragraph not found" });
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

    const defaultLanguage = text.targetLanguage ?? "English";
    const targetLanguage = requestedLanguage || defaultLanguage;
    const isDefault =
      targetLanguage.toLowerCase() === defaultLanguage.toLowerCase();

    // Cache lookup: legacy single column for the default language, per-language
    // table for any other chosen language.
    if (isDefault) {
      if (paragraph.interlinearTranslation) {
        const words = JSON.parse(paragraph.interlinearTranslation);
        res.json({ paragraphId: paragraph.id, originalText: paragraph.originalText, words });
        return;
      }
    } else {
      const [cached] = await db
        .select()
        .from(paragraphTranslationsTable)
        .where(
          and(
            eq(paragraphTranslationsTable.paragraphId, paragraph.id),
            eq(paragraphTranslationsTable.kind, "interlinear"),
            eq(paragraphTranslationsTable.language, targetLanguage)
          )
        );
      if (cached) {
        const words = JSON.parse(cached.content);
        res.json({ paragraphId: paragraph.id, originalText: paragraph.originalText, words });
        return;
      }
    }

    const releaseForeground = beginForeground();
    let words;
    try {
      words = await generateInterlinearTranslation(
        paragraph.originalText,
        text.language,
        targetLanguage
      );
    } finally {
      releaseForeground();
    }

    if (isDefault) {
      await db
        .update(paragraphsTable)
        .set({ interlinearTranslation: JSON.stringify(words) })
        .where(eq(paragraphsTable.id, paragraph.id));
    } else {
      await db
        .insert(paragraphTranslationsTable)
        .values({
          paragraphId: paragraph.id,
          kind: "interlinear",
          language: targetLanguage,
          content: JSON.stringify(words),
        })
        .onConflictDoNothing();
    }

    res.json({
      paragraphId: paragraph.id,
      originalText: paragraph.originalText,
      words,
    });
  }
);

router.post(
  "/texts/:textId/paragraphs/:index/translation",
  async (req, res): Promise<void> => {
    const params = GetFullTranslationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const requestedLanguage =
      typeof req.body?.language === "string" ? req.body.language.trim() : "";

    const [paragraph] = await db
      .select()
      .from(paragraphsTable)
      .where(
        and(
          eq(paragraphsTable.textId, params.data.textId),
          eq(paragraphsTable.index, params.data.index)
        )
      );

    if (!paragraph) {
      res.status(404).json({ error: "Paragraph not found" });
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

    const defaultLanguage = text.targetLanguage ?? "English";
    const targetLanguage = requestedLanguage || defaultLanguage;
    const isDefault =
      targetLanguage.toLowerCase() === defaultLanguage.toLowerCase();

    if (isDefault) {
      if (paragraph.fullTranslation) {
        res.json({
          paragraphId: paragraph.id,
          originalText: paragraph.originalText,
          translatedText: paragraph.fullTranslation,
        });
        return;
      }
    } else {
      const [cached] = await db
        .select()
        .from(paragraphTranslationsTable)
        .where(
          and(
            eq(paragraphTranslationsTable.paragraphId, paragraph.id),
            eq(paragraphTranslationsTable.kind, "full"),
            eq(paragraphTranslationsTable.language, targetLanguage)
          )
        );
      if (cached) {
        res.json({
          paragraphId: paragraph.id,
          originalText: paragraph.originalText,
          translatedText: cached.content,
        });
        return;
      }
    }

    const releaseForeground = beginForeground();
    let translatedText: string;
    try {
      translatedText = await generateFullTranslation(
        paragraph.originalText,
        text.language,
        targetLanguage
      );
    } finally {
      releaseForeground();
    }

    if (isDefault) {
      await db
        .update(paragraphsTable)
        .set({ fullTranslation: translatedText })
        .where(eq(paragraphsTable.id, paragraph.id));
    } else {
      await db
        .insert(paragraphTranslationsTable)
        .values({
          paragraphId: paragraph.id,
          kind: "full",
          language: targetLanguage,
          content: translatedText,
        })
        .onConflictDoNothing();
    }

    res.json({
      paragraphId: paragraph.id,
      originalText: paragraph.originalText,
      translatedText,
    });
  }
);

router.post(
  "/texts/:textId/paragraphs/:index/scansion",
  async (req, res): Promise<void> => {
    const params = GetScansionParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [paragraph] = await db
      .select()
      .from(paragraphsTable)
      .where(
        and(
          eq(paragraphsTable.textId, params.data.textId),
          eq(paragraphsTable.index, params.data.index)
        )
      );

    if (!paragraph) {
      res.status(404).json({ error: "Paragraph not found" });
      return;
    }

    if (paragraph.scansion) {
      res.json({
        paragraphId: paragraph.id,
        originalText: paragraph.originalText,
        scannedText: paragraph.scansion,
      });
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

    if (!/latin|greek|ἑλλην|ελλην/i.test(text.language)) {
      res.status(400).json({ error: "Scansion is only available for Latin and Greek texts" });
      return;
    }

    const releaseForeground = beginForeground();
    let scannedText: string;
    try {
      scannedText = await generateScansion(paragraph.originalText, text.language);
    } finally {
      releaseForeground();
    }

    await db
      .update(paragraphsTable)
      .set({ scansion: scannedText })
      .where(eq(paragraphsTable.id, paragraph.id));

    res.json({
      paragraphId: paragraph.id,
      originalText: paragraph.originalText,
      scannedText,
    });
  }
);

router.post(
  "/texts/:textId/paragraphs/:index/audio",
  async (req, res): Promise<void> => {
    const params = GetParagraphAudioParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [paragraph] = await db
      .select()
      .from(paragraphsTable)
      .where(
        and(
          eq(paragraphsTable.textId, params.data.textId),
          eq(paragraphsTable.index, params.data.index)
        )
      );

    if (!paragraph) {
      res.status(404).json({ error: "Paragraph not found" });
      return;
    }

    if (paragraph.audio) {
      res.json({
        paragraphId: paragraph.id,
        format: "mp3",
        audioBase64: paragraph.audio,
      });
      return;
    }

    const releaseForeground = beginForeground();
    let audioBase64: string;
    try {
      audioBase64 = await generateSpeech(paragraph.originalText);
    } finally {
      releaseForeground();
    }

    await db
      .update(paragraphsTable)
      .set({ audio: audioBase64 })
      .where(eq(paragraphsTable.id, paragraph.id));

    res.json({
      paragraphId: paragraph.id,
      format: "mp3",
      audioBase64,
    });
  }
);

export default router;
