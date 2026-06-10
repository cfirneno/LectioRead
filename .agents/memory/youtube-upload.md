---
name: YouTube upload (Lectio videos)
description: How the 5 Lectio videos got uploaded and the connector-account gotcha that blocked it for hours.
---

# YouTube upload — Lectio

The 5 narrated videos in `exports_synced/*.mp4` are uploaded to Charles's channel
("Charles Firneno", handle @CharlesFirneno-z2h, id UCHsa_7SKpbyvTQpnYmQsA-w) on
cafirneno@gmail.com, all PRIVATE. Uploader: `scripts/src/yt-upload.mjs` (idempotent —
skips titles already on the channel, uploads private, prints youtu.be URLs).

## The gotcha that cost hours: connector bound to the WRONG Google account

Symptom: `channels.list?mine=true` returned 200 with `totalResults=0` no matter how
many times `proposeIntegration` was re-run. Zero channels = the linked account had no
channel. The real cause: Replit's YouTube connection was bound to a *different* Google
account (cfirneno@hotmail) than the one with the channel (cafirneno@gmail.com).

**Why re-running proposeIntegration did NOT switch accounts:** once a connection exists
with status `added`, proposeIntegration is a no-op on the UI — it shows the user NO
Connect button and silently keeps the old account binding. Revoking access on Google's
side (myaccount.google.com/connections) only made the token return 401 Invalid
Credentials; it did NOT let the user pick a new account, because Replit still held the
stale connection record.

**The fix (only thing that worked):** the user must DELETE the connection in the Replit
UI — Integrations panel → YouTube → ⋯ menu → **Delete** (label is "Delete", not
"Disconnect"). That drops it back to a fresh `connector` (status `not_setup`). THEN
`searchIntegrations("YouTube")` returns the connector id, and `proposeIntegration` on
that connector id finally shows a real Connect button + Google account chooser. User
picks the right account → new connection id → `mine=true` returns the channel.

**How to apply:** if a connector is linked to the wrong account and reconnect won't
switch it, don't loop on proposeIntegration or Google-side revoke. Have the user delete
the connection in the Replit Integrations panel, then proposeIntegration the fresh
connector. Account identity can't be read via API (no profile/email scope) — verify by
whether `mine=true` returns the expected channel.

## Channel rename via API does not work

`channels.update?part=brandingSettings` with `brandingSettings.channel.title` returns
200 but the title is unchanged for personal/Google-account-linked channels. Renaming
must be done by the user in YouTube Studio → Customization → Basic info → Publish.
