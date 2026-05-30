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
export const odysseyCyclops: VideoConfig = {
  slug: 'odyssey-cyclops',
  work: "Homer's Odyssey",
  greekTitle: 'ΟΔΥΣΣΕΙΑ Ι',
  menuTitle: 'Odysseus and the Cyclops',
  menuSubtitle: 'Book IX — trapped in the cave of Polyphemus, cunning is the only way out.',
  poster: 'images/odyssey-cyclops/cyclops-cave.png',
  start: { eyebrow: 'Welcome back to Lectio', subtitle: "from Homer's Odyssey, Book IX" },
  durations: {
    scene1: 13100,
    scene2: 19200,
    scene3: 20400,
    scene4: 15200,
    scene5: 20100,
    scene6: 12500,
    scene7: 19200,
    scene8: 19100,
    scene9: 24700,
    scene10: 20300,
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
  audioSrc: 'audio/odyssey-cyclops/host_narration_full.mp3',
  end: {
    line: "That's the escape. Read the Cyclops episode in the reading room.",
    cta: 'Start reading Odyssey IX',
    href: '/app/start/Ὀδύσσεια%20IX',
  },
};
