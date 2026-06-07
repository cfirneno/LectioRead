// Throwaway headless recorder for the narrated video artifacts.
// Captures the clean (non-iframe) export page in realtime via a screenshot
// loop, then muxes the original mp3 so audio + visuals stay locked regardless
// of render fps (the page derives the visible scene from audio.currentTime).
// Delete after use.
//
// Usage:
//   node scripts/record-video.mjs <url> <audioAbsPath> <outAbsPath> <totalSec>

import puppeteer from 'puppeteer-core';
import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const [url, audioPath, outPath, totalSecArg] = process.argv.slice(2);
const totalSec = Number(totalSecArg);

if (!url || !audioPath || !outPath || !totalSec) {
  console.error('args: <url> <audioAbsPath> <outAbsPath> <totalSec>');
  process.exit(1);
}

const log = (m) => { console.log(m); };
const chromium = execSync('which chromium').toString().trim();
const ffmpeg = execSync('which ffmpeg').toString().trim();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rec-'));
fs.mkdirSync(path.dirname(outPath), { recursive: true });

log(`[rec] url=${url}`);
log(`[rec] tmp=${tmp}`);

const browser = await puppeteer.launch({
  executablePath: chromium,
  headless: 'new',
  protocolTimeout: 180000,
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--autoplay-policy=no-user-gesture-required',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--mute-audio',
    '--hide-scrollbars',
    '--window-size=1920,1080',
  ],
  defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
});

const page = await browser.newPage();

await page.evaluateOnNewDocument(() => {
  // Truthy startRecording => VideoTemplate enters recording mode (autoplay +
  // audio-clock scene selection). We don't need its callback for capture.
  window.startRecording = () => Promise.resolve();
  window.stopRecording = () => {};
});

try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
} catch (e) {
  log(`[rec] goto note: ${e.message}`);
}

// Give the app a moment to mount and start the audio.
await new Promise((r) => setTimeout(r, 1500));

if (process.env.KILL_BLUR) {
  await page.addStyleTag({ content: '*{filter:none!important;backdrop-filter:none!important}' });
  log('[rec] blur disabled for render');
}

const frames = [];
const captureSec = totalSec + 0.5;
const t0 = Date.now();
let lastLog = 0;
let lastAudio = -1;

while ((Date.now() - t0) / 1000 < captureSec) {
  const ts = (Date.now() - t0) / 1000;
  let buf;
  try {
    buf = await page.screenshot({ type: 'jpeg', quality: 80 });
  } catch (e) {
    log(`[rec] screenshot error: ${e.message}`);
    break;
  }
  frames.push({ buf, ts });

  const elapsed = Math.floor(ts);
  if (elapsed - lastLog >= 5) {
    lastLog = elapsed;
    let audioT = -1;
    try {
      audioT = await page.evaluate(() => {
        const a = document.querySelector('audio');
        return a ? a.currentTime : -1;
      });
    } catch {}
    lastAudio = audioT;
    const fps = ts > 0 ? (frames.length / ts).toFixed(1) : '0';
    log(`[rec] ${elapsed}s, ${frames.length} frames, ~${fps} fps, audio=${audioT.toFixed?.(1)}`);
  }
}

await browser.close();

if (frames.length < 2) {
  console.error('[rec] FAILED: not enough frames');
  process.exit(2);
}
if (lastAudio <= 1) {
  log(`[rec] WARNING: audio clock did not advance (last=${lastAudio}); scenes may be stuck on scene 1`);
}

const span = frames[frames.length - 1].ts - frames[0].ts;
log(`[rec] captured ${frames.length} frames over ${span.toFixed(1)}s (~${(frames.length / span).toFixed(1)} fps)`);

// Build concat list with per-frame durations from real capture timestamps.
const listLines = [];
for (let i = 0; i < frames.length; i++) {
  const name = `f${String(i).padStart(6, '0')}.jpg`;
  fs.writeFileSync(path.join(tmp, name), frames[i].buf);
  const dur = i < frames.length - 1 ? frames[i + 1].ts - frames[i].ts : 1 / 30;
  listLines.push(`file '${name}'`);
  listLines.push(`duration ${Math.max(dur, 0.001).toFixed(4)}`);
}
listLines.push(`file 'f${String(frames.length - 1).padStart(6, '0')}.jpg'`);
fs.writeFileSync(path.join(tmp, 'list.txt'), listLines.join('\n'));

log('[rec] encoding...');
const args = [
  '-y',
  '-f', 'concat', '-safe', '0', '-i', 'list.txt',
  '-i', audioPath,
  '-map', '0:v', '-map', '1:a',
  '-r', '30',
  '-vf', 'format=yuv420p',
  '-c:v', 'libx264', '-crf', '30', '-preset', 'veryfast',
  '-c:a', 'aac', '-b:a', '128k',
  '-shortest',
  '-movflags', '+faststart',
  outPath,
];
const r = spawnSync(ffmpeg, args, { cwd: tmp, stdio: 'inherit' });
if (r.status !== 0) {
  console.error('[rec] ffmpeg failed');
  process.exit(3);
}

const sizeMB = (fs.statSync(outPath).size / 1e6).toFixed(1);
log(`[rec] DONE -> ${outPath} (${sizeMB} MB)`);
fs.rmSync(tmp, { recursive: true, force: true });
