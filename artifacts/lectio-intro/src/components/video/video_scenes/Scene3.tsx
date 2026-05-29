import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene3() {
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
      className="absolute inset-0 flex items-center justify-center z-10 px-24"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="w-full flex flex-col md:flex-row gap-16 items-center justify-center">
        <div className="flex-1 text-right border-r border-[var(--color-secondary)] pr-16 py-8">
          <motion.h3 
            className="text-[5vw] font-display text-[var(--color-primary)] leading-tight italic"
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={phase >= 1 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          >
            "Arma virumque cano"
          </motion.h3>
        </div>
        
        <div className="flex-1 text-left pl-8">
          <motion.p 
            className="text-[3vw] font-body text-white/80 font-light leading-snug"
            initial={{ opacity: 0, x: -20 }}
            animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          >
            I sing of arms and the man.
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}
