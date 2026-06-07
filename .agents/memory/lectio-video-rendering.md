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
- File dates in `exports/` reveal fix state: iliad-intro.mp4 (after the fix timestamp) is correct; the others exported earlier carry the old drift.

## ffmpeg re-timing salvage is NOT viable

Tried detecting scene boundaries in a baked mp4 to time-warp the video track onto the audio. The cross-dissolves between scenes are so gradual that ffmpeg scene detection finds ~0 boundaries even at threshold 0.04. No reliable boundaries → no salvage.

## Architecture differs across the video artifacts

- `lectio-iliad-intro` and `lectio-laocoon`: audio-clock master — `useVideoPlayer({ driveFromAudio })` + `audioRef`; scene chosen from `audio.currentTime` (the fixed approach). `audioSrc` lives in each video's `config.ts`.
- `lectio-intro` (aeneid-intro): older/different — scenes advance on `setTimeout` timers and the **audio is seeked to follow the visible scene** (`audio.currentTime = SCENE_START_SEC[scene]`). Audio re-aligns at each scene boundary, so its failure mode is audio jumps/repeats, not cumulative drift. It was never converted to the audio-clock approach.
