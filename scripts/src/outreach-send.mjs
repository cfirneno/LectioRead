// Automated educator-outreach email sender for Lectio.
// Sends the announcement (outreach/announcement.mjs) to each row in
// outreach/contacts.csv via the Replit Resend connector. Auth is injected by the
// SDK proxy; no API keys are handled here.
//
// SAFE BY DEFAULT — does nothing destructive unless you ask:
//   pnpm --filter @workspace/scripts run outreach:send                 # DRY RUN (prints who would get it)
//   pnpm --filter @workspace/scripts run outreach:send -- --test       # one test mail to charles@risxsci.com
//   pnpm --filter @workspace/scripts run outreach:send -- --confirm    # real send to the whole list
//   pnpm --filter @workspace/scripts run outreach:send -- --confirm --limit 25
//
// Idempotent: addresses already in outreach/sent-log.json are skipped on re-runs.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderEmail } from "../../outreach/announcement.mjs";

// Sends via the Resend HTTP API using the RESEND_API_KEY secret (a key that
// starts with "re_"). The sender domain (risxsci.com) must be verified in Resend.
const RESEND_API_KEY = process.env.RESEND_API_KEY;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const OUTREACH_DIR = path.join(REPO_ROOT, "outreach");
const CONTACTS = path.join(OUTREACH_DIR, "contacts.csv");
const SENT_LOG = path.join(OUTREACH_DIR, "sent-log.json");

const TEST_RECIPIENT = "charles@risxsci.com";
const THROTTLE_MS = 600; // ~1.6 msgs/sec, friendly to Resend rate limits

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const DRY_RUN = !has("--confirm") && !has("--test");
const TEST_ONLY = has("--test");
const limitArg = args.find((a) => a.startsWith("--limit"));
let LIMIT = Infinity;
if (limitArg) {
  const rawLimit = limitArg.includes("=") ? limitArg.split("=")[1] : args[args.indexOf(limitArg) + 1];
  const n = parseInt(rawLimit, 10);
  if (!Number.isInteger(n) || n <= 0) {
    console.error(`Invalid --limit value: ${rawLimit ?? "(missing)"}. Use a positive integer, e.g. --limit 25`);
    process.exit(1);
  }
  LIMIT = n;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseCsv(text) {
  const rows = [];
  const lines = text.split(/\r?\n/);
  let header = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const cells = splitCsvLine(line);
    if (!header) {
      header = cells.map((c) => c.trim().toLowerCase());
      continue;
    }
    const row = {};
    header.forEach((h, i) => (row[h] = (cells[i] ?? "").trim()));
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

function loadSentLog() {
  try {
    const data = JSON.parse(fs.readFileSync(SENT_LOG, "utf8"));
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

function saveSentLog(log) {
  fs.writeFileSync(SENT_LOG, JSON.stringify(log, null, 2) + "\n");
}

function validEmail(e) {
  return typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

async function sendOne({ to, department, institution }) {
  const { subject, html, text, from, replyTo } = renderEmail({ department, institution });
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html, text, reply_to: replyTo }),
  });
  const body = await resp.text();
  let data;
  try { data = body ? JSON.parse(body) : {}; } catch { data = { raw: body }; }
  if (!resp.ok) {
    const msg = data?.message || data?.error || body || `HTTP ${resp.status}`;
    throw new Error(`Resend ${resp.status}: ${msg}`);
  }
  return data?.id || null;
}

async function main() {
  // --- test path: one message to the sender, regardless of contacts.csv ---
  if ((TEST_ONLY || !DRY_RUN) && !RESEND_API_KEY) {
    console.error(
      "RESEND_API_KEY is not set. Add it as a Replit secret (a Resend key that starts with \"re_\") before sending."
    );
    process.exit(1);
  }

  if (TEST_ONLY) {
    console.log(`Sending a single TEST email to ${TEST_RECIPIENT} …`);
    const id = await sendOne({ to: TEST_RECIPIENT, department: "Classics", institution: "Test University" });
    console.log(`✓ Test sent (id: ${id ?? "n/a"}). Check ${TEST_RECIPIENT}.`);
    return;
  }

  if (!fs.existsSync(CONTACTS)) {
    console.error(`No contacts file at ${CONTACTS}`);
    process.exit(1);
  }

  const rows = parseCsv(fs.readFileSync(CONTACTS, "utf8"));
  const log = loadSentLog();

  const valid = [];
  const skipped = { invalid: 0, alreadySent: 0 };
  for (const r of rows) {
    const email = (r.email || "").toLowerCase();
    if (!validEmail(email)) { skipped.invalid++; continue; }
    if (log[email]?.status === "sent") { skipped.alreadySent++; continue; }
    valid.push({ ...r, email });
  }

  console.log("Lectio educator outreach");
  console.log("------------------------");
  console.log(`Contacts parsed:     ${rows.length}`);
  console.log(`Already sent:        ${skipped.alreadySent}`);
  console.log(`Invalid emails:      ${skipped.invalid}`);
  console.log(`Queued this run:     ${valid.length}`);
  if (LIMIT !== Infinity) console.log(`Limit:               ${LIMIT}`);
  console.log(`Mode:                ${DRY_RUN ? "DRY RUN (nothing will be sent)" : "LIVE SEND"}`);
  console.log("");

  if (valid.length === 0) {
    console.log("Nothing to send.");
    return;
  }

  const batch = valid.slice(0, LIMIT);

  if (DRY_RUN) {
    console.log("Would send to:");
    for (const r of batch) {
      console.log(`  • ${r.email}  (${r.department || "?"}, ${r.institution || "?"})`);
    }
    console.log("\nRe-run with --test to preview the email, or --confirm to send for real.");
    return;
  }

  let sent = 0, failed = 0;
  for (const r of batch) {
    try {
      const id = await sendOne({ to: r.email, department: r.department, institution: r.institution });
      log[r.email] = { status: "sent", id, at: new Date().toISOString(), institution: r.institution, department: r.department };
      sent++;
      console.log(`✓ ${r.email}`);
    } catch (err) {
      log[r.email] = { status: "failed", error: String(err?.message || err), at: new Date().toISOString() };
      failed++;
      console.log(`✗ ${r.email} — ${err?.message || err}`);
    }
    saveSentLog(log); // persist after every send so a crash never double-sends
    await sleep(THROTTLE_MS);
  }

  console.log(`\nDone. Sent ${sent}, failed ${failed}. Log: ${SENT_LOG}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
