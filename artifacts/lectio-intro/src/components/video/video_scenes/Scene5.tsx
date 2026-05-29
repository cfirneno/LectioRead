import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10 px-24"
      initial={{ opacity: 0, filter: 'blur(20px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, filter: 'blur(20px)' }}
      transition={{ duration: 1.5 }}
    >
      <motion.h3 
        className="text-[6vw] font-display text-[var(--color-secondary)] uppercase tracking-widest text-center"
        initial={{ opacity: 0, scale: 1.2 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.2 }}
        transition={{ duration: 2, ease: 'easeOut' }}
      >
        Two Thousand Years
      </motion.h3>
      
      <motion.p 
        className="text-[2.5vw] font-body text-white/80 mt-8 text-center max-w-3xl"
        initial={{ opacity: 0, y: 30 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        Read in its original Latin.
      </motion.p>
    </motion.div>
  );
}
