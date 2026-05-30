import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),  // WRATH
      setTimeout(() => setPhase(2), 2500), // mênis
      setTimeout(() => setPhase(3), 5000), // a rage...
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-bg-dark"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <div className="absolute inset-0 z-0">
        <motion.img
          src={`${import.meta.env.BASE_URL}images/iliad-intro/embers.png`}
          alt="Embers"
          className="w-full h-full object-cover opacity-60 mix-blend-color-dodge"
          initial={{ scale: 1.0 }}
          animate={{ scale: 1.05 }}
          transition={{ duration: 15, ease: 'linear' }}
        />
        <div 
          className="absolute inset-0 opacity-90"
          style={{ background: 'radial-gradient(circle, transparent 20%, var(--color-bg-dark) 100%)' }} 
        />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div
          className="text-[9vw] font-display font-bold tracking-widest text-primary leading-none"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        >
          WRATH
        </motion.div>

        <motion.div
          className="mt-4 flex flex-col items-center gap-1"
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.2 }}
        >
          <span className="text-[4vw] font-display text-secondary">μῆνις</span>
          <span className="text-[1.5vw] font-body tracking-widest text-text-muted italic">mênis</span>
        </motion.div>

        <motion.div
          className="mt-12 text-[2.5vw] font-display text-text-inverse italic"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1.5 }}
        >
          "a rage so fierce it belongs to the gods."
        </motion.div>
      </div>
    </motion.div>
  );
}
