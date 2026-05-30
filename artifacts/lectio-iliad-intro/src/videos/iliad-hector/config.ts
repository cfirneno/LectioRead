import type { VideoConfig } from '../types';
import { Scene1 } from './scenes/Scene1';
import { Scene2 } from './scenes/Scene2';
import { Scene3 } from './scenes/Scene3';
import { Scene4 } from './scenes/Scene4';
import { Scene5 } from './scenes/Scene5';
import { Scene6 } from './scenes/Scene6';
import { Scene7 } from './scenes/Scene7';
import { Scene8 } from './scenes/Scene8';
import { Scene9 } from './scenes/Scene9';
import { Scene10 } from './scenes/Scene10';

// Each scene window equals its narration segment length in the mp3
// (audio is the master clock).
export const iliadHector: VideoConfig = {
  slug: 'iliad-hector',
  work: "Homer's Iliad",
  greekTitle: 'ΙΛΙΑΣ Χ',
  menuTitle: 'The Death of Hector',
  menuSubtitle: 'Book XXII — Achilles and Hector meet at last before the walls of Troy.',
  poster: 'images/iliad-hector/achilles-star.png',
  start: { eyebrow: 'Welcome back to Lectio', subtitle: "from Homer's Iliad, Book XXII" },
  durations: {
    scene1: 16600,
    scene2: 17700,
    scene3: 14100,
    scene4: 20500,
    scene5: 15700,
    scene6: 16000,
    scene7: 17300,
    scene8: 17000,
    scene9: 21200,
    scene10: 14200,
  },
  scenes: {
    scene1: Scene1,
    scene2: Scene2,
    scene3: Scene3,
    scene4: Scene4,
    scene5: Scene5,
    scene6: Scene6,
    scene7: Scene7,
    scene8: Scene8,
    scene9: Scene9,
    scene10: Scene10,
  },
  audioSrc: 'audio/iliad-hector/host_narration_full.mp3',
  end: {
    line: "That's the duel. Read the death of Hector in the reading room.",
    cta: 'Start reading Iliad XXII',
    href: '/app/start/Ἰλιάς%20XXII',
  },
};
