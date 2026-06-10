---
name: Lectio per-language translation cache
description: How interlinear/full translations are cached per chosen language, and why catalog cleanup must not delete by language.
---

# Per-language translation cache

Readers can pick ANY gloss/translation language (free-typed dropdown). Caching is split:
- **Default language** (`text.targetLanguage ?? "English"`): legacy single columns `paragraphs.interlinearTranslation` / `paragraphs.fullTranslation` (preserves pre-existing backfilled data).
- **Any other language**: `paragraph_translations` table keyed `(paragraphId, kind 'interlinear'|'full', language)`, unique on the three.

**Cache key must be normalized** (`language.toLowerCase()` after trim) for both read and write, or "Spanish"/"spanish"/" spanish " fragment into separate rows. The nice-cased value is still passed to the AI prompt; only the DB key is lowercased.

**Why:** the request body carries an arbitrary user-typed language; without a canonical key the cache silently regenerates and re-pays for the same language.

# Catalog cleanup safety

`cleanBrokenCatalogEntries()` runs at server boot. It must delete ONLY genuinely broken placeholder rows (description/title contains "cannot provide" / "under copyright"). **Never delete by `language = 'english'`** — English is now a first-class library language (British/American sections via `texts.nationality`), so a language-based predicate wipes the real English library every boot.

**How to apply:** if you add a new first-class language to the catalog, audit this cleanup predicate before shipping.
