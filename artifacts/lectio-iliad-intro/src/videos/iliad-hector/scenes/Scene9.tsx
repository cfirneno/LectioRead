import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene9() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),  // 1st word
      setTimeout(() => setPhase(2), 1500), // 2nd word
      setTimeout(() => setPhase(3), 2500), // 3rd word
      setTimeout(() => setPhase(4), 3500), // 4th word
      setTimeout(() => setPhase(5), 4500), // 5th word
      setTimeout(() => setPhase(6), 5500), // 6th word
      setTimeout(() => setPhase(7), 7500), // English gloss
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
          src={`${import.meta.env.BASE_URL}images/iliad-hector/hector-fallen.png`}
          alt="Hector fallen"
          className="w-full h-full object-cover opacity-60"
          initial={{ scale: 1.05, y: '2%' }}
          animate={{ scale: 1.0, y: '0%' }}
          transition={{ duration: 15, ease: 'linear' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/50 to-bg-dark opacity-90" />
      </div>

      <div className="relative z-10 w-full text-center px-12 flex flex-col items-center">
        <div className="text-[4vw] font-display text-text-inverse leading-tight flex justify-center flex-wrap gap-4 drop-shadow-2xl mb-8">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            ψυχὴ
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            δ᾽
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            ἐκ
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            ῥεθέων
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            πταμένη
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 6 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            Ἄϊδόσδε
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 6 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            βεβήκει
          </motion.span>
        </div>
        
        <motion.div
          className="text-[2vw] font-display text-secondary/80 italic tracking-wide"
          initial={{ opacity: 0 }}
          animate={phase >= 7 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}
        >
          "his soul, flying from his limbs, went down to Hades"
        </motion.div>
      </div>
    </motion.div>
  );
}
