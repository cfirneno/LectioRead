import OpenAI from 'openai';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const client = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const OUT_DIR = process.argv[2];
if (!OUT_DIR) throw new Error('pass output dir');
fs.mkdirSync(OUT_DIR, { recursive: true });

// Scene narration. Greek embedded in narrative prose (never imperative-first).
const SCENES = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));

const SYSTEM = `You are a measured, cinematic documentary narrator with a warm, resonant voice. Read the user's text aloud EXACTLY as written, word for word, adding nothing and omitting nothing. Speak slowly and deliberately, with gravitas, as if narrating a prestige history documentary. Pronounce all Ancient Greek words clearly and correctly in a scholarly Greek pronunciation. Do not announce yourself, do not comment, just read the text as narration.`;

const results = [];
for (const sc of SCENES) {
  process.stdout.write(`Generating ${sc.key}... `);
  const resp = await client.chat.completions.create({
    model: 'gpt-audio',
    modalities: ['text', 'audio'],
    audio: { voice: 'onyx', format: 'mp3' },
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: sc.text },
    ],
  });
  const audio = resp.choices?.[0]?.message?.audio;
  if (!audio?.data) {
    console.log('NO AUDIO', JSON.stringify(resp.choices?.[0]?.message)?.slice(0, 200));
    continue;
  }
  const mp3Path = path.join(OUT_DIR, `${sc.key}.mp3`);
  fs.writeFileSync(mp3Path, Buffer.from(audio.data, 'base64'));
  const dur = parseFloat(
    execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${mp3Path}"`).toString().trim()
  );
  console.log(`${dur.toFixed(2)}s`);
  results.push({ key: sc.key, dur, mp3Path, intended: sc.text });
}

// Transcribe each to verify
console.log('\n=== TRANSCRIPTIONS ===');
for (const r of results) {
  try {
    const tr = await client.audio.transcriptions.create({
      model: 'gpt-4o-transcribe',
      file: fs.createReadStream(r.mp3Path),
    });
    console.log(`\n[${r.key}] (${r.dur.toFixed(2)}s)\n  INTENDED:   ${r.intended}\n  TRANSCRIBED: ${tr.text}`);
  } catch (e) {
    console.log(`[${r.key}] transcribe error: ${e.message}`);
  }
}

console.log('\n=== DURATIONS JSON ===');
console.log(JSON.stringify(results.map((r) => ({ key: r.key, dur: r.dur })), null, 2));
