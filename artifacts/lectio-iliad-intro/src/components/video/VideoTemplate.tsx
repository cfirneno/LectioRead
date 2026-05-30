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

// Each scene window equals its narration segment length in
// public/audio/host_narration_full.mp3 (audio is the master clock).
export const SCENE_DURATIONS = {
  scene1: 16800,
  scene2: 10900,
  scene3: 14800,
  scene4: 9000,
  scene5: 9800,
  scene6: 14500,
  scene7: 14900,
  scene8: 13900,
  scene9: 13400,
  scene10: 13500,
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
  // Recording/export harnesses drive playback with no user gesture, so start
  // active immediately when one is present (avoids capturing the start screen).
  // Interactive viewers start paused on the branded start screen.
  const isRecording = typeof window !== 'undefined' && !!window.startRecording;
  const [started, setStarted] = useState(() => isRecording);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Interactive playback derives the scene from the narration's clock so words
  // and images stay locked together; recording/export stays timer-driven.
  const { currentSceneKey, hasEnded } = useVideoPlayer({
    durations,
    loop,
    active: started,
    driveFromAudio: started && !isRecording,
    audioRef,
  });

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  // The play button is a real user gesture, so starting audio here always
  // unlocks sound — both the video and narration launch together.
  const handleStart = () => {
    setStarted(true);
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = muted;
    audio.volume = 0.95;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  };

  // Keep live mute toggles in sync once playback has started.
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.muted = muted;
  }, [muted, started]);

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
            That's the opening. Continue with the Iliad in the reading room.
          </p>
          <a
            href="/app/start/Ἰλιάς"
            target="_top"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-serif text-lg font-semibold text-black transition-transform hover:scale-105"
          >
            Start reading the Iliad
            <span aria-hidden="true">→</span>
          </a>
        </motion.div>
      )}

      {!started && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-10 bg-bg-dark px-6 text-center"
        >
          <div className="flex flex-col items-center">
            <span className="font-body text-[1.1vw] uppercase tracking-[0.35em] text-secondary">
              Welcome back to Lectio
            </span>
            <h1 className="mt-4 font-display font-medium leading-none text-text-inverse text-[7vw]">
              ΙΛΙΑΣ
            </h1>
            <span className="mt-1 h-[1px] w-[12vw] bg-secondary" />
            <span className="mt-4 font-display italic text-text-muted text-[1.8vw]">
              from Homer's Iliad
            </span>
          </div>

          <button
            type="button"
            onClick={handleStart}
            aria-label="Play"
            className="group flex flex-col items-center gap-4"
          >
            <span className="flex h-24 w-24 items-center justify-center rounded-full border border-secondary/40 bg-white/[0.04] text-secondary backdrop-blur-sm transition-all duration-300 group-hover:scale-105 group-hover:border-secondary group-hover:bg-secondary/10">
              <svg viewBox="0 0 24 24" className="h-9 w-9 translate-x-[2px]" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className="font-body text-sm uppercase tracking-[0.35em] text-text-muted transition-colors group-hover:text-text-inverse">
              Play with sound
            </span>
          </button>
        </motion.div>
      )}

      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}audio/host_narration_full.mp3`}
        preload="auto"
      />
    </div>
  );
}
