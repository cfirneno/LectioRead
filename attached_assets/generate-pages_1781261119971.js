// generate-pages.js — run with: node generate-pages.js
// Reads your catalog and writes one SEO-optimized landing page per text into
// /pages. Each page shows a real free sample (the demo IS the marketing) and
// targets the exact phrases people search: "Aeneid Book 1 Latin interlinear",
// "read John 1 in Greek with translation", etc. These pages rank, get shared,
// and funnel into the reader.

const fs = require("fs");
const path = require("path");
const texts = require("./texts");

const OUT = path.join(__dirname, "pages");
fs.mkdirSync(OUT, { recursive: true });

const BASE = "https://lectioread.com";

function pageHTML(t) {
  const sample = t.lines.slice(0, 4).map(([o, g]) =>
    `<p class="orig">${o}</p><p class="gloss">${g}</p>`).join("\n");
  const title = `${t.title} — Read in ${t.language} with Interlinear Translation | Lectio`;
  const desc = `Read ${t.author}'s ${t.title} in the original ${t.language}, line by line with interlinear translation and a guided reading cycle. Free sample, no signup.`;
  const kw = [
    `${t.author} ${t.language}`, `${t.title} interlinear`,
    `read ${t.author} in ${t.language}`, `${t.title} translation original text`,
    `${t.language} reader`,
  ].join(", ");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="keywords" content="${kw}">
<link rel="canonical" href="${BASE}/text/${t.slug}">
<meta property="og:title" content="${t.title} in ${t.language} — Lectio">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="article">
<meta property="og:url" content="${BASE}/text/${t.slug}">
<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org", "@type": "Article",
  headline: `${t.title} in ${t.language}`, author: { "@type": "Person", name: t.author },
  about: t.language, inLanguage: t.language, isAccessibleForFree: t.tier === "free",
  publisher: { "@type": "Organization", name: "Lectio", url: BASE },
}, null, 2)}
</script>
<style>body{font-family:Georgia,serif;max-width:680px;margin:3rem auto;padding:0 1.25rem;color:#2b2620;line-height:1.6}
.orig{font-size:1.15rem;margin:.2rem 0 0}.gloss{color:#6b6256;font-style:italic;margin:0 0 .9rem}
.btn{display:inline-block;background:#7a5c2e;color:#fff;padding:.7rem 1.2rem;border-radius:6px;text-decoration:none}
.src{font-variant:small-caps}a{color:#7a5c2e}</style></head><body>
<p><a href="${BASE}/">Lectio</a></p>
<h1>${t.title} <small style="font-weight:400">in ${t.language}</small></h1>
<p class="src">${t.author} · ${t.language}</p>
<p>Read ${t.author}'s <em>${t.title}</em> in the original ${t.language}, line by line,
with interlinear translation and Lectio's guided five-stage reading cycle that builds
real reading fluency. Here is the opening:</p>
<section>${sample}</section>
<p style="margin-top:2rem"><a class="btn" href="${BASE}/read/${t.slug}">Continue reading in Lectio →</a></p>
<p><a href="${BASE}/">Browse the full library →</a></p>
</body></html>`;
}

let n = 0;
for (const t of texts) {
  fs.writeFileSync(path.join(OUT, `${t.slug}.html`), pageHTML(t));
  n++;
}

// sitemap so Google discovers every page
const urls = texts.map((t) => `  <url><loc>${BASE}/text/${t.slug}</loc></url>`).join("\n");
fs.writeFileSync(path.join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`);

console.log(`Generated ${n} landing pages + sitemap.xml in /pages`);
