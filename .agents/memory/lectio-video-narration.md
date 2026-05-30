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

## Unmuted narration autoplay needs a tap-to-play fallback
The video templates render `<audio autoPlay muted={false}>` and call `audio.play()` per scene. Browsers block unmuted autoplay until a user gesture, so a freshly-opened (esp. published) video plays silently. Do NOT swallow the rejected play() promise.
**How to apply:** on a `play()` rejection that is a `DOMException` with name `NotAllowedError`/`SecurityError`, set a `needsGesture` flag → show a "Tap for sound" overlay AND attach window pointerdown/touchstart/keydown listeners. Gate those listeners on `needsGesture` (not just `!muted`) and have the handler no-op when `!audio.paused`, so a click after sound is already playing can't rewind. Always seek to the current scene's start before play() so unlocking mid-video stays in sync. Ignore non-policy play() errors (transient scene-change aborts) — don't surface the overlay for them.
