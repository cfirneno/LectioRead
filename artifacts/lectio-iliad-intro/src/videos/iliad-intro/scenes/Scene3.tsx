import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),  // Eyebrow
      setTimeout(() => setPhase(2), 1500), // ILIAS
      setTimeout(() => setPhase(3), 5000), // Quote
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
          src={`${import.meta.env.BASE_URL}images/iliad-intro/troy.png`}
          alt="Troy"
          className="w-full h-full object-cover opacity-50"
          initial={{ scale: 1.1, x: '2%' }}
          animate={{ scale: 1.0, x: '0%' }}
          transition={{ duration: 20, ease: 'linear' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/50 to-bg-dark" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div
          className="text-[1.2vw] font-body tracking-[0.4em] text-secondary uppercase mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 1 }}
        >
          HOMER · THE ILIAD
        </motion.div>
        
        <motion.div
          className="h-[1px] bg-secondary/50 mb-8"
          initial={{ width: 0, opacity: 0 }}
          animate={phase >= 1 ? { width: '15vw', opacity: 1 } : { width: 0, opacity: 0 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        />

        <motion.h1
          className="text-[9vw] font-display text-text-inverse tracking-widest leading-none mb-12"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          transition={{ duration: 2, ease: "easeOut" }}
        >
          ΙΛΙΑΣ
        </motion.h1>

        <motion.div
          className="text-[2.5vw] font-display text-text-inverse italic max-w-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1.5 }}
        >
          "the rage of one man — and the ruin it brought to thousands."
        </motion.div>
      </div>
    </motion.div>
  );
}
