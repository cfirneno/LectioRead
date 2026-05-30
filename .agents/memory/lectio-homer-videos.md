---
name: Lectio Homer videos — multi-video in one artifact
description: How the four narrated Greek videos share one video-js artifact via routes, and the audio-as-clock duration contract.
---

# Lectio Homer videos

The four narrated Greek passages (Iliad opening, Iliad XXII Hector, Odyssey opening, Odyssey IX Cyclops) all live in ONE video-js artifact (`lectio-iliad-intro`, titled "Lectio — Homer"), not four artifacts.

**Why:** the project caps at 7 artifacts. Consolidating avoids hitting the cap; the user explicitly chose this over deleting anything.

**How to apply:**
- Each video is a `VideoConfig` in `src/videos/<slug>/config.ts`; all are aggregated in `src/videos/registry.ts` (`VIDEOS` array drives menu order; `VIDEOS_BY_SLUG` drives routing). To add a video: write its config, import it in registry, done.
- wouter routes: `/` = menu, `/:slug` resolves via `VIDEOS_BY_SLUG`, unknown slug redirects home.
- Each config's `durations` (keys `scene1..scene10`) MUST sum to the narration mp3 length — the mp3 is the master audio clock. Within ~0.05s codec drift is fine. Build the mp3 with assemble_narration.mjs, then set the per-scene windows to its segment lengths.
- Greek-reveal scenes split the line into per-word `<motion.span>` revealed by a phase timer; reveals settle well before the scene window ends. Keep glosses as plain declarative English.
- End-card CTA href deep-links into the reader: `/app/start/<catalogKey>` (URL-encode spaces), catalog keys live in api-server seeder.ts. See lectio-deep-links.md.
- Do NOT modify `src/lib/video/hooks.ts`; pre-existing DOM-lib typecheck errors in hooks.ts/animations.ts/main.tsx are the known template baseline — app runs via Vite regardless. Verify with `validate-recording.sh`.
