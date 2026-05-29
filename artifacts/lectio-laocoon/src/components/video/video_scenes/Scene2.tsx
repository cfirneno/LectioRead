import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 6000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center bg-bg-dark"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <motion.div 
        className="absolute inset-0 w-full h-full"
        initial={{ scale: 1.2, filter: 'blur(20px)' }}
        animate={{ scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/horse.png`}
          alt="Wooden horse"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/40 to-transparent" />
      </motion.div>

      <div className="relative z-10 w-full max-w-7xl px-[10vw] flex flex-col justify-end h-full pb-[15vh]">
        <motion.p 
          className="text-[3vw] font-display text-text-inverse leading-tight max-w-3xl"
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          The great wooden horse stands abandoned outside the gates of Troy.
        </motion.p>
        
        <motion.p 
          className="text-[2vw] font-body font-light text-text-muted mt-4 max-w-2xl"
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          The Greek camp looks deserted. The war seemingly over.
        </motion.p>
      </div>
    </motion.div>
  );
}
