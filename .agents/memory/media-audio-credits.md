---
name: media-generation audio credits fallback
description: What to do when media-generation audio callbacks (TTS, music, SFX) fail with insufficient-credits.
---

# media-generation audio callbacks can run out of credits

The `media-generation` audio callbacks — `textToSpeech` / `searchVoices` (ElevenLabs) and `generateMusic` / `generateSoundEffect` — can fail with a 401 `quota_exceeded` / `insufficient_credits` error when the audio credit balance is empty. Image generation is a separate quota and may still work.

**Fallback for voiceover/narration:** generate speech with OpenAI's audio model instead of ElevenLabs. The `openai` package resolves inside `lib/integrations-openai-ai-server/`, and the env vars `AI_INTEGRATIONS_OPENAI_BASE_URL` / `AI_INTEGRATIONS_OPENAI_API_KEY` are present in the shell. Use the `gpt-audio` model (e.g. voice `onyx`, mp3 output) to produce an mp3, then copy it into the artifact's `public/audio/`.

**Why:** the standard `video-js` audio reference assumes the audio callbacks work. When they're out of credits there is no in-skill fallback, so the app's own OpenAI integration is the way to still ship narrated audio. There is currently no fallback for background music — if `generateMusic` is out of credits, ship voiceover-only.

**How to apply:** if an audio callback returns `insufficient_credits`, do not retry it; route voiceover through the OpenAI path above and proceed without generated music.
