import { openai } from "@workspace/integrations-openai-ai-server";
import { textToSpeech } from "@workspace/integrations-openai-ai-server/audio";

export interface InterlinearWord {
  original: string;
  translation: string;
  transliteration?: string;
}

const NON_LATIN_SCRIPT_LANGS = new Set([
  "greek",
  "ancient greek",
  "koine greek",
  "russian",
  "ukrainian",
  "bulgarian",
  "serbian",
  "old church slavonic",
]);

function needsTransliteration(language: string): boolean {
  return NON_LATIN_SCRIPT_LANGS.has(language.trim().toLowerCase());
}

export interface TextSearchResult {
  title: string;
  author: string;
  language: string;
  sourceUrl: string | null;
  description: string | null;
  publicationYear: number | null;
  englishTitle: string | null;
  englishAuthor: string | null;
  paragraphs: string[];
}

export class CopyrightedTextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CopyrightedTextError";
  }
}

export async function searchAndFetchText(query: string): Promise<TextSearchResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 8192,
    reasoning_effort: "minimal",
    messages: [
      {
        role: "system",
        content: `You are a literary assistant specializing in open-source classical texts.
You ONLY work with public-domain texts (Project Gutenberg, Wikisource, etc.).
When asked for a text, you return the actual text content from memory in its ORIGINAL language.
You split the text into meaningful paragraphs (typically 3-8 sentences each).
Always return valid JSON — and nothing else.`,
      },
      {
        role: "user",
        content: `Find and return the text for: "${query}"

If the work is still under copyright (e.g. published after 1929 by an author who died less than 70 years ago — examples: Salinger, Hemingway after 1929, Orwell, Rowling, etc.) and not in the public domain, return EXACTLY this JSON and nothing else:
{"error": "copyrighted", "message": "Brief one-sentence explanation that this work is under copyright and unavailable."}

Otherwise, return a JSON object with these exact fields:
{
  "title": "exact title in the original language",
  "author": "author name",
  "language": "original language (e.g. Italian, Latin, French, Spanish, Russian, Greek, Japanese)",
  "sourceUrl": "URL if known from Project Gutenberg or Wikisource, or null",
  "description": "brief description of the work in English",
  "publicationYear": <approximate publication year as an integer; negative for BCE (e.g. -750 for c. 750 BCE); use your best estimate; never null>,
  "englishTitle": "commonly used English title (e.g. 'Crime and Punishment'); use null only if the original IS already in English/Latin script and no separate English form is conventional",
  "englishAuthor": "author's name in Latin script as commonly used in English (e.g. 'Fyodor Dostoevsky', 'Natsume Sōseki'); use null only if the author name is already in Latin script",
  "paragraphs": ["paragraph 1 text in ORIGINAL language", "paragraph 2 text in ORIGINAL language", ...]
}

Return 5-15 paragraphs of the original text in its ORIGINAL language — never translated.
Each paragraph should be a natural reading unit (a few sentences).
Do not include chapter headings or translator notes — only the original text paragraphs.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse AI response as JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]) as Partial<TextSearchResult> & { error?: string; message?: string };

  if (parsed.error === "copyrighted") {
    throw new CopyrightedTextError(
      parsed.message ?? `"${query}" appears to be under copyright. Lectio only supports public-domain works.`,
    );
  }

  if (!parsed.title || !parsed.author || !parsed.language || !Array.isArray(parsed.paragraphs) || parsed.paragraphs.length === 0) {
    throw new Error("AI returned an incomplete text result");
  }

  return parsed as TextSearchResult;
}

export async function generateInterlinearTranslation(
  originalText: string,
  sourceLanguage: string,
  targetLanguage: string = "English"
): Promise<InterlinearWord[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 4096,
    reasoning_effort: "minimal",
    messages: [
      {
        role: "system",
        content: `You are a classical language scholar creating interlinear translations.
An interlinear translation shows each word of the original with its literal meaning directly below.
Return ONLY valid JSON — no other text.`,
      },
      {
        role: "user",
        content: `Create a word-for-word interlinear translation of this ${sourceLanguage} text into ${targetLanguage}:

"${originalText}"

Return a JSON array of objects, one per word/token:
[
  {"original": "original_word", "translation": "literal_english_meaning"${needsTransliteration(sourceLanguage) ? `, "transliteration": "romanized_pronunciation"` : ""}},
  ...
]

Rules:
- Keep punctuation attached to the word it belongs to
- For compound expressions, keep them as one entry
- Give the most literal possible translation, not polished
- Preserve the exact word order of the original${
          needsTransliteration(sourceLanguage)
            ? `
- Include a "transliteration" field for every word with its romanized pronunciation (e.g. for Russian use scientific transliteration; for Ancient Greek use standard scholarly romanization with macrons where appropriate)`
            : ""
        }`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Could not parse AI response as JSON");
  }

  return JSON.parse(jsonMatch[0]) as InterlinearWord[];
}

export async function generateScansion(
  originalText: string,
  sourceLanguage: string
): Promise<string> {
  const isGreek = /greek|ἑλλην|ελλην/i.test(sourceLanguage);
  const meterHint = isGreek
    ? "For Ancient/Koine Greek hexameter (Homer) or other Greek meters, mark long vowels and long-by-position syllables. Preserve original Greek diacritics (breathings, accents) and add macrons (ᾱ ῑ ῡ) on naturally long alphas/iotas/upsilons."
    : "For Latin dactylic hexameter, elegiac couplets, hendecasyllables, etc., mark each vowel: long vowels get macrons (ā ē ī ō ū ȳ), short vowels get breves (ă ĕ ĭ ŏ ŭ y̆). Indicate elision by enclosing the elided final vowel in parentheses, e.g. 'multum ill(e) et terris'.";

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 4096,
    reasoning_effort: "minimal",
    messages: [
      {
        role: "system",
        content: `You are a classical-meter scholar producing scansion-marked versions of verse passages. ${meterHint} Return ONLY the scanned text — same line breaks as the input, no commentary, no JSON wrapper.`,
      },
      {
        role: "user",
        content: `Add scansion marks (macrons on long vowels, breves on short vowels, parenthesized elisions where appropriate) to this ${sourceLanguage} passage. Preserve every word and line break exactly. If a line is prose rather than verse, return it unchanged.

${originalText}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) throw new Error("No scansion response from AI");
  return content;
}

export async function lookupEnglishTitles(
  books: Array<{ id: number; title: string; author: string; language: string }>
): Promise<Map<number, { englishTitle: string | null; englishAuthor: string | null }>> {
  if (books.length === 0) return new Map();

  const listing = books
    .map((b) => `${b.id}. "${b.title}" by ${b.author} (${b.language})`)
    .join("\n");

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 8192,
    reasoning_effort: "minimal",
    messages: [
      {
        role: "system",
        content:
          "You are a literary scholar. Return ONLY valid JSON — an array of {id, englishTitle, englishAuthor} objects giving the commonly used English title and the Latin-script English form of the author's name for each work.",
      },
      {
        role: "user",
        content: `For each work below, give the commonly used English title and the author's name as commonly written in English (Latin script). Examples:
- 'Преступление и наказание' by 'Фёдор Достоевский' → {"englishTitle": "Crime and Punishment", "englishAuthor": "Fyodor Dostoevsky"}
- '吾輩は猫である' by '夏目漱石' → {"englishTitle": "I Am a Cat", "englishAuthor": "Natsume Sōseki"}

If the original title/author is already in Latin script with no conventional English form, use null for that field.

Return ONLY a JSON array like [{"id": 12, "englishTitle": "...", "englishAuthor": "..."}, ...] — no other text.

${listing}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from AI");

  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Could not parse English title response as JSON");

  const parsed = JSON.parse(jsonMatch[0]) as Array<{
    id: number;
    englishTitle?: string | null;
    englishAuthor?: string | null;
  }>;
  const out = new Map<number, { englishTitle: string | null; englishAuthor: string | null }>();
  for (const item of parsed) {
    if (typeof item.id !== "number") continue;
    const englishTitle =
      typeof item.englishTitle === "string" && item.englishTitle.trim() ? item.englishTitle.trim() : null;
    const englishAuthor =
      typeof item.englishAuthor === "string" && item.englishAuthor.trim() ? item.englishAuthor.trim() : null;
    if (englishTitle || englishAuthor) {
      out.set(item.id, { englishTitle, englishAuthor });
    }
  }
  return out;
}

export async function lookupPublicationYears(
  books: Array<{ id: number; title: string; author: string }>
): Promise<Map<number, number>> {
  if (books.length === 0) return new Map();

  const listing = books
    .map((b) => `${b.id}. "${b.title}" by ${b.author}`)
    .join("\n");

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 4096,
    reasoning_effort: "minimal",
    messages: [
      {
        role: "system",
        content:
          "You are a literary scholar. Return ONLY valid JSON — an array of {id, year} pairs. Use negative integers for BCE (e.g. -750 for c. 750 BCE). Use your best estimate; never return null.",
      },
      {
        role: "user",
        content: `Give the approximate original publication year for each work below. Return ONLY a JSON array like [{"id": 12, "year": 1532}, ...] — no other text.

${listing}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from AI");

  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Could not parse year lookup response as JSON");

  const parsed = JSON.parse(jsonMatch[0]) as Array<{ id: number; year: number }>;
  const out = new Map<number, number>();
  for (const item of parsed) {
    if (typeof item.id === "number" && typeof item.year === "number" && Number.isFinite(item.year)) {
      out.set(item.id, Math.round(item.year));
    }
  }
  return out;
}

export async function generateFullTranslation(
  originalText: string,
  sourceLanguage: string,
  targetLanguage: string = "English"
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 2048,
    reasoning_effort: "minimal",
    messages: [
      {
        role: "system",
        content: `You are a distinguished literary translator specializing in classical texts.
Provide fluent, readable translations that capture the meaning and spirit of the original.`,
      },
      {
        role: "user",
        content: `Translate this ${sourceLanguage} text into literary ${targetLanguage}:

"${originalText}"

Return ONLY the translated text, nothing else. Make it read naturally in ${targetLanguage} while staying faithful to the original meaning.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  return content.trim();
}

export type QuizQuestion = {
  kind: "translation" | "vocab" | "grammar";
  prompt: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
};

export type GeneratedQuiz = {
  paragraphText: string;
  questions: QuizQuestion[];
};

export async function generateQuiz(
  originalText: string,
  fullTranslation: string,
  sourceLanguage: string,
  targetLanguage: string = "English",
): Promise<GeneratedQuiz> {
  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 4096,
    reasoning_effort: "minimal",
    messages: [
      {
        role: "system",
        content: `You are a ${sourceLanguage} teacher writing a short comprehension quiz on one paragraph. Return ONLY valid JSON. Each question has exactly 4 options. Make distractors plausible but unambiguously wrong.`,
      },
      {
        role: "user",
        content: `Write a 5-question multiple-choice quiz for this ${sourceLanguage} paragraph. ${targetLanguage} is the student's language.

PARAGRAPH (${sourceLanguage}):
${originalText}

REFERENCE TRANSLATION (${targetLanguage}):
${fullTranslation}

Return a JSON object exactly like:
{
  "questions": [
    {
      "kind": "translation",
      "prompt": "Which is the best ${targetLanguage} translation of the paragraph above?",
      "options": ["...", "...", "...", "..."],
      "correctIndex": 0,
      "explanation": "Short note on why this is correct and why the others are wrong."
    },
    {
      "kind": "vocab",
      "prompt": "What does '<word from paragraph>' mean here?",
      "options": ["...", "...", "...", "..."],
      "correctIndex": 0,
      "explanation": "Brief explanation referencing the paragraph context."
    },
    { "kind": "vocab", ... },
    {
      "kind": "grammar",
      "prompt": "What is the grammatical form of '<word>' in this paragraph?",
      "options": ["...", "...", "...", "..."],
      "correctIndex": 0,
      "explanation": "Brief grammatical reasoning."
    },
    { "kind": "grammar", ... }
  ]
}

Rules:
- Exactly 5 questions, in this order: 1 translation, 2 vocab, 2 grammar.
- All prompts and options in ${targetLanguage} (except the ${sourceLanguage} words quoted in single quotes).
- For grammar questions, ask about specific morphology found in the paragraph (case/number/gender for nouns, tense/voice/mood/person for verbs, etc.).
- For vocab questions, quote the actual word from the paragraph in single quotes.
- Make the translation options 4 short paragraph-length renderings; one accurate, others subtly wrong (mistranslated key word, wrong subject, wrong tense, etc.).
- Keep "explanation" to one or two sentences, plain prose, no markdown.
- correctIndex must be 0, 1, 2, or 3 — randomize which slot the correct answer sits in.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No quiz response from AI");

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse quiz JSON from AI");

  const parsed = JSON.parse(jsonMatch[0]) as { questions?: QuizQuestion[] };
  const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
  if (questions.length < 5) {
    throw new Error(`Quiz returned only ${questions.length} questions`);
  }

  const cleaned: QuizQuestion[] = questions.slice(0, 5).map((q) => {
    if (
      !q ||
      typeof q.prompt !== "string" ||
      !Array.isArray(q.options) ||
      q.options.length !== 4 ||
      typeof q.correctIndex !== "number" ||
      q.correctIndex < 0 ||
      q.correctIndex > 3
    ) {
      throw new Error("Malformed quiz question from AI");
    }
    return {
      kind: q.kind === "translation" || q.kind === "vocab" || q.kind === "grammar" ? q.kind : "vocab",
      prompt: q.prompt.trim(),
      options: [
        String(q.options[0]),
        String(q.options[1]),
        String(q.options[2]),
        String(q.options[3]),
      ],
      correctIndex: q.correctIndex as 0 | 1 | 2 | 3,
      explanation: typeof q.explanation === "string" ? q.explanation.trim() : "",
    };
  });

  return { paragraphText: originalText, questions: cleaned };
}

/**
 * Generate spoken audio of a paragraph in its original language.
 * Returns base64-encoded MP3 so it can be cached as text and played in the browser.
 */
export async function generateSpeech(originalText: string): Promise<string> {
  const audioBuffer = await textToSpeech(originalText, "alloy", "mp3");
  if (!audioBuffer || audioBuffer.length === 0) {
    throw new Error("No audio returned from text-to-speech");
  }
  return audioBuffer.toString("base64");
}
