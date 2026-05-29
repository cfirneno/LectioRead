import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 1500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center bg-bg-dark"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: '-10%' }}
      transition={{ duration: 1.5 }}
    >
      <motion.div 
        className="absolute inset-0 w-full h-full"
        initial={{ scale: 1.1, y: '5%' }}
        animate={{ scale: 1, y: '0%' }}
        transition={{ duration: 8, ease: "easeOut" }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/sea.png`}
          alt="Serpents rising from sea"
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-transparent to-bg-dark/50" />
      </motion.div>

      <div className="relative z-10 w-full max-w-5xl px-[10vw] text-center mt-[40vh]">
        <motion.p 
          className="text-[3vw] font-display text-text-inverse leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ textShadow: '0 4px 20px rgba(0,0,0,0.9)' }}
        >
          From the calm sea, two enormous serpents rise and surge toward the shore, straight for Laocoön and his sons.
        </motion.p>
      </div>
    </motion.div>
  );
}
