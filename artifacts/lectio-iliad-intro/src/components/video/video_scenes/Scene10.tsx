import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene10() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 5000),
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
          src={`${import.meta.env.BASE_URL}images/embers.png`}
          alt="Embers"
          className="w-full h-full object-cover opacity-50 mix-blend-color-dodge"
          initial={{ scale: 1.0 }}
          animate={{ scale: 1.05 }}
          transition={{ duration: 15, ease: 'linear' }}
        />
        <div 
          className="absolute inset-0 opacity-90"
          style={{ background: 'radial-gradient(circle, transparent 20%, var(--color-bg-dark) 100%)' }} 
        />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-5xl">
        <motion.h1
          className="text-[8vw] font-display text-text-inverse tracking-widest leading-none mb-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          transition={{ duration: 2, ease: "easeOut" }}
        >
          ΙΛΙΑΣ
        </motion.h1>

        <motion.div
          className="text-[2vw] font-display text-secondary/60 mb-12"
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 2 }}
        >
          Μῆνιν ἄειδε, θεά, Πηληϊάδεω Ἀχιλῆος
        </motion.div>

        <motion.div
          className="text-[3vw] font-display text-text-inverse italic drop-shadow-xl"
          initial={{ opacity: 0, y: 10 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 1.5 }}
        >
          "From a single word — wrath — flows the whole tragedy of Troy."
        </motion.div>
      </div>
    </motion.div>
  );
}
