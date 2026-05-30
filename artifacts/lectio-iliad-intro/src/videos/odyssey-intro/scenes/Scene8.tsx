import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene8() {
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
      className="absolute inset-0 flex flex-col items-center justify-center bg-bg-dark"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
    >
      <div className="absolute inset-0 z-0">
        <motion.img
          src={`${import.meta.env.BASE_URL}images/odyssey-intro/sun_cattle.png`}
          alt="Sun cattle"
          className="w-full h-full object-cover opacity-60"
          initial={{ scale: 1.0, y: '2%' }}
          animate={{ scale: 1.05, y: '0%' }}
          transition={{ duration: 20, ease: 'linear' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/50 to-bg-dark opacity-90" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-5xl">
        <motion.div 
          className="text-[3vw] font-display text-text-inverse leading-snug drop-shadow-2xl"
          initial={{ opacity: 0, y: 10 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          "But he could not save them. They perished by their own folly &mdash;<br/>
          <motion.span 
            className="block mt-4"
            initial={{ opacity: 0 }} 
            animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            fools, who devoured the cattle of the Sun, and the god took their homecoming away."
          </motion.span>
        </motion.div>
      </div>
    </motion.div>
  );
}
