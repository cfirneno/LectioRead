import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
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
          src={`${import.meta.env.BASE_URL}images/muse.png`}
          alt="Muse"
          className="w-full h-full object-cover opacity-60"
          initial={{ scale: 1.0, y: '0%' }}
          animate={{ scale: 1.02, y: '1%' }}
          transition={{ duration: 15, ease: 'linear' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/40 to-bg-dark opacity-90" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full px-12 max-w-5xl text-center">
        <motion.div 
          className="text-[2.5vw] font-display text-text-inverse/40 mb-12"
          initial={{ y: 20, scale: 1.1 }}
          animate={{ y: 0, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          Μῆνιν ἄειδε, θεά, Πηληϊάδεω Ἀχιλῆος
        </motion.div>

        <motion.div
          className="text-[4.5vw] font-display text-text-inverse leading-tight drop-shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          "Sing, O goddess, of the wrath of Achilles, son of Peleus."
        </motion.div>
      </div>
    </motion.div>
  );
}
