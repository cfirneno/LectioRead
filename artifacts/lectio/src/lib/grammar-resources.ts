export type GrammarResource = {
  language: string;
  grammarTitle: string;
  grammarUrl: string;
  grammarNote?: string;
  lookupLabel: string;
  lookupUrl: (word: string) => string;
};

function stripMacrons(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function cleanWord(word: string): string {
  return word.replace(/[.,;:!?¡¿"“”‘’()\[\]·…—–-]+/g, "").trim();
}

const RESOURCES: Record<string, GrammarResource> = {
  Latin: {
    language: "Latin",
    grammarTitle: "Allen & Greenough's New Latin Grammar",
    grammarUrl: "https://dcc.dickinson.edu/grammar/latin/preface",
    grammarNote: "Hosted by Dickinson College Commentaries (public domain).",
    lookupLabel: "Look up on Perseus",
    lookupUrl: (w) =>
      `https://www.perseus.tufts.edu/hopper/morph?l=${encodeURIComponent(stripMacrons(cleanWord(w)).toLowerCase())}&la=la`,
  },
  Greek: {
    language: "Ancient Greek",
    grammarTitle: "Smyth's Greek Grammar",
    grammarUrl:
      "https://www.perseus.tufts.edu/hopper/text?doc=Perseus%3Atext%3A1999.04.0007",
    grammarNote: "Hosted by the Perseus Digital Library (public domain).",
    lookupLabel: "Look up on Perseus",
    lookupUrl: (w) =>
      `https://www.perseus.tufts.edu/hopper/morph?l=${encodeURIComponent(cleanWord(w))}&la=greek`,
  },
  Italian: {
    language: "Italian",
    grammarTitle: "Italian — Wikibooks",
    grammarUrl: "https://en.wikibooks.org/wiki/Italian",
    grammarNote: "Community-maintained, CC BY-SA.",
    lookupLabel: "Look up on Wiktionary",
    lookupUrl: (w) =>
      `https://en.wiktionary.org/wiki/${encodeURIComponent(cleanWord(w).toLowerCase())}#Italian`,
  },
  French: {
    language: "French",
    grammarTitle: "French — Wikibooks",
    grammarUrl: "https://en.wikibooks.org/wiki/French",
    grammarNote: "Community-maintained, CC BY-SA.",
    lookupLabel: "Look up on Wiktionary",
    lookupUrl: (w) =>
      `https://en.wiktionary.org/wiki/${encodeURIComponent(cleanWord(w).toLowerCase())}#French`,
  },
  German: {
    language: "German",
    grammarTitle: "German — Wikibooks",
    grammarUrl: "https://en.wikibooks.org/wiki/German",
    grammarNote: "Community-maintained, CC BY-SA.",
    lookupLabel: "Look up on Wiktionary",
    lookupUrl: (w) =>
      `https://en.wiktionary.org/wiki/${encodeURIComponent(cleanWord(w))}#German`,
  },
  Spanish: {
    language: "Spanish",
    grammarTitle: "Spanish — Wikibooks",
    grammarUrl: "https://en.wikibooks.org/wiki/Spanish",
    grammarNote: "Community-maintained, CC BY-SA.",
    lookupLabel: "Look up on Wiktionary",
    lookupUrl: (w) =>
      `https://en.wiktionary.org/wiki/${encodeURIComponent(cleanWord(w).toLowerCase())}#Spanish`,
  },
  Russian: {
    language: "Russian",
    grammarTitle: "Russian — Wikibooks",
    grammarUrl: "https://en.wikibooks.org/wiki/Russian",
    grammarNote: "Community-maintained, CC BY-SA.",
    lookupLabel: "Look up on Wiktionary",
    lookupUrl: (w) =>
      `https://en.wiktionary.org/wiki/${encodeURIComponent(cleanWord(w).toLowerCase())}#Russian`,
  },
  Japanese: {
    language: "Japanese",
    grammarTitle: "Tae Kim's Guide to Japanese Grammar",
    grammarUrl: "https://guidetojapanese.org/learn/grammar",
    grammarNote: "Free online reference, widely used by learners.",
    lookupLabel: "Look up on Jisho",
    lookupUrl: (w) => `https://jisho.org/search/${encodeURIComponent(cleanWord(w))}`,
  },
};

export function normalizeLanguageKey(lang: string | undefined | null): string | null {
  if (!lang) return null;
  const l = lang.trim().toLowerCase();
  if (/latin/.test(l)) return "Latin";
  if (/greek|ἑλλην|ελλην/.test(l)) return "Greek";
  if (/italian|italiano/.test(l)) return "Italian";
  if (/french|français|francais/.test(l)) return "French";
  if (/german|deutsch/.test(l)) return "German";
  if (/spanish|español|espanol|castellano/.test(l)) return "Spanish";
  if (/russian|русск/.test(l)) return "Russian";
  if (/japanese|日本|nihongo/.test(l)) return "Japanese";
  return null;
}

export function getGrammarResource(lang: string | undefined | null): GrammarResource | null {
  const key = normalizeLanguageKey(lang);
  return key ? RESOURCES[key] : null;
}
