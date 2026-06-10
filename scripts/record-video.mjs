// Throwaway headless recorder for the narrated video artifacts.
// Captures the clean (non-iframe) export page in realtime via a screenshot
// loop, then muxes the original mp3 so audio + visuals stay locked regardless
// of render fps (the page derives the visible scene from audio.currentTime).
// Delete after use.
//
// Backgrounded processes get reaped between tool calls and a full realtime
// capture + encode exceeds the 120s foreground cap, so the run is split into
// two foreground phases via REC_PHASE:
//   REC_PHASE=capture REC_DIR=<dir> node record-video.mjs <url> <audio> <out> <sec>
//   REC_PHASE=encode  REC_DIR=<dir> node record-video.mjs <url> <audio> <out> <sec>
// Default (no REC_PHASE) runs both phases in one process (only for short clips).
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
const PHASE = process.env.REC_PHASE || 'full'; // 'capture' | 'encode' | 'full'

if (!url || !audioPath || !outPath || !totalSec) {
  console.error('args: <url> <audioAbsPath> <outAbsPath> <totalSec>');
  process.exit(1);
}

const log = (m) => { console.log(m); };
const ffmpeg = execSync('which ffmpeg').toString().trim();

// Capture phase writes here; encode phase reads from here.
const tmp = process.env.REC_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'rec-'));

async function capture() {
  const chromium = execSync('which chromium').toString().trim();
  fs.mkdirSync(tmp, { recursive: true });
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

  // Stream each frame to disk immediately so the post-loop work is just
  // writing list.txt — buffering thousands of frames in memory and flushing
  // after the loop overruns the foreground time cap.
  const stamps = []; // capture timestamps, one per written frame
  const captureSec = totalSec + 0.5;
  const t0 = Date.now();
  let lastLog = 0;
  let lastAudio = -1;
  let n = 0;

  while ((Date.now() - t0) / 1000 < captureSec) {
    const ts = (Date.now() - t0) / 1000;
    const name = `f${String(n).padStart(6, '0')}.jpg`;
    try {
      await page.screenshot({ type: 'jpeg', quality: 80, path: path.join(tmp, name) });
    } catch (e) {
      log(`[rec] screenshot error: ${e.message}`);
      break;
    }
    stamps.push(ts);
    n++;

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
      const fps = ts > 0 ? (n / ts).toFixed(1) : '0';
      log(`[rec] ${elapsed}s, ${n} frames, ~${fps} fps, audio=${audioT.toFixed?.(1)}`);
    }
  }

  await browser.close();

  if (stamps.length < 2) {
    console.error('[rec] FAILED: not enough frames');
    process.exit(2);
  }
  if (lastAudio <= 1) {
    log(`[rec] WARNING: audio clock did not advance (last=${lastAudio}); scenes may be stuck on scene 1`);
  }

  const span = stamps[stamps.length - 1] - stamps[0];
  log(`[rec] captured ${stamps.length} frames over ${span.toFixed(1)}s (~${(stamps.length / span).toFixed(1)} fps)`);

  // Build concat list with per-frame durations from real capture timestamps.
  const listLines = [];
  for (let i = 0; i < stamps.length; i++) {
    const name = `f${String(i).padStart(6, '0')}.jpg`;
    const dur = i < stamps.length - 1 ? stamps[i + 1] - stamps[i] : 1 / 30;
    listLines.push(`file '${name}'`);
    listLines.push(`duration ${Math.max(dur, 0.001).toFixed(4)}`);
  }
  listLines.push(`file 'f${String(stamps.length - 1).padStart(6, '0')}.jpg'`);
  fs.writeFileSync(path.join(tmp, 'list.txt'), listLines.join('\n'));
  log(`[rec] frames written to ${tmp}`);
}

function encode() {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  if (!fs.existsSync(path.join(tmp, 'list.txt'))) {
    console.error(`[rec] encode: no list.txt in ${tmp}`);
    process.exit(2);
  }
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
}

if (PHASE === 'capture') {
  await capture();
} else if (PHASE === 'encode') {
  encode();
} else {
  await capture();
  encode();
  fs.rmSync(tmp, { recursive: true, force: true });
}
