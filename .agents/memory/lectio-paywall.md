---
name: Lectio freemium paywall
description: How the free-preview paywall gates content and the 401-vs-402 + Clerk-warmup race the frontend must respect.
---

# Lectio freemium paywall

Model: the first N paragraphs (`FREE_PREVIEW_PARAGRAPHS`) of EVERY text are free and
readable fully anonymously (no sign-in). Beyond N requires an active subscription.

## Server status semantics (the contract the client depends on)
At the preview boundary the subscription guard returns **two different statuses**:
- **401** — no/invalid auth (anonymous reader past the preview).
- **402** — authenticated but not subscribed.

The list route additionally redacts: locked rows blank `originalText` and set
`locked:true`, so non-subscribers never receive locked text via any field.

## Frontend rule (non-obvious, caused a false-paywall bug)
The reader's paragraph query must **wait for Clerk `isLoaded` before firing**
(`enabled: authLoaded && …`). 

**Why:** during Clerk warmup `isSignedIn` is briefly false and no bearer token is
attached, so a legitimately subscribed user's fetch can return a transient 401.
If the client classifies any 401/402 as "end of preview" it flashes the paywall at
a paying user. Gating the query on `isLoaded` makes the token attachment and
`isSignedIn` reliable, so the 401/402 → paywall classification is then safe.

**How to apply:** any reader/content query that can hit the paywall boundary must
gate `enabled` on Clerk readiness. For anon (`isLoaded && !isSignedIn`) a 401 is
definitive — skip retries to show the upsell instantly instead of a long spinner;
for signed-in users keep retrying 401 (transient) and never retry 402.
