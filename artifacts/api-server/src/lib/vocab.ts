import { eq, and, lte, isNotNull } from "drizzle-orm";
import { db, paragraphsTable, progressTable } from "@workspace/db";

export interface AggregatedVocabEntry {
  original: string;
  normalized: string;
  translation: string;
  count: number;
  firstParagraphIndex: number;
}

export interface AggregatedVocab {
  throughParagraphIndex: number;
  entries: AggregatedVocabEntry[];
}

// Diacritic-insensitive: decompose, strip combining marks, lowercase, trim edge punctuation.
export function normalizeWord(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLocaleLowerCase()
    .replace(/^[\p{P}\p{S}\s]+|[\p{P}\p{S}\s]+$/gu, "")
    .trim();
}

/**
 * Aggregate the running vocabulary for a user in a text: every word seen in the
 * interlinear translations of paragraphs they have completed, deduped by
 * normalized form, with frequency count, first paragraph, and best translation.
 */
export async function aggregateVocabulary(userId: string, textId: number): Promise<AggregatedVocab> {
  const completed = await db
    .select({ paragraphIndex: progressTable.paragraphIndex })
    .from(progressTable)
    .where(
      and(
        eq(progressTable.userId, userId),
        eq(progressTable.textId, textId),
        eq(progressTable.completed, true)
      )
    );

  const maxCompleted = completed.reduce((m, r) => Math.max(m, r.paragraphIndex), -1);
  if (maxCompleted < 0) {
    return { throughParagraphIndex: -1, entries: [] };
  }

  const paragraphs = await db
    .select({
      index: paragraphsTable.index,
      interlinearTranslation: paragraphsTable.interlinearTranslation,
    })
    .from(paragraphsTable)
    .where(
      and(
        eq(paragraphsTable.textId, textId),
        lte(paragraphsTable.index, maxCompleted),
        isNotNull(paragraphsTable.interlinearTranslation)
      )
    )
    .orderBy(paragraphsTable.index);

  type Entry = {
    original: string;
    normalized: string;
    translations: Map<string, number>;
    count: number;
    firstParagraphIndex: number;
  };
  const map = new Map<string, Entry>();

  for (const p of paragraphs) {
    if (!p.interlinearTranslation) continue;
    let words: Array<{ original: string; translation: string }>;
    try {
      words = JSON.parse(p.interlinearTranslation);
    } catch {
      continue;
    }
    for (const w of words) {
      const norm = normalizeWord(w.original ?? "");
      if (!norm || norm.length < 2) continue;
      const tr = (w.translation ?? "").trim();
      if (!tr) continue;
      const existing = map.get(norm);
      if (existing) {
        existing.count += 1;
        existing.translations.set(tr, (existing.translations.get(tr) ?? 0) + 1);
      } else {
        const translations = new Map<string, number>();
        translations.set(tr, 1);
        map.set(norm, {
          original: w.original.trim(),
          normalized: norm,
          translations,
          count: 1,
          firstParagraphIndex: p.index,
        });
      }
    }
  }

  const entries: AggregatedVocabEntry[] = Array.from(map.values())
    .map((e) => {
      let best = "";
      let bestN = 0;
      for (const [t, n] of e.translations) {
        if (n > bestN) {
          best = t;
          bestN = n;
        }
      }
      return {
        original: e.original,
        normalized: e.normalized,
        translation: best,
        count: e.count,
        firstParagraphIndex: e.firstParagraphIndex,
      };
    })
    .sort((a, b) => b.count - a.count || a.original.localeCompare(b.original));

  return { throughParagraphIndex: maxCompleted, entries };
}
