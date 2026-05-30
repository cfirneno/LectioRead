import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),  // 1st word
      setTimeout(() => setPhase(2), 2000), // 2nd word
      setTimeout(() => setPhase(3), 3500), // 3rd word
      setTimeout(() => setPhase(4), 5000), // 4th word
      setTimeout(() => setPhase(5), 7000), // English gloss
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
          src={`${import.meta.env.BASE_URL}images/odyssey-cyclops/wine-krater.png`}
          alt="Wine Krater"
          className="w-full h-full object-cover opacity-60"
          initial={{ scale: 1.05, y: '-2%' }}
          animate={{ scale: 1.0, y: '0%' }}
          transition={{ duration: 15, ease: 'linear' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/40 to-bg-dark opacity-90" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-12">
        <div className="text-[6vw] font-display text-text-inverse leading-tight flex justify-center flex-wrap gap-6 drop-shadow-2xl">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            Οὖτις
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            ἐμοί
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            γ᾽
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            ὄνομα
          </motion.span>
        </div>

        <motion.div
          className="mt-8 text-[2vw] font-display text-secondary/80 italic tracking-wide"
          initial={{ opacity: 0 }}
          animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 2 }}
        >
          "'Nobody' is my name."
        </motion.div>
      </div>
    </motion.div>
  );
}
