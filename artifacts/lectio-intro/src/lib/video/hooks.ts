// Video player hook - handles recording lifecycle, scene advancement, and looping

import { useState, useEffect, useRef, type RefObject } from 'react';

declare global {
  interface Window {
    startRecording?: () => Promise<void>;
    stopRecording?: () => void;
  }
}

export interface SceneDurations {
  [key: string]: number;
}

export interface UseVideoPlayerOptions {
  durations: SceneDurations;
  onVideoEnd?: () => void;
  loop?: boolean;
  /** When false, the scene timeline is paused (e.g. before the user hits play). */
  active?: boolean;
  /**
   * When true, the visible scene is derived from `audioRef`'s playback clock
   * instead of independent timers, so images stay locked to the narration.
   * Used for interactive playback; recording/export stays timer-driven.
   */
  driveFromAudio?: boolean;
  audioRef?: RefObject<HTMLMediaElement | null>;
}

export interface UseVideoPlayerReturn {
  currentScene: number;
  totalScenes: number;
  currentSceneKey: string;
  hasEnded: boolean;
}

export function useVideoPlayer(options: UseVideoPlayerOptions): UseVideoPlayerReturn {
  const { durations, onVideoEnd, loop = true, active = true, driveFromAudio = false, audioRef } =
    options;

  // Captured once on mount -- durations must be a static object
  const sceneKeys = useRef(Object.keys(durations)).current;
  const totalScenes = sceneKeys.length;
  const durationsArray = useRef(Object.values(durations)).current;

  // Cumulative scene start times (seconds) and total length, for the audio clock.
  const sceneStartsSec = useRef(
    (() => {
      const starts: number[] = [];
      let cumMs = 0;
      for (const ms of durationsArray) {
        starts.push(cumMs / 1000);
        cumMs += ms;
      }
      return starts;
    })(),
  ).current;
  const totalSec = useRef(durationsArray.reduce((a, b) => a + b, 0) / 1000).current;

  const [currentScene, setCurrentScene] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);
  // When recording (loop=false), the hook itself must signal the exporter to
  // stop once the single pass finishes. The export pipeline waits for this
  // call; relying only on an external backstop timer can hang the export.
  const stoppedRef = useRef(false);

  // Start recording on mount
  useEffect(() => {
    window.startRecording?.();
  }, []);

  // Audio-clock mode: the narration drives which scene is visible, so words and
  // images can't drift apart. Each frame, pick the scene whose window contains
  // audio.currentTime.
  useEffect(() => {
    if (!active || !driveFromAudio) return;
    const audio = audioRef?.current;
    if (!audio) return;

    let raf = 0;
    const tick = () => {
      const t = audio.currentTime;
      let idx = 0;
      for (let i = 0; i < sceneStartsSec.length; i++) {
        if (t >= sceneStartsSec[i]) idx = i;
        else break;
      }
      setCurrentScene(prev => (prev === idx ? prev : idx));

      if (t >= totalSec - 0.05) {
        if (!hasEnded) {
          setHasEnded(true);
          onVideoEnd?.();
        }
        if (loop) {
          audio.currentTime = 0;
        } else {
          audio.pause();
          if (!stoppedRef.current) {
            stoppedRef.current = true;
            window.stopRecording?.();
          }
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, driveFromAudio, audioRef, sceneStartsSec, totalSec, hasEnded, loop, onVideoEnd]);

  // Timer mode (recording/export): scenes advance on their own clock.
  useEffect(() => {
    if (!active || driveFromAudio) return;
    if (hasEnded && !loop) return;

    const currentDuration = durationsArray[currentScene];

    const timer = setTimeout(() => {
      // Last scene just finished playing
      if (currentScene >= totalScenes - 1) {
        if (!hasEnded) {
          setHasEnded(true);
          onVideoEnd?.();
        }
        if (loop) {
          setCurrentScene(0);
        }
      } else {
        setCurrentScene(prev => prev + 1);
      }
    }, currentDuration);

    return () => clearTimeout(timer);
  }, [active, driveFromAudio, currentScene, totalScenes, durationsArray, hasEnded, loop, onVideoEnd]);

  return {
    currentScene,
    totalScenes,
    currentSceneKey: sceneKeys[currentScene],
    hasEnded,
  };
}

export function useSceneTimer(events: Array<{ time: number; callback: () => void }>) {
  const firedRef = useRef<Set<number>>(new Set());
  const callbacksRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    callbacksRef.current = events.map(e => e.callback);
  }, [events]);

  const scheduleKey = events.map((event, i) => `${i}:${event.time}`).join('|');

  useEffect(() => {
    firedRef.current = new Set();

    const timers = events.map(({ time }, index) => {
      return setTimeout(() => {
        if (!firedRef.current.has(index)) {
          firedRef.current.add(index);
          callbacksRef.current[index]?.();
        }
      }, time);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [scheduleKey]);
}
