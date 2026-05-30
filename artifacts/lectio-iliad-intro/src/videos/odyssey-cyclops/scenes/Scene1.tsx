import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1000),
      setTimeout(() => setPhase(2), 3000),
      setTimeout(() => setPhase(3), 6000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-bg-dark"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
    >
      <div className="absolute inset-0 z-0">
        <motion.img
          src={`${import.meta.env.BASE_URL}images/odyssey-cyclops/cyclops-cave.png`}
          alt="Cyclops"
          className="w-full h-full object-cover opacity-50 mix-blend-screen"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1.0 }}
          transition={{ duration: 20, ease: 'linear' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/60 to-bg-dark opacity-80" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-5xl">
        <motion.div 
          className="text-secondary tracking-[0.3em] uppercase text-[1.2vw] font-body mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          THE MONSTERS
        </motion.div>
        
        <motion.h2 
          className="text-[3.5vw] font-display text-text-inverse leading-snug drop-shadow-2xl"
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={phase >= 2 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 2, ease: "easeOut" }}
        >
          "Of all the monsters Odysseus faced..."
        </motion.h2>

        <motion.div
          className="text-[2.5vw] font-display text-text-inverse italic mt-6"
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}
        >
          "...none was more terrible than the Cyclops."
        </motion.div>
      </div>
    </motion.div>
  );
}
