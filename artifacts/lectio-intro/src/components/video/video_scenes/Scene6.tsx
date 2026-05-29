import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10 px-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <motion.p 
        className="text-[3vw] font-body text-white font-light text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        Now you can read the opening lines too,<br/>
        <span className="text-[var(--color-primary)]">one paragraph at a time.</span>
      </motion.p>

      <motion.h1 
        className="text-[12vw] font-display text-white tracking-widest uppercase"
        initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
        animate={phase >= 2 ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : { opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      >
        Lectio
      </motion.h1>
    </motion.div>
  );
}
