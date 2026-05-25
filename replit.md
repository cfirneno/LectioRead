# Lectio — Foreign Language Reader

A structured immersion reader for learning classical languages by working through original texts. Uses a 5-stage progressive exposure cycle per paragraph to build reading fluency.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/lectio run dev` — run the frontend (port 19814)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI via Replit AI Integrations

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui, wouter routing
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- AI: OpenAI gpt-5.4 via Replit AI Integrations (text search, interlinear translation, full translation)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — DB schema: `texts.ts`, `paragraphs.ts`, `progress.ts`
- `artifacts/api-server/src/routes/` — Express routes: `texts.ts`, `paragraphs.ts`, `progress.ts`
- `artifacts/api-server/src/lib/ai.ts` — AI helpers: text search, interlinear + full translation
- `artifacts/lectio/src/` — React frontend (web)
- `artifacts/lectio-mobile/app/` — Expo Router native mobile app (iOS/Android)
- `lib/integrations-openai-ai-server/` — OpenAI server SDK wrapper

## Architecture decisions

- AI generates interlinear translations as JSON arrays of `{original, translation}` word pairs, stored as JSON text in the DB so they never need to be regenerated.
- Full translations are also cached in the DB on first generation.
- The 5-stage reading cycle is managed entirely on the frontend as local state — no server round-trips between stages except for the lazy-generated translations.
- Paragraphs are fetched from public-domain sources via GPT on-demand; the AI returns the original-language text split into natural paragraph units.
- Progress is stored per (textId, paragraphIndex) and upserted so re-reading is safe.

## Product

- Home: search for any public-domain text by title/author/chapter; browse library with progress
- Table of Contents: paragraph list with completion indicators
- Reading screen: 5-stage cycle — original → interlinear → original → side-by-side → original → "I got it" / "Try again"

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- Run `pnpm run typecheck:libs` to rebuild composite libs before typechecking leaf packages
- The AI text search can take 5-10 seconds on first request

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
