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
  const isRecording = typeof window !== 'undefined' && !!window.startRecording;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const totalMs = Object.values(durations).reduce((a, b) => a + b, 0);

  // Both interactive playback and recording derive the visible scene from the
  // narration's clock so words and images stay locked to the audio. During an
  // export we play exactly once (no loop) so the narration's `ended` event can
  // cleanly stop the recording.
  const { currentSceneKey, hasEnded } = useVideoPlayer({
    durations,
    loop: isRecording ? false : loop,
    driveFromAudio: true,
    audioRef,
  });

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  // Start the narration from the top (no user gesture exists in the preview or
  // the recorder). The audio clock then drives scene selection above so the
  // visuals can't drift. Muting before play() keeps an embedded preview silent
  // while the (muted) audio clock still advances.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = muted;
    audio.volume = 0.95;
    audio.loop = false;
    audio.currentTime = 0;

    // During an export, stop the moment the narration ends. `ended` and the
    // wall-clock backstop fire even when the tab is backgrounded (where the
    // rAF scene clock is throttled), so the export can't hang at the end.
    let stopped = false;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      window.stopRecording?.();
    };
    const onEnded = isRecording ? () => stop() : null;
    if (onEnded) audio.addEventListener('ended', onEnded);
    const backstop = isRecording ? window.setTimeout(stop, totalMs + 5000) : undefined;

    const tryPlay = () => {
      audio.play().catch(() => {});
    };
    if (audio.readyState >= 2) tryPlay();
    else audio.addEventListener('canplay', tryPlay, { once: true });
    return () => {
      if (onEnded) audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('canplay', tryPlay);
      if (backstop !== undefined) window.clearTimeout(backstop);
    };
  }, [muted, isRecording, totalMs]);

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

      {hasEnded && !loop && !isRecording && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-black/75 px-6 text-center backdrop-blur-sm"
        >
          <p className="font-serif text-2xl md:text-3xl text-white/90 max-w-xl leading-snug">
            That's the introduction. Continue with the Aeneid in the reading room.
          </p>
          <a
            href="/app/start/Aeneis"
            target="_top"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-serif text-lg font-semibold text-black transition-transform hover:scale-105"
          >
            Start reading the Aeneid
            <span aria-hidden="true">→</span>
          </a>
        </motion.div>
      )}

      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}audio/host_narration_full.mp3`}
        preload="auto"
        muted={muted}
      />
    </div>
  );
}
