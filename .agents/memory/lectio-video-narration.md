---
name: Lectio narrated video audio assembly
description: How the Lectio YouTube intro videos assemble their narration track, and the idempotency rule for extending it.
---

# Lectio narrated video narration tracks

The Lectio intro videos (artifacts `lectio-intro`, `lectio-laocoon`, and future episodes) are video-js artifacts whose `<audio>` is one continuous file synced to scenes via the `SCENE_START_SEC` offsets derived from `SCENE_DURATIONS`. Voiceover is generated through OpenAI `gpt-audio` (see media-audio-credits.md — ElevenLabs callbacks are out of credits).

**Rule when extending a video's narration (e.g. appending a read-aloud passage):** keep the original base narration mp3 (`host_narration.mp3`) untouched and write the combined track to a *separate* file (`host_narration_full.mp3`), then point the `<audio src>` at the combined file.

**Why:** the assembly step concatenates with ffmpeg (`[0:a]apad=pad_dur=1[a0];[a0][1:a]concat=n=2:v=0:a=1`). Overwriting the base in place is not idempotent — re-running would keep stacking the appended clip onto an already-extended file. Sourcing from an untouched base every time keeps the operation repeatable.

**How to apply:** when adding a new tail segment (reading, outro, etc.), regenerate `host_narration_full.mp3` from the pristine base + new clip, set each new tail scene's duration so its `SCENE_START_SEC` lands where that audio segment begins (host duration + the silence pad), and leave a small visual tail after the audio ends. Silent trailing scenes (e.g. the interlinear display) are fine — the seek effect just runs past the end of the file.
