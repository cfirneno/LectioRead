import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

// Usage: node assemble_narration.mjs <DIR_WITH_sceneN.mp3> [PAD_SEC]
// Builds <DIR>/host_narration_full.mp3 where each scene occupies a window of
// (segment_duration + PAD) rounded up to 0.1s. Prints SCENE_DURATIONS (ms),
// whose sum equals the assembled mp3 length (audio is the master clock).
const DIR = process.argv[2];
const PAD = parseFloat(process.argv[3] ?? '1.1');
if (!DIR) throw new Error('pass dir containing sceneN.mp3 files');

const keys = fs
  .readdirSync(DIR)
  .filter((f) => /^scene\d+\.mp3$/.test(f))
  .sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]))
  .map((f) => f.replace('.mp3', ''));

if (!keys.length) throw new Error('no sceneN.mp3 files found in ' + DIR);

const dur = (p) =>
  parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${p}"`).toString().trim());

const windows = keys.map((k) => {
  const seg = dur(path.join(DIR, `${k}.mp3`));
  const win = Math.ceil((seg + PAD) * 10) / 10; // round up to 0.1s
  return { key: k, seg, win };
});

const inputs = windows.map((w) => `-i "${path.join(DIR, `${w.key}.mp3`)}"`).join(' ');
const filters = windows
  .map(
    (w, i) =>
      `[${i}:a]aformat=sample_rates=44100:channel_layouts=stereo,apad,atrim=0:${w.win},asetpts=N/SR/TB[a${i}]`,
  )
  .join(';');
const concatIn = windows.map((_, i) => `[a${i}]`).join('');
const filterComplex = `${filters};${concatIn}concat=n=${windows.length}:v=0:a=1[out]`;

const outPath = path.join(DIR, 'host_narration_full.mp3');
execSync(
  `ffmpeg -y ${inputs} -filter_complex "${filterComplex}" -map "[out]" -b:a 192k "${outPath}"`,
  { stdio: 'ignore' },
);

const total = dur(outPath);
const sumWin = windows.reduce((s, w) => s + w.win, 0);

console.log('\n=== per-scene (segment -> window) ===');
windows.forEach((w) => console.log(`${w.key}: ${w.seg.toFixed(2)}s -> ${w.win.toFixed(1)}s`));
console.log(`\nsum(window)=${sumWin.toFixed(1)}s  mp3=${total.toFixed(2)}s`);

const SCENE_DURATIONS = Object.fromEntries(windows.map((w) => [w.key, Math.round(w.win * 1000)]));
console.log('\n=== SCENE_DURATIONS ===');
console.log(JSON.stringify(SCENE_DURATIONS, null, 2));
