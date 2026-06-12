---
name: Lectio educator outreach
description: How the educator-outreach feature is wired — newsletter signup, /educators page, and the automated Resend email blast.
---

# Educator outreach

Four parts: newsletter signup (DB-backed), an `/educators` web page, a starter
contact list, and an automated email sender.

## Email sending (Resend)

- Sends go through the Replit Resend connector via `@replit/connectors-sdk`:
  `connectors.proxy("resend", "/emails", { method: "POST", body: JSON {from,to,subject,html,text,reply_to} })`.
  No API keys handled in code — the proxy injects auth.
- **Sender domain must be verified in Resend (SPF/DKIM DNS) or mail is rejected / spam-filed.**
  Sender is `charles@risxsci.com` → `risxsci.com` is the domain to verify. This is a
  DNS action the owner does in Resend; code can't fix it.
- The blast script is safe-by-default: dry-run unless `--confirm`; `--test` sends one
  preview to the sender only. Idempotency is a JSON sent-log file (not DB) so a script
  crash never double-sends and re-runs skip already-sent addresses.
- **Never fabricate recipient email addresses** — only real, publicly-listed department
  contacts the owner is permitted to email. Cold mass-blasting was flagged as risky.

## Newsletter signup

- Public `POST /subscribe` writes to the `subscribers` table. Endpoint is mounted before
  guarded routers and has its own in-memory per-IP rate limit (public write endpoint).

## Drizzle gotcha — onConflictDoNothing + functional unique index

`onConflictDoNothing({ target })` only accepts column(s), not a SQL expression. The
`subscribers` unique index is on `lower(email)`, which can't be passed as a target.
**Fix:** lowercase the email in app code before insert, then call bare
`onConflictDoNothing()` (no target) — it catches any unique violation.
**Why:** passing `sql\`lower(email)\`` as target is a TS2322 (SQL not assignable to IndexColumn).
