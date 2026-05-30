import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1000),
      setTimeout(() => setPhase(2), 3000),
      setTimeout(() => setPhase(3), 6000),
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
          src={`${import.meta.env.BASE_URL}images/odyssey-intro/wanderer.png`}
          alt="Wanderer"
          className="w-full h-full object-cover opacity-60"
          initial={{ scale: 1.05 }}
          animate={{ scale: 1.0 }}
          transition={{ duration: 20, ease: 'linear' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/40 to-bg-dark opacity-90" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-4xl">
        <motion.div 
          className="text-[3vw] font-display text-text-inverse leading-snug drop-shadow-2xl"
          initial={{ opacity: 0, y: 10 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          "The very first word is <span className="text-secondary font-display text-[3.5vw]">ἄνδρα</span> &mdash; the man.<br/>
          <motion.span 
            initial={{ opacity: 0 }} 
            animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            Not yet his name.
          </motion.span>
          <br/>
          <motion.span 
            initial={{ opacity: 0 }} 
            animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="block mt-4"
          >
            First we are told only that he is <span className="text-secondary font-display text-[3.5vw]">πολύτροπος</span>, the man of many ways."
          </motion.span>
        </motion.div>
      </div>
    </motion.div>
  );
}
