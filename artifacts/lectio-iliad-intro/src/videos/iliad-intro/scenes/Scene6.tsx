import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),  // line ("the very first word is mēnin")
      setTimeout(() => setPhase(2), 2000), // highlight Μῆνιν (~"mēnin" 1.8s)
      setTimeout(() => setPhase(3), 6800), // "anger itself" line (~7.0s)
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-bg-dark"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <div className="absolute inset-0 z-0">
        <motion.img
          src={`${import.meta.env.BASE_URL}images/iliad-intro/embers.png`}
          alt="Embers"
          className="w-full h-full object-cover opacity-50 mix-blend-color-dodge"
          initial={{ scale: 1.05 }}
          animate={{ scale: 1.0 }}
          transition={{ duration: 20, ease: 'linear' }}
        />
        <div 
          className="absolute inset-0 opacity-90"
          style={{ background: 'radial-gradient(circle, transparent 20%, var(--color-bg-dark) 100%)' }} 
        />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-5xl px-12 text-center">
        <motion.div 
          className="text-[4vw] font-display text-text-inverse/40 mb-16"
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <motion.span 
            className="inline-block"
            animate={phase >= 2 ? { color: 'var(--color-secondary)', scale: 1.2, textShadow: '0 0 20px rgba(212,175,55,0.5)' } : {}}
            transition={{ duration: 1 }}
          >
            Μῆνιν
          </motion.span>
          {' '}ἄειδε, θεά…
        </motion.div>

        <motion.div
          className="text-[2.5vw] font-body text-secondary tracking-widest uppercase mb-12 flex flex-col items-center"
          initial={{ opacity: 0, y: 10 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 1 }}
        >
          <span className="font-display text-[4vw] normal-case">Μῆνιν</span>
          <span className="mt-2 text-white/80">— "wrath"</span>
        </motion.div>

        <motion.div
          className="text-[3.5vw] font-display text-text-inverse italic drop-shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1.5 }}
        >
          "Anger itself is the true hero."
        </motion.div>
      </div>
    </motion.div>
  );
}
