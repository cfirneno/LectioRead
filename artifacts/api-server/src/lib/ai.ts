import { openai } from "@workspace/integrations-openai-ai-server";

export interface InterlinearWord {
  original: string;
  translation: string;
}

export interface TextSearchResult {
  title: string;
  author: string;
  language: string;
  sourceUrl: string | null;
  description: string | null;
  paragraphs: string[];
}

export async function searchAndFetchText(query: string): Promise<TextSearchResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 8192,
    messages: [
      {
        role: "system",
        content: `You are a literary assistant specializing in open-source classical texts. 
When asked for a text, you return the actual text content from memory (Project Gutenberg, Wikisource, or other public domain sources).
You split the text into meaningful paragraphs (typically 3-8 sentences each).
Always return valid JSON.`,
      },
      {
        role: "user",
        content: `Find and return the text for: "${query}"

Return a JSON object with these exact fields:
{
  "title": "exact title",
  "author": "author name",
  "language": "original language (e.g. Italian, Latin, French, Spanish)",
  "sourceUrl": "URL if known from Project Gutenberg or Wikisource, or null",
  "description": "brief description of the work",
  "paragraphs": ["paragraph 1 text", "paragraph 2 text", ...]
}

Return 5-15 paragraphs of the original text in its original language.
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

  const result = JSON.parse(jsonMatch[0]) as TextSearchResult;
  return result;
}

export async function generateInterlinearTranslation(
  originalText: string,
  sourceLanguage: string,
  targetLanguage: string = "English"
): Promise<InterlinearWord[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 4096,
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
  {"original": "original_word", "translation": "literal_english_meaning"},
  ...
]

Rules:
- Keep punctuation attached to the word it belongs to
- For compound expressions, keep them as one entry
- Give the most literal possible translation, not polished
- Preserve the exact word order of the original`,
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
    model: "gpt-5.4",
    max_completion_tokens: 2048,
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
