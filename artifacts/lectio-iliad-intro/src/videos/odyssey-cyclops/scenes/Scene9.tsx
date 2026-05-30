import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene9() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1000),
      setTimeout(() => setPhase(2), 5000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center bg-bg-dark"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <div className="absolute inset-0 z-0">
        <motion.img
          src={`${import.meta.env.BASE_URL}images/odyssey-cyclops/ship-fleeing.png`}
          alt="Ship fleeing"
          className="w-full h-full object-cover opacity-60"
          initial={{ scale: 1.05 }}
          animate={{ scale: 1.0 }}
          transition={{ duration: 15, ease: 'linear' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/40 to-bg-dark opacity-80" />
      </div>

      <div className="relative z-10 w-full text-center px-12 max-w-5xl">
        <motion.div
          className="text-[3.5vw] font-display text-text-inverse leading-snug drop-shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          "Safe at sea, Odysseus shouted back his true name."
          <br/>
          <motion.span 
            className="text-[2.5vw] italic text-secondary/90 mt-4 block"
            initial={{ opacity: 0 }} 
            animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            "A curse that would shadow the whole journey home."
          </motion.span>
        </motion.div>
      </div>
    </motion.div>
  );
}
