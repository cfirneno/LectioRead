import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const LINES = [
  'Arma virumque cano, Troiae qui primus ab oris',
  'Italiam fato profugus Laviniaque venit',
  'litora.',
];

export function Scene7() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 2600),
      setTimeout(() => setPhase(3), 4200),
      setTimeout(() => setPhase(4), 5600),
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10 px-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 1 }}
    >
      <motion.h3
        className="text-[1.6vw] font-body tracking-[0.4em] uppercase text-[var(--color-primary)] mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 1 }}
      >
        The Opening of the Aeneid
      </motion.h3>

      <div className="flex flex-col items-center gap-4 max-w-[80vw]">
        {LINES.map((line, i) => (
          <motion.p
            key={line}
            className="text-[3.4vw] font-display italic leading-tight text-white text-center"
            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
            animate={
              phase >= i + 2
                ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                : { opacity: 0, y: 24, filter: 'blur(8px)' }
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
