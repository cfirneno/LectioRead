import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene8() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 8000),
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
          src={`${import.meta.env.BASE_URL}images/quarrel.png`}
          alt="Quarrel"
          className="w-full h-full object-cover opacity-50"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1.0 }}
          transition={{ duration: 15, ease: 'linear' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/50 to-bg-dark opacity-90" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full px-12">
        <div className="flex items-center justify-center gap-12 mb-16">
          <motion.div 
            className="flex flex-col items-center text-right"
            initial={{ opacity: 0, x: -30 }}
            animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <span className="text-[5vw] font-display text-text-inverse">Ἀχιλλεύς</span>
            <span className="text-[1.5vw] font-body tracking-widest text-text-muted uppercase">Achilles</span>
          </motion.div>
          
          <motion.div 
            className="w-[2px] h-32 bg-secondary"
            initial={{ scaleY: 0, opacity: 0 }}
            animate={phase >= 2 ? { scaleY: 1, opacity: 1 } : { scaleY: 0, opacity: 0 }}
            transition={{ duration: 1 }}
          />

          <motion.div 
            className="flex flex-col items-center text-left"
            initial={{ opacity: 0, x: 30 }}
            animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <span className="text-[5vw] font-display text-text-inverse">Ἀγαμέμνων</span>
            <span className="text-[1.5vw] font-body tracking-widest text-text-muted uppercase">Agamemnon</span>
          </motion.div>
        </div>

        <motion.div
          className="text-[3vw] font-display text-text-inverse italic"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1.5 }}
        >
          "a quarrel over honor."
        </motion.div>
      </div>
    </motion.div>
  );
}
