// server.js — Lectio freemium access + payment layer
// -----------------------------------------------------------------------------
// What this does:
//   • Serves "free" texts to everyone (no login, no card) — your growth engine.
//   • Gates "paid" texts behind an active Stripe subscription.
//   • Handles subscribe → Stripe Checkout → return → access (signed cookie).
//   • Lets returning subscribers restore access by email.
//
// What you swap in:
//   • Your real texts in texts.js
//   • Your Stripe keys + price ID in Replit "Secrets" (see README)
//   • Your reader rendering (the renderReader() function below is a placeholder
//     — drop your existing Lectio reader markup in there)
// -----------------------------------------------------------------------------

require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const texts = require("./texts");

const app = express();
const PORT = process.env.PORT || 3000;

// --- Config (set these in Replit Secrets) ------------------------------------
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || ""; // your $6/mo recurring price
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const COOKIE_SECRET = process.env.COOKIE_SECRET || "change-me-to-a-long-random-string";
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Stripe is optional at boot so the app still runs before you add keys.
const stripe = STRIPE_SECRET ? require("stripe")(STRIPE_SECRET) : null;

// --- Tiny file-based subscriber store ----------------------------------------
// Maps email -> { customerId, active }. Fine for a small product; swap for a
// real DB (Replit DB, Postgres) once you outgrow it.
const STORE = path.join(__dirname, "subscribers.json");
function readStore() {
  try { return JSON.parse(fs.readFileSync(STORE, "utf8")); } catch { return {}; }
}
function writeStore(d) { fs.writeFileSync(STORE, JSON.stringify(d, null, 2)); }
function setSubscriber(email, customerId, active) {
  const d = readStore();
  d[email.toLowerCase()] = { customerId, active };
  writeStore(d);
}
function isActive(email) {
  const d = readStore();
  return !!(email && d[email.toLowerCase()] && d[email.toLowerCase()].active);
}

// --- Signed access cookie -----------------------------------------------------
function sign(value) {
  const h = crypto.createHmac("sha256", COOKIE_SECRET).update(value).digest("hex");
  return `${value}.${h}`;
}
function verify(signed) {
  if (!signed || !signed.includes(".")) return null;
  const i = signed.lastIndexOf(".");
  const value = signed.slice(0, i), h = signed.slice(i + 1);
  const expected = crypto.createHmac("sha256", COOKIE_SECRET).update(value).digest("hex");
  const a = Buffer.from(h), b = Buffer.from(expected);
  if (a.length !== b.length) return null;           // fail closed on tampering
  return crypto.timingSafeEqual(a, b) ? value : null;
}
function grantAccess(res, email) {
  res.cookie("lectio_access", sign(email.toLowerCase()), {
    httpOnly: true, sameSite: "lax", maxAge: 1000 * 60 * 60 * 24 * 30,
    secure: BASE_URL.startsWith("https"),
  });
}
function currentUser(req) {
  return verify(req.cookies.lectio_access || "");
}

// THE GATE: one function. Use this anywhere you serve protected content.
function canRead(req, text) {
  if (text.tier === "free") return true;
  const email = currentUser(req);
  return isActive(email);
}

// -----------------------------------------------------------------------------
// Stripe webhook MUST be registered before express.json() (it needs raw body).
// -----------------------------------------------------------------------------
app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) return res.json({ ok: true, note: "stripe not configured" });
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  const obj = event.data.object;
  if (event.type === "checkout.session.completed") {
    setSubscriber(obj.customer_details.email, obj.customer, true);
  } else if (event.type === "customer.subscription.deleted") {
    // Mark inactive on cancellation. Look up email by customer id.
    const d = readStore();
    for (const email in d) if (d[email].customerId === obj.customer) d[email].active = false;
    writeStore(d);
  }
  res.json({ received: true });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- Routes ------------------------------------------------------------------
app.get("/", (req, res) => res.send(renderLibrary(req)));

app.get("/read/:slug", (req, res) => {
  const text = texts.find((t) => t.slug === req.params.slug);
  if (!text) return res.status(404).send(page("Not found", "<p>That text doesn't exist.</p>"));
  if (!canRead(req, text)) return res.redirect(`/subscribe?next=${text.slug}`);
  res.send(renderReader(text, req));
});

// Subscribe → create a Stripe Checkout session
app.get("/subscribe", (req, res) => res.send(renderSubscribe(req)));

app.post("/create-checkout", async (req, res) => {
  if (!stripe || !STRIPE_PRICE_ID) {
    return res.status(500).send(page("Setup needed", "<p>Add your Stripe keys and price ID in Secrets first.</p>"));
  }
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${BASE_URL}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/subscribe`,
      allow_promotion_codes: true,
    });
    res.redirect(303, session.url);
  } catch (err) {
    res.status(500).send(page("Error", `<p>${err.message}</p>`));
  }
});

// Return from Stripe — verify the session, grant access
app.get("/welcome", async (req, res) => {
  if (!stripe) return res.redirect("/");
  try {
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
    const email = session.customer_details.email;
    setSubscriber(email, session.customer, true);
    grantAccess(res, email);
    res.send(page("Welcome to Lectio", `<p>You're in. The full library is open.</p><p><a class="btn" href="/">Start reading →</a></p>`));
  } catch {
    res.redirect("/");
  }
});

// Returning subscriber restoring access on a new device
app.get("/restore", (req, res) => res.send(renderRestore()));
app.post("/restore", (req, res) => {
  const email = (req.body.email || "").trim();
  if (isActive(email)) { grantAccess(res, email); return res.redirect("/"); }
  res.send(renderRestore("No active subscription found for that email."));
});

app.get("/logout", (req, res) => { res.clearCookie("lectio_access"); res.redirect("/"); });

// -----------------------------------------------------------------------------
// Views (plain, dependency-free. Replace with your real Lectio styling.)
// -----------------------------------------------------------------------------
function page(title, body) {
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} — Lectio</title>
  <style>
    body{font-family:Georgia,'Times New Roman',serif;max-width:680px;margin:3rem auto;padding:0 1.25rem;color:#2b2620;line-height:1.6}
    a{color:#7a5c2e} .btn{display:inline-block;background:#7a5c2e;color:#fff;padding:.6rem 1.1rem;border-radius:6px;text-decoration:none;border:0;font:inherit;cursor:pointer}
    .lock{opacity:.55} .row{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid #e7e0d4;padding:.7rem 0}
    .tag{font-size:.72rem;letter-spacing:.04em;text-transform:uppercase;color:#9a8c6e} .src{font-variant:small-caps}
    .orig{font-size:1.15rem;margin:.2rem 0 0} .gloss{color:#6b6256;font-style:italic;margin:0 0 .9rem}
    input{font:inherit;padding:.5rem;width:100%;max-width:320px;border:1px solid #cdbfa6;border-radius:6px}
  </style>${body}`;
}

function renderLibrary(req) {
  const user = currentUser(req);
  const rows = texts.map((t) => {
    const locked = t.tier === "paid" && !isActive(user);
    return `<div class="row ${locked ? "lock" : ""}">
      <div><a href="/read/${t.slug}">${t.title}</a><br>
      <span class="src">${t.author}</span> · ${t.language}</div>
      <span class="tag">${t.tier === "free" ? "Free" : locked ? "🔒 Subscriber" : "Unlocked"}</span>
    </div>`;
  }).join("");
  const cta = isActive(user)
    ? `<p class="tag">Signed in as ${user} · <a href="/logout">log out</a></p>`
    : `<p><a class="btn" href="/subscribe">Unlock the full library — $6/mo</a> · <a href="/restore">Restore access</a></p>`;
  return page("Library", `<h1 style="font-variant:small-caps">Lectio</h1>
    <p>Read the classics in their original language. Start free, no card.</p>${cta}<div>${rows}</div>`);
}

function renderReader(text, req) {
  // ⬇⬇⬇ REPLACE THIS BLOCK with your existing Lectio reader markup. ⬇⬇⬇
  const body = text.lines.map(([orig, gloss]) =>
    `<p class="orig">${orig}</p><p class="gloss">${gloss}</p>`).join("");
  return page(text.title, `<p><a href="/">← Library</a></p>
    <h1>${text.title}</h1><p class="src">${text.author} · ${text.language}</p>${body}`);
}

function renderSubscribe(req) {
  return page("Subscribe", `<p><a href="/">← Library</a></p>
    <h1>Unlock the full library</h1>
    <p>Every text, every language, the complete five-stage reading cycle. $6/month, cancel anytime.</p>
    <form method="POST" action="/create-checkout"><button class="btn" type="submit">Continue to payment →</button></form>
    <p class="tag" style="margin-top:1.5rem">Already subscribed? <a href="/restore">Restore access</a></p>`);
}

function renderRestore(error = "") {
  return page("Restore access", `<p><a href="/">← Library</a></p><h1>Restore access</h1>
    ${error ? `<p style="color:#a33">${error}</p>` : ""}
    <p>Enter the email you subscribed with.</p>
    <form method="POST" action="/restore"><input name="email" type="email" placeholder="you@example.com" required>
    <p><button class="btn" type="submit">Restore →</button></p></form>`);
}

app.listen(PORT, () => console.log(`Lectio running on ${BASE_URL} (stripe: ${stripe ? "live" : "not configured"})`));
