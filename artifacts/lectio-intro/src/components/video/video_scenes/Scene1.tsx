import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 4000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="overflow-hidden">
        <motion.h1 
          className="text-[12vw] font-display text-[var(--color-primary)] leading-none tracking-widest uppercase"
          initial={{ y: '100%' }}
          animate={phase >= 1 ? { y: 0 } : { y: '100%' }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          Lectio
        </motion.h1>
      </div>
      
      <motion.div 
        className="mt-8 text-center max-w-3xl px-8"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        <p className="text-[2.5vw] font-body text-[var(--color-text-muted)] font-light tracking-wide">
          Read great works in their original language.
        </p>
      </motion.div>
    </motion.div>
  );
}
