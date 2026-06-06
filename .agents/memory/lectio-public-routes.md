---
name: Lectio public (unauthenticated) API routes
description: How to add a public API route in api-server without it being 401'd by the subscription guard, and where prod migrations must go.
---

# Adding a public route to the Lectio API server

Most Lectio routers apply `router.use(requireSubscribedUser)` at the router level (texts, paragraphs, quiz, flashcards) or per-route (progress, subscription). There is **no global auth middleware** — Clerk only attaches auth in `app.ts`; gating is per-router.

**Gotcha:** every sub-router is mounted with `router.use(subRouter)` (no path prefix), so in Express each mounted router runs for *every* request that reaches it, in mount order. A router whose top-level middleware is `requireSubscribedUser` will therefore 401 an unrelated public path (e.g. `/visits`) *before* it ever reaches a later-mounted public router. Health works only because it's mounted first and its route matches and ends the chain.

**Rule:** mount public routers (no blanket guard) BEFORE any guarded router in `routes/index.ts`. Putting a public router last is the trap — it appears correct (no guard in its own file) but is shadowed by an earlier guarded router's `router.use`.

**Why:** a public visit-tracker route returned `{"error":"Unauthorized"}` purely because it was mounted after `textsRouter`; reordering it to right after `healthRouter` fixed it with no code change to the route itself.

**How to apply:** new public endpoint → no guard in its route file AND mount it near the top (after health) in `routes/index.ts`. Also remember the prod-migrations gap (see prod-migrations.md): any new table needs idempotent `CREATE TABLE IF NOT EXISTS` + indexes in `api-server/src/lib/migrate.ts`, since `drizzle push` only touches dev.
