import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 5000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-start bg-bg-dark"
      initial={{ opacity: 0, x: '10%' }}
      animate={{ opacity: 1, x: '0%' }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div 
        className="absolute right-0 top-0 w-[60%] h-full"
        initial={{ opacity: 0, x: '20%' }}
        animate={{ opacity: 1, x: '0%' }}
        transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/statue.png`}
          alt="Laocoon statue"
          className="w-full h-full object-cover opacity-80"
          style={{ maskImage: 'linear-gradient(to right, transparent, black 40%)' }}
        />
      </motion.div>

      <div className="relative z-10 w-full px-[10vw] max-w-[60vw]">
        <motion.h2 
          className="text-[2vw] text-secondary font-body tracking-widest uppercase mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
        >
          The Priest is Not Deceived
        </motion.h2>

        <motion.div 
          className="relative pl-8 border-l-4 border-primary"
          initial={{ opacity: 0, x: -30 }}
          animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[4vw] font-display italic leading-tight text-text-inverse">
            "Timeo Danaos et dona ferentes"
          </p>
        </motion.div>
        
        <motion.div
          className="mt-8 pl-8"
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <p className="text-[2vw] font-body font-light text-text-muted">
            "I fear the Greeks, even bearing gifts."
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
