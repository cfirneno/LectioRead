import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1000),
      setTimeout(() => setPhase(2), 4500),
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
          src={`${import.meta.env.BASE_URL}images/odyssey-cyclops/glowing-stake.png`}
          alt="Glowing stake"
          className="w-full h-full object-cover opacity-60 mix-blend-screen"
          initial={{ scale: 1.0, y: '2%' }}
          animate={{ scale: 1.05, y: '0%' }}
          transition={{ duration: 15, ease: 'linear' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/40 to-bg-dark opacity-90" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-5xl">
        <motion.h2 
          className="text-[3.5vw] font-display text-text-inverse leading-snug drop-shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          "They heated a great stake of olive-wood..."
        </motion.h2>

        <motion.div
          className="text-[3.5vw] font-display text-text-inverse italic mt-6"
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={phase >= 2 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 2 }}
        >
          "...and drove it deep into his single eye."
        </motion.div>
      </div>
    </motion.div>
  );
}
