import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene7() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 6000),
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
          src={`${import.meta.env.BASE_URL}images/hades.png`}
          alt="Hades underworld"
          className="w-full h-full object-cover opacity-60 mix-blend-luminosity"
          initial={{ scale: 1.0, y: '0%' }}
          animate={{ scale: 1.05, y: '-2%' }}
          transition={{ duration: 20, ease: 'linear' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/40 to-bg-dark opacity-90" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full px-12 max-w-6xl text-center">
        <motion.div 
          className="text-[4vw] font-display text-text-inverse leading-tight mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1.5 }}
        >
          πολλὰς δ᾽ ἰφθίμους ψυχὰς Ἄϊδι προΐαψεν
        </motion.div>

        <motion.div
          className="text-[2.5vw] font-display text-text-muted italic"
          initial={{ opacity: 0, y: 10 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 1.5 }}
        >
          "and sent many mighty souls down to Hades."
        </motion.div>
      </div>
    </motion.div>
  );
}
