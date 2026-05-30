import type { VideoConfig } from './types';
import { iliadIntro } from './iliad-intro/config';
import { iliadHector } from './iliad-hector/config';
import { odysseyIntro } from './odyssey-intro/config';
import { odysseyCyclops } from './odyssey-cyclops/config';

// Order here is the order shown on the menu.
export const VIDEOS: VideoConfig[] = [
  iliadIntro,
  iliadHector,
  odysseyIntro,
  odysseyCyclops,
];

export const VIDEOS_BY_SLUG: Record<string, VideoConfig> = Object.fromEntries(
  VIDEOS.map((v) => [v.slug, v]),
);
