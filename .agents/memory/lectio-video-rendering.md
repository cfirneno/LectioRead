---
name: Lectio video rendering / export limits
description: Why narrated Lectio videos can't be re-rendered in the agent container, and the architecture differences between the video artifacts.
---

# Re-rendering Lectio narrated videos

**Rule:** Do NOT try to re-render/re-export the Lectio narrated videos from the agent/build container. Use the Replit **preview pane export** (per the `artifacts` skill: "video-js is exported from the preview pane") — that render runs in the user's browser with real GPU.

**Why:** The container has no GPU. The video scenes use full-screen `blur-[120px]` gradient layers that are catastrophically expensive under software GL (SwiftShader/llvmpipe). Measured in this env: page renders at ~1.3 fps (best GL backend ~2.9 fps), a single 1920x1080 screenshot takes ~5.5s. Real-time puppeteer/CDP screencast capture yields ~1 fps (slideshow). Deterministic frame-stepping would take hours per video. All non-viable.

**How to apply:** When a narrated video needs a corrected mp4 (e.g. after a timing fix), the user must re-export it from the preview pane, then those files replace `exports/<slug>.mp4` and `artifacts/lectio/public/videos/<slug>.mp4` (published download copies). The agent cannot trigger the preview-pane export programmatically.

## Drift bug + fix

- Pre-fix recordings were timer-driven; under heavy render the per-scene `setTimeout`s fired late, so visuals fell behind the constant-rate muxed audio (Hector ended ~10s behind). Fix (the `driveFromAudio` / `sceneStartsSec` audio-clock approach) makes audio the master clock: each frame picks the scene whose cumulative-duration window contains `audio.currentTime`. Re-export after the fix to correct sync.
- **The export/recording path MUST be audio-clock too — NOT timer-driven.** This is the whole point of the fix. So `driveFromAudio` must be `started` (or `true`), never gated by `&& !isRecording`. A `VideoTemplate` that drives recording from timers will export drift even though interactive preview looks fine. When recording there is no user gesture, so each `VideoTemplate` also needs an `isRecording` effect that plays the narration from `currentTime=0` (the recorder launches Chromium with autoplay allowed) — that playback is what the audio clock reads. Reference impl: `lectio-iliad-intro`.
- `VideoWithControls` must default `muted` to `isIframed` (not `false`), so the embedded canvas preview never leaks sound now that recording-autoplay exists; the export branch (`!isIframed`) stays unmuted.

## ffmpeg re-timing salvage is NOT viable

Tried detecting scene boundaries in a baked mp4 to time-warp the video track onto the audio. The cross-dissolves between scenes are so gradual that ffmpeg scene detection finds ~0 boundaries even at threshold 0.04. No reliable boundaries → no salvage.

## Architecture across the video artifacts (all now audio-clock)

- `lectio-iliad-intro`, `lectio-laocoon`, and `lectio-intro` all now use the same audio-clock master: `useVideoPlayer({ driveFromAudio, audioRef })`, scene chosen from `audio.currentTime`. Their `hooks.ts` are identical (the enhanced version with `driveFromAudio`/`active`/`audioRef`).
- `lectio-intro` (aeneid-intro) was the last holdout — it used to advance scenes on `setTimeout` and *seek the audio to follow the scene* (`audio.currentTime = SCENE_START_SEC[scene]`). That `SCENE_START_SEC` audio-seek approach was removed; it now drives scenes from the audio clock like the others. If you see `SCENE_START_SEC`/`AUDIO_SEEK_EPSILON_SEC` reappear in a video template, the drift fix has been regressed.
