import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      transition={{ duration: 1 }}
    >
      <div className="absolute inset-0 overflow-hidden mix-blend-screen opacity-40">
        <video 
          src={`${import.meta.env.BASE_URL}videos/statue.mp4`}
          className="w-full h-full object-cover"
          autoPlay muted loop playsInline
        />
      </div>

      <div className="relative z-20 flex flex-col items-center justify-center">
        <motion.p 
          className="text-[2vw] font-body text-[var(--color-secondary)] uppercase tracking-[0.5em] mb-4"
          initial={{ opacity: 0, letterSpacing: '0em' }}
          animate={phase >= 1 ? { opacity: 1, letterSpacing: '0.5em' } : { opacity: 0, letterSpacing: '0em' }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        >
          Virgil's
        </motion.p>
        <motion.h2 
          className="text-[10vw] font-display text-white italic leading-none"
          initial={{ opacity: 0, rotateX: 90, y: 50 }}
          animate={phase >= 2 ? { opacity: 1, rotateX: 0, y: 0 } : { opacity: 0, rotateX: 90, y: 50 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformPerspective: 1000 }}
        >
          Aeneid
        </motion.h2>
      </div>
    </motion.div>
  );
}
