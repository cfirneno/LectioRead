import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 2000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center bg-bg-dark"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <motion.div 
        className="absolute inset-0 w-full h-full"
        animate={{ 
          scale: phase >= 2 ? [1, 1.05, 1.02, 1.04, 1.03] : 1,
          x: phase >= 2 ? [0, -10, 5, -5, 0] : 0,
          y: phase >= 2 ? [0, 5, -5, 2, 0] : 0
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/spear.png`}
          alt="Spear striking wood"
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-primary mix-blend-multiply opacity-20" />
      </motion.div>

      {phase >= 2 && (
        <motion.div 
          className="absolute inset-0 bg-white"
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}

      <div className="relative z-10 w-full text-center px-[10vw]">
        <motion.h2 
          className="text-[4.5vw] font-display text-text-inverse font-bold italic"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={phase >= 3 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 1, type: 'spring', bounce: 0.4 }}
          style={{ textShadow: '0 10px 30px rgba(0,0,0,0.8)' }}
        >
          A hollow sound echoes from within — arms clash in the hollow dark.
        </motion.h2>
      </div>
    </motion.div>
  );
}
