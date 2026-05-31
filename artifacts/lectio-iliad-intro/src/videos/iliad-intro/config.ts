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
export const iliadIntro: VideoConfig = {
  slug: 'iliad-intro',
  work: "Homer's Iliad",
  greekTitle: 'ΙΛΙΑΣ',
  menuTitle: 'The Wrath of Achilles',
  menuSubtitle: 'The opening invocation — "Sing, goddess, the rage of Achilles."',
  poster: 'images/iliad-intro/troy.png',
  start: { eyebrow: 'Welcome back to Lectio', subtitle: "from Homer's Iliad" },
  durations: {
    scene1: 16700,
    scene2: 10800,
    scene3: 14700,
    scene4: 7900,
    scene5: 9600,
    scene6: 14350,
    scene7: 14800,
    scene8: 13800,
    scene9: 13250,
    scene10: 12600,
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
  audioSrc: 'audio/iliad-intro/host_narration_full.mp3',
  end: {
    line: "That's the opening. Continue with the Iliad in the reading room.",
    cta: 'Start reading the Iliad',
    href: '/app/start/Ἰλιάς',
  },
};
