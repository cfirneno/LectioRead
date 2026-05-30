import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1000),
      setTimeout(() => setPhase(2), 4000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center bg-bg-dark"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
    >
      <div className="absolute inset-0 z-0">
        <motion.img
          src={`${import.meta.env.BASE_URL}images/odyssey-intro/muse_starlit.png`}
          alt="Muse"
          className="w-full h-full object-cover opacity-50 mix-blend-color-dodge"
          initial={{ scale: 1.0, x: '2%' }}
          animate={{ scale: 1.05, x: '0%' }}
          transition={{ duration: 15, ease: 'linear' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/40 to-bg-dark opacity-80" />
      </div>

      <div className="relative z-10 w-full text-center px-12 max-w-5xl">
        <motion.div
          className="text-[3vw] font-display text-text-inverse leading-snug drop-shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          "In English, it asks the Muse:<br/>
          <motion.span 
            className="italic text-secondary block mt-4"
            initial={{ opacity: 0 }} 
            animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            tell me of the man of many turns, the man of twists and wiles."
          </motion.span>
        </motion.div>
      </div>
    </motion.div>
  );
}
