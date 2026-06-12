---
name: Lectio free + donations model
description: Lectio has NO paywall — reading is fully public; monetization is an optional one-time donation. The access tiers and the legacy-subscriber constraint.
---

# Lectio access model (no paywall)

Lectio removed its freemium subscription paywall entirely. There are exactly three
access tiers now:

- **Public (no auth):** all reading and AI features — paragraph list/detail,
  interlinear, translation, scansion, audio, and `POST /texts/search` (paid AI text
  acquisition). Guarded with `attachOptionalUser` only.
- **Signed-in (auth only, NOT subscription):** account-scoped features — progress/
  continue, review/quiz, vocabulary, flashcards, per-text stats. Guarded with
  `requireAuthed`.
- **Donation (optional, no account):** `POST /donate/checkout {amountCents}` →
  Stripe one-time Checkout (`mode: payment`, `submit_type: donate`). No auth, stores
  nothing — Stripe is the record.

Do NOT reintroduce `requireSubscribedUser` / `requirePreviewOrSubscribed` /
`FREE_PREVIEW_PARAGRAPHS` / a `locked` paragraph field — they were deliberately removed.

## Legacy subscribers (do not break)
**Why:** 3 existing $1/mo subscribers predate the change. `POST /subscription/checkout`
was removed (no NEW subs can be created), but `/subscription/me` and
`/subscription/portal` are intentionally kept so those legacy subscribers can still
cancel via the Stripe billing portal. The web Home shows a "Billing" entry only for
users with an active legacy subscription. Don't delete the subscription router.

## Donation amount validation gotcha
**Why:** the OpenAPI spec types `amountCents` as integer (min 100, max 1000000), but
Orval's generated Zod schema (`CreateDonationCheckoutBody`) does NOT emit `.int()`,
so a decimal like `500.5` passes Zod and then fails at Stripe (`unit_amount` must be
integer) as a 500.
**How to apply:** the `/donate/checkout` route adds an explicit
`Number.isInteger(amountCents)` guard after the Zod parse to return a deterministic
400. Keep that guard whenever regenerating client code.

## Mobile kept in sync
Removing the `useCreateCheckoutSession` hook via codegen broke the Expo app's build
and would have left mobile users on a dead paywall (no checkout). Mobile was made
free too: paywall screen deleted, subscription gate removed from the home screen
(sign-in gate only). Keep web and mobile access tiers aligned.
