import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const LINES = [
  'Equo ne credite, Teucri.',
  'Quidquid id est, timeo Danaos et dona ferentis.',
];

export function Scene10() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1400),
      setTimeout(() => setPhase(3), 2400),
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center bg-bg-dark z-10 px-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 1 }}
    >
      <motion.h3
        className="relative text-[1.6vw] font-body tracking-[0.4em] uppercase text-secondary mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 1 }}
      >
        Now — listen once more
      </motion.h3>

      <div className="relative flex flex-col items-center gap-6 max-w-[80vw] border-l-4 border-primary pl-10">
        {LINES.map((line, i) => (
          <motion.p
            key={line}
            className="text-[3.2vw] font-display italic leading-tight text-text-inverse text-left w-full"
            initial={{ opacity: 0, x: -30, filter: 'blur(8px)' }}
            animate={
              phase >= i + 2
                ? { opacity: 1, x: 0, filter: 'blur(0px)' }
                : { opacity: 0, x: -30, filter: 'blur(8px)' }
            }
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          >
            {line}
          </motion.p>
        ))}
      </div>
    </motion.div>
  );
}
