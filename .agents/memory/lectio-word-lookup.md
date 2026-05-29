---
name: Lectio word/grammar lookup resilience
description: Why the /lookup route must always degrade gracefully and never propagate an upstream failure
---

# Lectio word/grammar lookup (the reading-room "grammar" popover)

The grammar popover calls the API `/lookup` (operationId `lookupWord`) for Latin/Greek,
which proxies the external Perseus (Tufts) morphology service.

**Constraint:** Perseus periodically returns 503 (its own Varnish/"Guru Meditation"
outage page). When it does, the grammar feature has no data and any link back to Perseus
is dead.

**Decision/rule:** `/lookup` must always degrade gracefully — never let an upstream
Perseus failure turn into a hung request (which the production gateway surfaces as a raw
503 "Backend fetch failed" to the user). Concretely: Perseus fetch is bounded by an 8s
abort timeout; on non-200 / unreachable / zero-parse it falls back to an AI-generated
morphology parse (`generateWordAnalysis` in `ai.ts`, gpt-5-mini) returned in the SAME
`WordLookup` shape with `source:"ai"` and a Wiktionary "Open full entry" link; the AI call
itself is capped (~12s race). Terminal failure returns 502 with a Wiktionary `sourceUrl`,
never a Perseus one.

**Why:** A user hit a production 503 using the grammar option purely because Perseus was
down; the app should keep working through external outages.

**How to apply:** Any future change here must keep the response shape stable (frontend
renders `analyses[]` source-agnostically) and must not introduce an unbounded outbound
call on this route.
