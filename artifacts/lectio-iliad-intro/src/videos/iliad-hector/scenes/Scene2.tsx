import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene2() {
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
      className="absolute inset-0 flex flex-col items-center justify-center bg-bg-dark"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
    >
      <div className="absolute inset-0 z-0">
        <motion.img
          src={`${import.meta.env.BASE_URL}images/iliad-hector/hector-alone.png`}
          alt="Hector alone"
          className="w-full h-full object-cover opacity-60"
          initial={{ scale: 1.0, y: '2%' }}
          animate={{ scale: 1.05, y: '0%' }}
          transition={{ duration: 20, ease: 'linear' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/30 to-bg-dark opacity-90" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-4xl">
        <motion.div 
          className="text-[3vw] font-display text-text-inverse leading-snug drop-shadow-2xl mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          "The Trojan army has fled in terror behind the gates."
        </motion.div>
        
        <motion.div 
          className="text-[3vw] font-display text-secondary/90 italic"
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          "One man stays outside — Hector, their greatest warrior,<br/>the shield of his city, waiting alone."
        </motion.div>
      </div>
    </motion.div>
  );
}
