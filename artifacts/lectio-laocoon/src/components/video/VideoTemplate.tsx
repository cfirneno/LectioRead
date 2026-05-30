import { useEffect, useRef, useState } from 'react';
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
import { SceneSerpents1 } from './video_scenes/SceneSerpents1';
import { SceneSerpents2 } from './video_scenes/SceneSerpents2';
import { Scene11 } from './video_scenes/Scene11';

export const SCENE_DURATIONS = {
  scene1: 4000,
  scene2: 7000,
  scene3: 10000,
  scene4: 6000,
  scene5: 8000,
  scene6: 8000,
  scene7: 8000,
  scene8: 18000,
  scene9: 13000,
  scene10: 15000,
  sceneSerpents1: 18000,
  sceneSerpents2: 27000,
  scene11: 6000,
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
  sceneSerpents1: SceneSerpents1,
  sceneSerpents2: SceneSerpents2,
  scene11: Scene11,
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
  const unlockingRef = useRef(false);
  const [needsGesture, setNeedsGesture] = useState(false);

  // Keep the narration aligned to the current scene's start. The audio plays
  // continuously; this only corrects drift when the scene changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.95;
    const targetTime = SCENE_START_SEC[baseSceneKey] ?? 0;
    if (Math.abs(audio.currentTime - targetTime) > AUDIO_SEEK_EPSILON_SEC) {
      audio.currentTime = targetTime;
    }
    audio.play().catch(() => {});
  }, [currentSceneKey, baseSceneKey]);

  // Sound on open: try audible autoplay first (browsers allow it for viewers
  // who have engaged with media before). If it's blocked, play MUTED but in
  // sync and show a prompt — so the first interaction unmutes instantly with no
  // restart or lag, since the audio has been running in time all along.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (muted) {
      audio.muted = true;
      return;
    }
    audio.muted = false;
    audio
      .play()
      .then(() => setNeedsGesture(false))
      .catch(() => {
        audio.muted = true;
        audio.play().catch(() => {});
        setNeedsGesture(true);
      });
  }, [muted]);

  const enableSound = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = false;
    // Only drop the prompt once sound is actually playing.
    audio.play().then(() => setNeedsGesture(false)).catch(() => {});
  };

  // While the muted fallback is active, the first real interaction anywhere
  // turns sound on. Gated on needsGesture so the listeners exist only until
  // sound is enabled.
  useEffect(() => {
    if (muted || !needsGesture) return;
    const unlock = () => {
      const audio = audioRef.current;
      if (!audio || unlockingRef.current) return;
      unlockingRef.current = true;
      audio.muted = false;
      audio
        .play()
        .then(() => setNeedsGesture(false))
        .catch(() => {})
        .finally(() => {
          unlockingRef.current = false;
        });
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('touchstart', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [muted, needsGesture]);

  return (
    <div className="w-full h-screen overflow-hidden relative bg-bg-dark text-text-inverse">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay" />
        <motion.div
          className="absolute -top-[50vh] -left-[50vw] w-[150vw] h-[150vh] opacity-20 blur-[120px] rounded-full"
          style={{ background: 'radial-gradient(circle, var(--color-primary), transparent 70%)' }}
          animate={{
            x: ['0%', '10%', '-5%', '0%'],
            y: ['0%', '-5%', '10%', '0%'],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-[50vh] -right-[50vw] w-[150vw] h-[150vh] opacity-10 blur-[100px] rounded-full"
          style={{ background: 'radial-gradient(circle, var(--color-secondary), transparent 60%)' }}
          animate={{
            x: ['0%', '-15%', '5%', '0%'],
            y: ['0%', '15%', '-5%', '0%'],
            scale: [1, 0.8, 1.2, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="absolute inset-0 z-10">
        <AnimatePresence mode="popLayout">
          {SceneComponent && <SceneComponent key={currentSceneKey} />}
        </AnimatePresence>
      </div>

      {hasEnded && !loop && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-black/75 px-6 text-center backdrop-blur-sm"
        >
          <p className="font-serif text-2xl md:text-3xl text-white/90 max-w-xl leading-snug">
            That's the preview. Continue with Aeneid Book II in the reading room.
          </p>
          <a
            href="/app/start/Aeneis%20II"
            target="_top"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-serif text-lg font-semibold text-black transition-transform hover:scale-105"
          >
            Start reading Aeneid Book II
            <span aria-hidden="true">→</span>
          </a>
        </motion.div>
      )}

      {needsGesture && !muted && (
        <button
          type="button"
          onClick={enableSound}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-black/55 backdrop-blur-[2px] cursor-pointer"
        >
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-white/95 text-black shadow-2xl transition-transform hover:scale-105">
            <svg viewBox="0 0 24 24" className="h-9 w-9 translate-x-[2px]" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="font-body text-sm uppercase tracking-[0.35em] text-white/90">
            Tap for sound
          </span>
        </button>
      )}

      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}audio/host_narration_full.mp3`}
        preload="auto"
      />
    </div>
  );
}
