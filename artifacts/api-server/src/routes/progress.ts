import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, progressTable } from "@workspace/db";
import { SaveProgressBody } from "@workspace/api-zod";
import { requireAuthed, type AuthedRequest } from "../lib/subscriptionGuard";

const router: IRouter = Router();

router.get("/progress", requireAuthed, async (req: AuthedRequest, res): Promise<void> => {
  const records = await db.select().from(progressTable).where(eq(progressTable.userId, req.userId!));
  res.json(
    records.map((r) => ({
      id: r.id,
      textId: r.textId,
      paragraphIndex: r.paragraphIndex,
      completed: r.completed,
      updatedAt: r.updatedAt.toISOString(),
    }))
  );
});

router.post("/progress", requireAuthed, async (req: AuthedRequest, res): Promise<void> => {
  const parsed = SaveProgressBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { textId, paragraphIndex, completed } = parsed.data;
  const userId = req.userId!;

  const [existing] = await db
    .select()
    .from(progressTable)
    .where(
      and(
        eq(progressTable.userId, userId),
        eq(progressTable.textId, textId),
        eq(progressTable.paragraphIndex, paragraphIndex)
      )
    );

  if (existing) {
    const [updated] = await db
      .update(progressTable)
      .set({ completed, updatedAt: new Date() })
      .where(eq(progressTable.id, existing.id))
      .returning();
    res.json({
      id: updated.id,
      textId: updated.textId,
      paragraphIndex: updated.paragraphIndex,
      completed: updated.completed,
      updatedAt: updated.updatedAt.toISOString(),
    });
    return;
  }

  const [created] = await db
    .insert(progressTable)
    .values({ userId, textId, paragraphIndex, completed })
    .returning();

  res.json({
    id: created.id,
    textId: created.textId,
    paragraphIndex: created.paragraphIndex,
    completed: created.completed,
    updatedAt: created.updatedAt.toISOString(),
  });
});

export default router;
