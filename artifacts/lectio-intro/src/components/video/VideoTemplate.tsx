import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { Scene6 } from './video_scenes/Scene6';

const SCENE_DURATIONS = {
  scene1: 5000,
  scene2: 4000,
  scene3: 7000,
  scene4: 7000,
  scene5: 5000,
  scene6: 5000,
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({
    durations: SCENE_DURATIONS,
  });

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
        {currentScene === 0 && <Scene1 key="scene1" />}
        {currentScene === 1 && <Scene2 key="scene2" />}
        {currentScene === 2 && <Scene3 key="scene3" />}
        {currentScene === 3 && <Scene4 key="scene4" />}
        {currentScene === 4 && <Scene5 key="scene5" />}
        {currentScene === 5 && <Scene6 key="scene6" />}
      </AnimatePresence>
    </div>
  );
}
