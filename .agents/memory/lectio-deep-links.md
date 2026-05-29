---
name: Lectio text deep links
description: How to link directly to a specific seeded text's reading screen (e.g. from the intro videos)
---

To open a specific text at paragraph 0, link to `/app/start/<catalogKey>` (URL-encode spaces, e.g. `Aeneis%20II`). The StartReading page resolves the stable `catalogKey` to the text's serial id via the texts list, then redirects to `/texts/:id/read/0`; falls back to `/app` if not found.

**Why:** text `id` is an auto-increment serial — NOT stable across environments/re-seeds, so never hardcode it in a link. `catalogKey` equals the seeder's catalog item title (e.g. `Aeneis`, `Aeneis II`) and IS stable, so it's the correct deep-link key. The generic `/app/continue` resumes the user's last-read text (wrong target when you want a specific one).

**How to apply:** if you expose a new deep link to a text, key it by `catalogKey` (it must be returned by the texts list response). The two intro videos use this: lectio-intro → `Aeneis`, lectio-laocoon → `Aeneis II`.
