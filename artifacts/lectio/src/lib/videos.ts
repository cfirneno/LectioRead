export interface VideoEntry {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  src: string;
}

export const VIDEOS: VideoEntry[] = [
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
