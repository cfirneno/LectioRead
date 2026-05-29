import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene7() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 4000),
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
      <motion.div 
        className="absolute inset-0 w-full h-full"
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 3, ease: "easeOut" }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/gates.png`}
          alt="Trojans drag horse"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/60 to-transparent" />
      </motion.div>

      <div className="relative z-10 w-full flex flex-col items-center text-center px-[10vw]">
        <motion.p 
          className="text-[2.5vw] font-display text-text-muted italic max-w-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          Terrified by the omen, the Trojans drag the horse inside the walls.
        </motion.p>
        
        <motion.div 
          className="mt-16 bg-white/5 backdrop-blur-md border border-white/10 px-12 py-8 rounded-2xl"
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={phase >= 3 ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.9, y: 40 }}
          transition={{ duration: 1.2, type: 'spring', bounce: 0.4 }}
        >
          <h3 className="text-[1.8vw] font-body text-secondary tracking-widest uppercase mb-4">
            Read the passage yourself
          </h3>
          <p className="text-[3.5vw] font-display text-text-inverse font-bold mb-2">
            In the original Latin
          </p>
          <div className="text-[1.5vw] font-body text-text-muted">
            Only on <span className="text-white font-semibold tracking-wider">LECTIO</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
