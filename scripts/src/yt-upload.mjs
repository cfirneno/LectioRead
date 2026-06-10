// One-shot YouTube uploader for the 5 narrated Lectio videos.
// Uses the Replit YouTube connector (see integrations skill / connector "youtube").
// Auth is injected by the SDK proxy; no tokens are handled here.
// Idempotent: skips any video whose exact title already exists on the channel.
//
// Run:  cd scripts && node src/yt-upload.mjs
//
// Behavior:
//  - If the connected Google account has no YouTube channel yet, it reports that
//    and exits without error (nothing to do until the owner creates a channel).
//  - Otherwise it uploads any of the 5 videos that aren't already present,
//    as PRIVATE, and prints the resulting watch URLs.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ReplitConnectors } from "@replit/connectors-sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const EXPORT_DIR = path.join(REPO_ROOT, "exports_synced");

const JOBS = [
  { file: "aeneid-intro.mp4", title: "The Aeneid — Introduction" },
  { file: "aeneid-laocoon.mp4", title: "The Aeneid — Laocoön (Book II)" },
  { file: "iliad-hector.mp4", title: "The Iliad — Hector" },
  { file: "odyssey-intro.mp4", title: "The Odyssey — Introduction" },
  { file: "odyssey-cyclops.mp4", title: "The Odyssey — The Cyclops" },
];

const DESCRIPTION = "Narrated reading from Lectio.";
const PRIVACY = "private";

const connectors = new ReplitConnectors();

async function ytJson(pathAndQuery, init) {
  const resp = await connectors.proxy("youtube", pathAndQuery, init);
  const txt = await resp.text();
  let data;
  try {
    data = txt ? JSON.parse(txt) : {};
  } catch {
    data = { raw: txt };
  }
  return { status: resp.status, ok: resp.ok, data, headers: resp.headers };
}

async function getMyChannel() {
  const r = await ytJson("/youtube/v3/channels?part=contentDetails&mine=true", {
    method: "GET",
  });
  if (!r.ok) {
    const reason = r.data?.error?.errors?.[0]?.reason || r.data?.error?.message || "";
    return { exists: false, reason, status: r.status };
  }
  const item = r.data?.items?.[0];
  if (!item) return { exists: false, reason: "no_channel" };
  return {
    exists: true,
    uploadsPlaylist: item.contentDetails?.relatedPlaylists?.uploads,
  };
}

async function existingTitles(uploadsPlaylist) {
  const titles = new Set();
  if (!uploadsPlaylist) return titles;
  let pageToken = "";
  do {
    const q = `/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${encodeURIComponent(
      uploadsPlaylist
    )}${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const r = await ytJson(q, { method: "GET" });
    if (!r.ok) break;
    for (const it of r.data.items || []) {
      if (it.snippet?.title) titles.add(it.snippet.title);
    }
    pageToken = r.data.nextPageToken || "";
  } while (pageToken);
  return titles;
}

async function uploadOne(job) {
  const filePath = path.join(EXPORT_DIR, job.file);
  if (!fs.existsSync(filePath)) {
    return { title: job.title, ok: false, error: `missing file ${filePath}` };
  }
  const meta = {
    snippet: { title: job.title, description: DESCRIPTION, categoryId: "27" },
    status: { privacyStatus: PRIVACY, selfDeclaredMadeForKids: false },
  };
  // Step 1: initiate resumable upload (auth injected by proxy).
  const initResp = await connectors.proxy(
    "youtube",
    "/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": "video/mp4",
      },
      body: JSON.stringify(meta),
    }
  );
  if (!(initResp.status >= 200 && initResp.status < 300)) {
    const t = await initResp.text();
    return { title: job.title, ok: false, error: `init ${initResp.status}: ${t.slice(0, 200)}` };
  }
  const uploadUrl = initResp.headers.get("location");
  if (!uploadUrl) {
    return { title: job.title, ok: false, error: "no resumable upload URL returned" };
  }
  // Step 2: upload the bytes to the self-authorizing resumable session URL.
  const bytes = fs.readFileSync(filePath);
  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4", "Content-Length": String(bytes.length) },
    body: bytes,
  });
  const txt = await put.text();
  let data;
  try {
    data = JSON.parse(txt);
  } catch {
    data = { raw: txt };
  }
  if (put.ok && data.id) {
    return { title: job.title, ok: true, id: data.id, url: `https://youtu.be/${data.id}` };
  }
  return { title: job.title, ok: false, error: `put ${put.status}: ${txt.slice(0, 200)}` };
}

async function main() {
  const channel = await getMyChannel();
  if (!channel.exists) {
    console.log(
      `No YouTube channel on the connected account yet (${channel.reason || "none"}). ` +
        "Nothing to upload — create the channel first."
    );
    return;
  }
  const have = await existingTitles(channel.uploadsPlaylist);
  const results = [];
  for (const job of JOBS) {
    if (have.has(job.title)) {
      console.log(`SKIP (already on channel): ${job.title}`);
      results.push({ title: job.title, ok: true, skipped: true });
      continue;
    }
    console.log(`UPLOADING: ${job.title} ...`);
    const r = await uploadOne(job);
    if (r.ok) console.log(`  DONE -> ${r.url} (private)`);
    else console.log(`  FAIL -> ${r.error}`);
    results.push(r);
  }
  const failed = results.filter((r) => !r.ok);
  console.log("\nSUMMARY:");
  for (const r of results) {
    console.log(`  ${r.ok ? (r.skipped ? "skip" : "ok  ") : "FAIL"}  ${r.title}${r.url ? "  " + r.url : ""}`);
  }
  if (failed.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error("FATAL:", e?.stack || e?.message || String(e));
  process.exitCode = 1;
});
