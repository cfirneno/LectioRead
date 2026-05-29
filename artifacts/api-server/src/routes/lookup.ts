import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import * as cheerio from "cheerio";
import { generateWordAnalysis } from "../lib/ai";

const router: IRouter = Router();

type Analysis = { lemma?: string; features: Array<{ label: string; value: string }> };

// Simple in-memory rate limit: per-IP token bucket-ish, fixed window.
// Lookups are cheap but proxy outbound calls + parse HTML — keep abuse low.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_PER_IP = 60;
const RATE_LIMIT_GLOBAL = 600;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
let globalBucket = { count: 0, resetAt: Date.now() + RATE_LIMIT_WINDOW_MS };

function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const now = Date.now();
  if (now > globalBucket.resetAt) {
    globalBucket = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }
  globalBucket.count++;
  if (globalBucket.count > RATE_LIMIT_GLOBAL) {
    res.status(429).json({ error: "Too many lookups, slow down." });
    return;
  }

  const ip = (req.ip || req.socket.remoteAddress || "unknown").toString();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else {
    bucket.count++;
    if (bucket.count > RATE_LIMIT_PER_IP) {
      res.status(429).json({ error: "Too many lookups from this address." });
      return;
    }
  }

  // Opportunistic GC so the map doesn't grow unbounded.
  if (rateBuckets.size > 5000) {
    for (const [k, v] of rateBuckets) {
      if (now > v.resetAt) rateBuckets.delete(k);
    }
  }
  next();
}

function stripMacrons(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Perseus's Greek morphology tool only matches Beta Code, not Unicode Greek.
// Convert a Unicode Greek word to plain (un-accented) Beta Code letters,
// which is enough for Perseus to find the lemma.
const GREEK_BETA: Record<string, string> = {
  α: "a", β: "b", γ: "g", δ: "d", ε: "e", ζ: "z", η: "h", θ: "q",
  ι: "i", κ: "k", λ: "l", μ: "m", ν: "n", ξ: "c", ο: "o", π: "p",
  ρ: "r", σ: "s", ς: "s", τ: "t", υ: "u", φ: "f", χ: "x", ψ: "y", ω: "w",
};
function greekToBetaCode(s: string): string {
  const stripped = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  let out = "";
  for (const ch of stripped) out += GREEK_BETA[ch] ?? ch;
  return out;
}

function detectPerseusLang(lang: string): "la" | "greek" | null {
  const l = lang.toLowerCase();
  if (/lat/.test(l)) return "la";
  if (/greek|ἑλλην|ελλην|hellen/.test(l)) return "greek";
  return null;
}

function parsePerseusHtml(html: string): Analysis[] {
  const $ = cheerio.load(html);
  const analyses: Analysis[] = [];

  // Perseus structure: div.analysis > div.lemma (one per headword) >
  //   div.lemma_header > h4.la (lemma) + span.lemma_definition (gloss)
  //   table > tr > td (form) + td (parse string)
  // There can be multiple div.lemma per analysis (homographs) and multiple
  // <tr> rows per table (multiple parse possibilities for the same lemma).
  $("div.analysis div.lemma").each((_i, lemmaDiv) => {
    const $l = $(lemmaDiv);
    const lemma = $l.find("h4").first().text().trim() || undefined;
    const definition = $l
      .find("span.lemma_definition")
      .first()
      .text()
      .trim()
      .replace(/\s+/g, " ");

    $l.find("table tr").each((_j, tr) => {
      const cells = $(tr).find("td");
      if (cells.length < 2) return;
      const form = $(cells[0]).text().trim();
      const parse = $(cells[1]).text().trim().replace(/\s+/g, " ");
      if (!parse) return;
      const features: Array<{ label: string; value: string }> = [];
      if (form) features.push({ label: "Form", value: form });
      features.push({ label: "Parse", value: parse });
      if (definition) features.push({ label: "Meaning", value: definition });
      analyses.push({ lemma, features });
    });

    // If no table rows were captured but we still have a lemma/definition,
    // surface at least the meaning so users see something useful.
    if (
      lemma &&
      definition &&
      !analyses.some((a) => a.lemma === lemma && a.features.length > 0)
    ) {
      analyses.push({ lemma, features: [{ label: "Meaning", value: definition }] });
    }
  });

  return analyses;
}

router.get("/lookup", rateLimit, async (req, res) => {
  const rawWord = typeof req.query.word === "string" ? req.query.word : "";
  const rawLang = typeof req.query.lang === "string" ? req.query.lang : "";
  const word = rawWord.trim();
  const lang = rawLang.trim();
  if (!word || !lang) {
    res.status(400).json({ error: "Missing word or lang" });
    return;
  }
  if (word.length > 64 || lang.length > 64) {
    res.status(400).json({ error: "Word or lang too long" });
    return;
  }

  const perseusLang = detectPerseusLang(lang);

  if (perseusLang) {
    // Latin: strip macrons. Greek: convert Unicode to Beta Code (Perseus
    // morph only accepts Beta Code for Greek lookups).
    const queryWord =
      perseusLang === "la" ? stripMacrons(word) : greekToBetaCode(word);
    const cleaned = queryWord.replace(/[^\p{L}\p{M}'’\-]/gu, "");
    // Punctuation-stripped form that preserves the original script/accents,
    // used for the AI fallback and the Wiktionary "Open full entry" link.
    const displayWord = word.replace(/[^\p{L}\p{M}'’\-]/gu, "");
    const sourceUrl = `https://www.perseus.tufts.edu/hopper/morph?l=${encodeURIComponent(cleaned)}&la=${perseusLang}`;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const resp = await fetch(sourceUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Lectio/1.0 (+https://lectioread.com)",
          "Accept": "text/html,application/xhtml+xml",
        },
      });
      clearTimeout(timer);

      if (resp.ok) {
        const html = await resp.text();
        const analyses = parsePerseusHtml(html);
        if (analyses.length > 0) {
          res.json({ word, language: lang, source: "perseus", sourceUrl, analyses });
          return;
        }
        // Perseus reachable but returned no parse — fall through to AI.
        req.log.info({ word, lang }, "Perseus returned no parse; trying AI fallback");
      } else {
        req.log.warn({ status: resp.status, word, lang }, "Perseus returned non-200; trying AI fallback");
      }
    } catch (err) {
      req.log.warn({ err, word, lang }, "Perseus lookup failed; trying AI fallback");
    }

    // Perseus unavailable or unhelpful → AI-generated morphology fallback so
    // the grammar lookup keeps working during Perseus outages.
    const wiktionaryUrl = `https://en.wiktionary.org/wiki/${encodeURIComponent(displayWord)}`;
    try {
      // Cap tail latency: if the model is slow, give up rather than risk a
      // gateway timeout. The dangling AI promise settles and is ignored.
      const analyses = await Promise.race([
        generateWordAnalysis(displayWord, lang),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("AI analysis timed out")), 12000)
        ),
      ]);
      if (analyses.length > 0) {
        res.json({ word, language: lang, source: "ai", sourceUrl: wiktionaryUrl, analyses });
        return;
      }
      // No parse from either source — return an empty (but successful) result.
      res.json({ word, language: lang, source: "none", sourceUrl: wiktionaryUrl, analyses: [] });
      return;
    } catch (err) {
      req.log.warn({ err, word, lang }, "AI word-analysis fallback failed");
      res.status(502).json({ error: "Lookup unavailable", sourceUrl: wiktionaryUrl });
      return;
    }
  }

  // Non-Perseus languages: return an empty result with a Wiktionary fallback URL.
  const sourceUrl = `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}`;
  res.json({ word, language: lang, source: "wiktionary", sourceUrl, analyses: [] });
});

export default router;
