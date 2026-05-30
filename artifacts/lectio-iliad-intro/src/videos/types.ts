import type { ComponentType } from 'react';

export interface VideoConfig {
  /** URL slug, e.g. "iliad-intro" — route is `/${slug}`. */
  slug: string;
  /** Source work, shown as an eyebrow on the menu card, e.g. "Homer's Iliad". */
  work: string;
  /** Large Greek title for the menu card + start screen, e.g. "ΙΛΙΑΣ". */
  greekTitle: string;
  /** English title for the menu card, e.g. "The Wrath of Achilles". */
  menuTitle: string;
  /** One-line English description for the menu card. */
  menuSubtitle: string;
  /** Menu card poster image, relative to BASE_URL (e.g. "images/iliad-intro/troy.png"). */
  poster: string;
  /** Start screen copy. */
  start: { eyebrow: string; subtitle: string };
  /** Per-scene windows (ms) — must match the narration segment lengths. */
  durations: Record<string, number>;
  /** Scene key -> component. Keys must match `durations`. */
  scenes: Record<string, ComponentType>;
  /** Narration mp3, relative to BASE_URL. */
  audioSrc: string;
  /** End-of-video card linking back into the reading room. */
  end: { line: string; cta: string; href: string };
}
