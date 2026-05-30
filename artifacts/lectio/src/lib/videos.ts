export interface VideoEntry {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  src: string;
}

export const VIDEOS: VideoEntry[] = [
  {
    slug: "iliad-intro",
    title: "The Iliad — Opening",
    subtitle: "Homer · Ancient Greek",
    description:
      'The wrath of Achilles. The host sets the scene, then reads "Μῆνιν ἄειδε" aloud with a word-by-word translation.',
    src: "/lectio-iliad-intro/iliad-intro",
  },
  {
    slug: "iliad-hector",
    title: "The Death of Hector",
    subtitle: "Iliad, Book XXII · Ancient Greek",
    description:
      "Achilles runs Hector down beneath the walls of Troy — the duel that ends the war's greatest defender, read aloud in the original Greek.",
    src: "/lectio-iliad-intro/iliad-hector",
  },
  {
    slug: "odyssey-intro",
    title: "The Odyssey — Opening",
    subtitle: "Homer · Ancient Greek",
    description:
      'The man of many turns. The opening invocation "Ἄνδρα μοι ἔννεπε, Μοῦσα" read aloud and broken down word by word.',
    src: "/lectio-iliad-intro/odyssey-intro",
  },
  {
    slug: "odyssey-cyclops",
    title: "Odysseus and the Cyclops",
    subtitle: "Odyssey, Book IX · Ancient Greek",
    description:
      'Trapped in the cave of Polyphemus, cunning is the only way out — ending with "Οὖτις" ("Nobody") read aloud in the original Greek.',
    src: "/lectio-iliad-intro/odyssey-cyclops",
  },
  {
    slug: "aeneid",
    title: "The Aeneid — Opening",
    subtitle: "Virgil · Latin",
    description:
      "Meet Virgil's epic. The host sets the scene, then reads the opening lines aloud with a word-by-word translation.",
    src: "/lectio-intro/",
  },
  {
    slug: "laocoon",
    title: "The Laocoön Warning",
    subtitle: "Aeneid, Book 2 · Latin",
    description:
      'Trust no Trojan horse. A short tale ending with "Equo ne credite, Teucri" read aloud and broken down word by word.',
    src: "/lectio-laocoon/",
  },
];

export function getVideoBySlug(slug: string | undefined): VideoEntry | undefined {
  return VIDEOS.find((v) => v.slug === slug);
}
