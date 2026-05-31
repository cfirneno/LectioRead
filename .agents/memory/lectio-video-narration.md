---
name: Lectio narrated video audio assembly
description: How the Lectio YouTube intro videos assemble their narration track, and the idempotency rule for extending it.
---

# Lectio narrated video narration tracks

The Lectio intro videos (artifacts `lectio-intro`, `lectio-laocoon`, and future episodes) are video-js artifacts whose `<audio>` is one continuous file synced to scenes via the `SCENE_START_SEC` offsets derived from `SCENE_DURATIONS`. Voiceover is generated through OpenAI `gpt-audio` (see media-audio-credits.md — ElevenLabs callbacks are out of credits).

**Rule when extending a video's narration (e.g. appending a read-aloud passage):** keep the original base narration mp3 (`host_narration.mp3`) untouched and write the combined track to a *separate* file (`host_narration_full.mp3`), then point the `<audio src>` at the combined file.

**Why:** the assembly step concatenates with ffmpeg (`[0:a]apad=pad_dur=1[a0];[a0][1:a]concat=n=2:v=0:a=1`). Overwriting the base in place is not idempotent — re-running would keep stacking the appended clip onto an already-extended file. Sourcing from an untouched base every time keeps the operation repeatable.

**How to apply:** when adding a new tail segment (reading, outro, etc.), regenerate `host_narration_full.mp3` from the pristine base + new clip, set each new tail scene's duration so its `SCENE_START_SEC` lands where that audio segment begins (host duration + the silence pad), and leave a small visual tail after the audio ends. Silent trailing scenes (e.g. the interlinear display) are fine — the seek effect just runs past the end of the file.

**Multi-segment "training cycle" endings (read → paragraph → interlinear → read again → close):** because the `<audio>` is seeked to each scene's exact cumulative offset, build `host_narration_full.mp3` as one segment per scene-window, each padded/trimmed to that window's exact length, so every clip lands precisely at its scene. The robust ffmpeg recipe is per-segment `aformat=sample_rates=44100:channel_layouts=stereo,apad,atrim=0:<windowSec>,asetpts=N/SR/TB` (apad handles short clips, atrim caps long ones / trims the base to its scene total), silent scenes use `anullsrc=channel_layout=stereo:sample_rate=44100,atrim=0:<sec>,asetpts=N/SR/TB`, then `concat=n=<k>:v=0:a=1`. For "read it again" generate a Latin-only slow clip (gpt-audio voice onyx) so the English lead-in isn't repeated; reuse the first reading clip for the first pass.

## Lock images to words by making narration the master clock
Driving scenes with independent setTimeout timers while a continuous narration mp3 plays in real time always drifts — visuals and audio slip apart over a ~2.5min video, and per-scene "seek to correct" only produces audible jumps. The mp3 is already assembled so each scene's segment exactly fills its `SCENE_DURATIONS` window (cumulative total == mp3 length), so the boundaries are correct; the problem is the clock, not the offsets.
**Fix:** for interactive playback, derive the visible scene from `audio.currentTime` each frame (rAF) — pick the scene whose cumulative `[start,end)` window contains the time. Then images can't drift from words by construction. Keep timer-driven advancement for the recording/export path (audio may not play headlessly and is muxed in post), gated on the recording-harness presence.
**Why:** repeated attempts to tune `SCENE_DURATIONS` or add drift-correction seeks failed; the non-technical user kept reporting "it slips in a number of places." Audio-as-clock fixed it for good.
**Caveat:** the iframe control-bar (rotated/locked `durations` for scene-jump previews) isn't semantically aligned to the single full track when audio-driven — only enable audio-clock mode for the canonical full-duration ordering.

## Per-scene drift cause: mp3 container duration ≠ decoded duration
When SCENE_DURATIONS are derived from each segment mp3's *container* duration (`ffprobe format=duration`), they overstate the real playback length by the LAME encoder delay+padding (~50ms/segment at 24kHz). Cumulatively the visuals lag the narration more and more toward the end — exactly the "out of sync, slips toward the end" report. Also, building the full track with the **concat demuxer + mp3 re-encode** trims padding at every seam (≈48ms × 2 per inserted file), so boundaries no longer match the inputs.
**Fix (drift-proof):** rebuild `host_narration_full.mp3` from the per-scene segment files using the concat **filter** with `apad` (sample-accurate on decoded audio, no seam loss): `[i]apad=pad_dur=1.0[ai]; [a0]…[a9]concat=n=N:v=0:a=1`. Then set each scene's duration to the segment's **decoded** length (decode to wav, `ffprobe` that) + the pad, NOT the container length. Cumulative total then matches the rebuilt mp3 within a few ms.
**Why:** took several attempts — container-duration math and concat-demuxer rebuilds both left ~0.5s+ of accumulated drift; only decoded-length + apad-filter gave a clean lock.
**How to apply:** any time you (re)assemble a Greek/Latin intro's full narration from segments, use apad+concat filter and decoded-length durations; re-export the mp4 afterward since the timer-driven recording path uses the same SCENE_DURATIONS.

## Don't autoplay narration — gate the whole video behind a play button
Browsers refuse audible autoplay on a cold load, so any "start muted then unmute" / "tap for sound" fallback feels broken to viewers. The durable solution: hold the entire video paused behind a branded start screen with a play button; the click is a real gesture, so visuals + narration launch together and sound is never blocked.
**Why:** repeated autoplay/tap-to-unmute attempts kept regressing and the (non-technical) user explicitly asked to "make it look like the video and sound launch" from a play button.
**How to apply:** give the scene-player hook a way to stay paused until the gesture (an `active` flag whose timer no-ops while paused). Keep an automated-export escape hatch: when a recording/export harness is detected, initialize to active in the state initializer (not a post-mount effect) so frame 0 of the capture is real content, not the start screen. Re-apply the `muted` prop in an effect (not only in the click handler) or live mute toggles won't take effect after start.
