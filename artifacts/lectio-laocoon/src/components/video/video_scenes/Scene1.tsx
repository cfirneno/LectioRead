import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 3200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-bg-dark"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      transition={{ duration: 1 }}
    >
      <motion.div 
        className="text-secondary tracking-[0.2em] uppercase text-[1.5vw] font-body mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        Welcome back to Lectio
      </motion.div>
      
      <div className="overflow-hidden">
        <motion.h1 
          className="text-[8vw] font-display font-medium leading-none text-text-inverse"
          initial={{ y: "100%" }}
          animate={phase >= 2 ? { y: 0 } : { y: "100%" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          LAOCOÖN
        </motion.h1>
      </div>
      
      <motion.div 
        className="h-[1px] bg-secondary mt-8"
        initial={{ width: 0, opacity: 0 }}
        animate={phase >= 2 ? { width: '15vw', opacity: 1 } : { width: 0, opacity: 0 }}
        transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
      />
      
      <motion.div 
        className="text-[2vw] font-display italic text-text-muted mt-8"
        initial={{ opacity: 0 }}
        animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1, delay: 1 }}
      >
        from Virgil's Aeneid
      </motion.div>
    </motion.div>
  );
}
