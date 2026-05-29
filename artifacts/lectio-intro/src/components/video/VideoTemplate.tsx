import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { Scene6 } from './video_scenes/Scene6';
import { Scene7 } from './video_scenes/Scene7';
import { Scene8 } from './video_scenes/Scene8';
import { Scene9 } from './video_scenes/Scene9';
import { Scene10 } from './video_scenes/Scene10';

export const SCENE_DURATIONS = {
  scene1: 5000,
  scene2: 4000,
  scene3: 7000,
  scene4: 7000,
  scene5: 5000,
  scene6: 5000,
  scene7: 22000,
  scene8: 14000,
  scene9: 23000,
  scene10: 6000,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
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
};

const SCENE_START_SEC: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  let cumulativeMs = 0;
  for (const [key, ms] of Object.entries(SCENE_DURATIONS)) {
    out[key] = cumulativeMs / 1000;
    cumulativeMs += ms;
  }
  return out;
})();

const AUDIO_SEEK_EPSILON_SEC = 0.18;

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  muted = false,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  muted?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentSceneKey, hasEnded } = useVideoPlayer({ durations, loop });

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.95;
    const targetTime = SCENE_START_SEC[baseSceneKey] ?? 0;
    if (Math.abs(audio.currentTime - targetTime) > AUDIO_SEEK_EPSILON_SEC) {
      audio.currentTime = targetTime;
    }
    audio.play().catch(() => {});
  }, [currentSceneKey, baseSceneKey, muted]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[var(--color-bg-dark)] text-white">
      {/* Persistent Background */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/parchment.png)`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          animate={{ scale: [1, 1.05, 1], filter: ['brightness(1)', 'brightness(0.8)', 'brightness(1)'] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(circle at center, transparent 0%, #0a0a0a 100%)' }}
        />
      </div>

      <AnimatePresence mode="popLayout">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>

      {hasEnded && !loop && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-black/75 px-6 text-center backdrop-blur-sm"
        >
          <p className="font-serif text-2xl md:text-3xl text-white/90 max-w-xl leading-snug">
            That's the introduction. Continue in the reading room for the rest of the lesson.
          </p>
          <a
            href="/app/continue"
            target="_top"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-serif text-lg font-semibold text-black transition-transform hover:scale-105"
          >
            Continue in the reading room
            <span aria-hidden="true">→</span>
          </a>
        </motion.div>
      )}

      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}audio/host_narration_full.mp3`}
        preload="auto"
        autoPlay
        muted={muted}
      />
    </div>
  );
}
