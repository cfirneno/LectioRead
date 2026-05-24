import { openai } from "@workspace/integrations-openai-ai-server";

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
  "language": "original language (e.g. Italian, Latin, French, Spanish, Russian, Greek)",
  "sourceUrl": "URL if known from Project Gutenberg or Wikisource, or null",
  "description": "brief description of the work in English",
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
