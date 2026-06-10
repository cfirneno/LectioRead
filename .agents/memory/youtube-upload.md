---
name: YouTube upload of Lectio videos
description: How the 5 narrated videos get uploaded to the user's YouTube, and the channel-creation blocker.
---

# Uploading the Lectio videos to YouTube

The 5 final in-sync videos live in `exports_synced/*.mp4`. They are uploaded to the
user's own YouTube via the Replit **youtube** connector (OAuth already connected,
scopes include `youtube.upload`).

## Ready-to-run uploader
- `scripts/src/yt-upload.mjs` — one-shot, idempotent. `cd scripts && node src/yt-upload.mjs`.
- Auth: `@replit/connectors-sdk` `ReplitConnectors().proxy("youtube", path)` — works from a
  plain node process (CONN_HOST + REPL_IDENTITY env present), not just the code_execution sandbox.
- Uploads as **private**, skips any title already on the channel, prints watch URLs.
- Resumable upload: init via proxy `POST /upload/youtube/v3/videos?uploadType=resumable` →
  read `location` header → plain `fetch` PUT of bytes to that self-authorizing session URL.

## The real blocker (not the videos, not auth)
- The connected Google account has **0 YouTube channels**. YouTube rejects uploads with
  `youtubeSignupRequired` (surfaces as 401) until the account owner creates a channel.
- **Why:** only the Google account owner can create a channel — the agent cannot.
- **How to apply:** when the user says the channel exists, just run the script; it auto-detects
  the channel (`channels.list mine=true` totalResults>0) and uploads. If still 0, it exits 0
  with "no channel yet" — safe to re-run anytime.

## Quota note
- The connector shares a Google project quota; `channels.list` may intermittently 403
  `quotaExceeded` even though auth is fine. Upload (videos.insert) costs ~1600 units each.
  Retry later if quota-blocked.

## Decision: no scheduled-deployment poller
- Considered a cron/scheduled deployment to auto-upload when the channel appears. Rejected:
  no job-type artifact, requires the user to publish a paid service, and the upload path can't
  be tested until a channel exists → high silent-failure risk. Chose the proven one-command
  run triggered when the user confirms the channel is made.
