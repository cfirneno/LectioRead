---
name: Production migrations gap
description: Why drizzle push in dev is not enough — production needs idempotent SQL in migrate.ts
---

# Schema changes must be added in two places

`pnpm --filter @workspace/db run push` (drizzle push) only updates the **dev**
database. Production does NOT run drizzle push. Instead the API server runs
`runIdempotentMigrations()` (in `artifacts/api-server/src/lib/migrate.ts`) at
startup, executing hand-written idempotent SQL (`CREATE TABLE IF NOT EXISTS`,
`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, `CREATE [UNIQUE] INDEX IF NOT EXISTS`).

**Rule:** every new table, column, or index added to `lib/db/src/schema/` must
ALSO be added as idempotent SQL in `migrate.ts`, or the published app will throw
`relation/column does not exist` at runtime even though dev works fine.

**Why:** this gap is invisible in dev. It bit both the flashcards table and the
paragraphs `audio` column — both worked in dev (pushed) but were missing from
migrate.ts, so production would have crashed on those endpoints.
