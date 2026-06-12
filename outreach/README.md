# Lectio educator outreach

Tools for announcing lectioread.com to language & classics departments.

## Files

- `contacts.csv` — the recipient list. Columns: `institution,department,country,email`.
  Lines starting with `#` are ignored. **Only add real, publicly-listed department
  contact addresses you are permitted to email.** Do not invent addresses.
- `announcement.mjs` — the email template (subject + HTML + plain text), personalized
  per row with the department / institution.
- `sent-log.json` — created automatically; records who was already emailed so re-runs
  never double-send. Do not edit by hand.

## Sending

Sends go out through Resend from `charles@risxsci.com`, using the `RESEND_API_KEY`
secret (a Resend key starting with `re_`, stored in Replit secrets).

> The domain `risxsci.com` is verified in Resend (SPF/DKIM/DMARC). If sending ever
> starts failing with a domain error, re-check it at resend.com/domains.

Run from the repo root:

```bash
# 1. Dry run (default) — prints exactly who WOULD be emailed, sends nothing:
pnpm --filter @workspace/scripts run outreach:send

# 2. Send a single test to charles@risxsci.com to preview the email:
pnpm --filter @workspace/scripts run outreach:send -- --test

# 3. Real send to everyone in contacts.csv (skips anyone already sent):
pnpm --filter @workspace/scripts run outreach:send -- --confirm

# Optional: cap how many go out in one run (good for warming up a new domain):
pnpm --filter @workspace/scripts run outreach:send -- --confirm --limit 25
```

The script throttles between messages and is safe to re-run — it skips addresses
already in `sent-log.json`.
