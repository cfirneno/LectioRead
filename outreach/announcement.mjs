// Announcement email template for the Lectio educator outreach.
// renderEmail({ department, institution }) -> { subject, html, text }
// Placeholders fall back to neutral phrasing when a field is missing.

const SITE = "https://lectioread.com";
const VIDEO = "https://youtu.be/PhjvB98pG4k";
const SENDER_NAME = "Charles Firneno";
const SENDER_EMAIL = "charles@risxsci.com";

function greeting(department, institution) {
  if (department && institution) return `Dear ${department} faculty at ${institution},`;
  if (department) return `Dear ${department} faculty,`;
  if (institution) return `Dear colleagues at ${institution},`;
  return "Dear colleagues,";
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderEmail({ department = "", institution = "" } = {}) {
  const hello = greeting(department.trim(), institution.trim());
  const helloHtml = escapeHtml(hello);
  const subject = "A free reading tool for your language students — Lectio";

  const text = `${hello}

I wanted to share a free resource your students may find useful: Lectio
(${SITE}), a structured reader for the great works in their original
languages — Latin, Greek, Italian, French, German, Spanish, Russian, and
Japanese.

Each paragraph cycles through the original text, a word-by-word interlinear
gloss, a full side-by-side translation, and back to the original — a simple,
repeatable way to build real reading fluency. For Latin and Greek verse there
are optional macrons and scansion marks.

Everything is free: no ads, no tracking, no paywall, and no account required
to start reading. An optional free account saves progress, vocabulary, and
flashcards.

A short sample (a narrated reading of the opening of the Aeneid): ${VIDEO}

If it looks useful for your courses, please feel free to pass it along to
students and colleagues. I'm glad to answer any questions.

With best wishes,
${SENDER_NAME}
${SENDER_EMAIL}
${SITE}

—
You received this note because of your department's published academic contact
address. Reply "unsubscribe" and I won't write again.`;

  const html = `<!doctype html><html><body style="font-family:Georgia,'Times New Roman',serif;color:#2b2b2b;line-height:1.6;max-width:560px;margin:0 auto;padding:8px;">
  <p>${helloHtml}</p>
  <p>I wanted to share a free resource your students may find useful:
    <a href="${SITE}">Lectio</a>, a structured reader for the great works in
    their original languages — Latin, Greek, Italian, French, German, Spanish,
    Russian, and Japanese.</p>
  <p>Each paragraph cycles through the original text, a word-by-word interlinear
    gloss, a full side-by-side translation, and back to the original — a simple,
    repeatable way to build real reading fluency. For Latin and Greek verse there
    are optional macrons and scansion marks.</p>
  <p>Everything is free: no ads, no tracking, no paywall, and no account required
    to start reading. An optional free account saves progress, vocabulary, and
    flashcards.</p>
  <p>A short sample (a narrated reading of the opening of the Aeneid):
    <a href="${VIDEO}">${VIDEO}</a></p>
  <p>If it looks useful for your courses, please feel free to pass it along to
    students and colleagues. I'm glad to answer any questions.</p>
  <p>With best wishes,<br>${SENDER_NAME}<br>
    <a href="mailto:${SENDER_EMAIL}">${SENDER_EMAIL}</a><br>
    <a href="${SITE}">${SITE}</a></p>
  <hr style="border:none;border-top:1px solid #ddd;margin:20px 0;">
  <p style="font-size:12px;color:#888;">You received this note because of your
    department's published academic contact address. Reply "unsubscribe" and I
    won't write again.</p>
</body></html>`;

  return { subject, html, text, from: `${SENDER_NAME} <${SENDER_EMAIL}>`, replyTo: SENDER_EMAIL };
}
