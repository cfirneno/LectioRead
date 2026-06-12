import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  db,
  textsTable,
  paragraphsTable,
  quizzesTable,
  quizAttemptsTable,
} from "@workspace/db";
import { generateQuiz, generateFullTranslation, type QuizQuestion } from "../lib/ai";
import { requireAuthed, type AuthedRequest } from "../lib/subscriptionGuard";
import { beginForeground } from "../lib/foregroundGate";

const router: IRouter = Router();
router.use(requireAuthed);

type StoredQuiz = {
  paragraphText: string;
  questions: QuizQuestion[];
};

const QUIZ_LENGTH = 5;

function trimQuiz(quiz: StoredQuiz): StoredQuiz {
  return { ...quiz, questions: quiz.questions.slice(0, QUIZ_LENGTH) };
}

async function loadOrCreateQuiz(
  textId: number,
  index: number,
): Promise<{ paragraphId: number; quiz: StoredQuiz } | null> {
  const [paragraph] = await db
    .select()
    .from(paragraphsTable)
    .where(and(eq(paragraphsTable.textId, textId), eq(paragraphsTable.index, index)));
  if (!paragraph) return null;

  const [cached] = await db
    .select()
    .from(quizzesTable)
    .where(
      and(eq(quizzesTable.textId, textId), eq(quizzesTable.paragraphIndex, index)),
    );
  if (cached) {
    return {
      paragraphId: paragraph.id,
      quiz: trimQuiz(JSON.parse(cached.content) as StoredQuiz),
    };
  }

  const [text] = await db.select().from(textsTable).where(eq(textsTable.id, textId));
  if (!text) return null;

  const release = beginForeground();
  try {
    let fullTranslation = paragraph.fullTranslation;
    if (!fullTranslation) {
      fullTranslation = await generateFullTranslation(
        paragraph.originalText,
        text.language,
        text.targetLanguage ?? "English",
      );
      await db
        .update(paragraphsTable)
        .set({ fullTranslation })
        .where(eq(paragraphsTable.id, paragraph.id));
    }

    const generated = await generateQuiz(
      paragraph.originalText,
      fullTranslation,
      text.language,
      text.targetLanguage ?? "English",
    );

    await db
      .insert(quizzesTable)
      .values({
        textId,
        paragraphIndex: index,
        content: JSON.stringify(generated),
      })
      .onConflictDoNothing();

    // Re-read in case a concurrent request beat us to the insert; the
    // canonical cached row is the one the client will be graded against.
    const [canonical] = await db
      .select()
      .from(quizzesTable)
      .where(
        and(eq(quizzesTable.textId, textId), eq(quizzesTable.paragraphIndex, index)),
      );
    const quiz = canonical ? (JSON.parse(canonical.content) as StoredQuiz) : generated;
    return { paragraphId: paragraph.id, quiz: trimQuiz(quiz) };
  } finally {
    release();
  }
}

router.post(
  "/texts/:textId/paragraphs/:index/quiz",
  async (req: AuthedRequest, res): Promise<void> => {
    const textId = Number(req.params.textId);
    const index = Number(req.params.index);
    if (!Number.isInteger(textId) || !Number.isInteger(index)) {
      res.status(400).json({ error: "Invalid params" });
      return;
    }
    const result = await loadOrCreateQuiz(textId, index);
    if (!result) {
      res.status(404).json({ error: "Paragraph not found" });
      return;
    }
    res.json({
      textId,
      paragraphIndex: index,
      paragraphText: result.quiz.paragraphText,
      questions: result.quiz.questions.map((q, i) => ({
        id: i,
        kind: q.kind,
        prompt: q.prompt,
        options: q.options,
      })),
    });
  },
);

router.post(
  "/texts/:textId/paragraphs/:index/quiz/grade",
  async (req: AuthedRequest, res): Promise<void> => {
    const textId = Number(req.params.textId);
    const index = Number(req.params.index);
    if (!Number.isInteger(textId) || !Number.isInteger(index)) {
      res.status(400).json({ error: "Invalid params" });
      return;
    }
    const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
    const chosenById = new Map<number, number>();
    for (const a of answers) {
      if (typeof a?.id === "number" && typeof a?.chosenIndex === "number") {
        chosenById.set(a.id, a.chosenIndex);
      }
    }

    const result = await loadOrCreateQuiz(textId, index);
    if (!result) {
      res.status(404).json({ error: "Paragraph not found" });
      return;
    }

    let score = 0;
    const items = result.quiz.questions.map((q, i) => {
      const chosenIndex = chosenById.has(i) ? (chosenById.get(i) as number) : -1;
      const correct = chosenIndex === q.correctIndex;
      if (correct) score += 1;
      return {
        id: i,
        kind: q.kind,
        prompt: q.prompt,
        options: q.options,
        correctIndex: q.correctIndex,
        chosenIndex,
        correct,
        explanation: q.explanation,
      };
    });
    const total = items.length;

    const missed = items
      .filter((it) => !it.correct)
      .map((it) => ({
        kind: it.kind,
        prompt: it.prompt,
        correctAnswer: it.options[it.correctIndex],
        explanation: it.explanation,
      }));

    await db.insert(quizAttemptsTable).values({
      userId: req.userId!,
      textId,
      paragraphIndex: index,
      score,
      total,
      missedItems: JSON.stringify(missed),
    });

    res.json({ textId, paragraphIndex: index, score, total, items });
  },
);

router.get("/review", async (req: AuthedRequest, res): Promise<void> => {
  const attempts = await db
    .select()
    .from(quizAttemptsTable)
    .where(eq(quizAttemptsTable.userId, req.userId!))
    .orderBy(desc(quizAttemptsTable.createdAt))
    .limit(200);

  if (attempts.length === 0) {
    res.json({ totalAttempts: 0, totalScore: 0, totalPossible: 0, weakItems: [] });
    return;
  }

  const totalAttempts = attempts.length;
  let totalScore = 0;
  let totalPossible = 0;
  for (const a of attempts) {
    totalScore += a.score;
    totalPossible += a.total;
  }

  const textIds = new Set(attempts.map((a) => a.textId));
  const textMap = new Map<number, { title: string; language: string }>();
  const allTexts = await db.select().from(textsTable);
  for (const t of allTexts) {
    if (textIds.has(t.id)) {
      textMap.set(t.id, { title: t.englishTitle ?? t.title, language: t.language });
    }
  }

  type Agg = {
    kind: string;
    prompt: string;
    explanation: string;
    correctAnswer: string;
    missedCount: number;
    lastSeenAt: string;
    textId: number;
    paragraphIndex: number;
  };
  const byKey = new Map<string, Agg>();
  for (const a of attempts) {
    let missed: Array<{ kind: string; prompt: string; correctAnswer: string; explanation: string }>;
    try {
      missed = JSON.parse(a.missedItems);
    } catch {
      continue;
    }
    const seenAt = a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt);
    for (const m of missed) {
      const key = `${a.textId}:${m.kind}:${m.prompt}`;
      const existing = byKey.get(key);
      if (existing) {
        existing.missedCount += 1;
      } else {
        byKey.set(key, {
          kind: m.kind,
          prompt: m.prompt,
          explanation: m.explanation ?? "",
          correctAnswer: m.correctAnswer ?? "",
          missedCount: 1,
          lastSeenAt: seenAt,
          textId: a.textId,
          paragraphIndex: a.paragraphIndex,
        });
      }
    }
  }

  const weakItems = Array.from(byKey.values())
    .sort((a, b) => b.missedCount - a.missedCount)
    .slice(0, 50)
    .map((w) => {
      const t = textMap.get(w.textId);
      return { ...w, textTitle: t?.title ?? "" };
    });

  res.json({
    totalAttempts,
    totalScore,
    totalPossible,
    weakItems,
  });
});

export default router;
