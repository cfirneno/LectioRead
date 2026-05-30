import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const LINES = [
  'Ecce autem gemini a Tenedo tranquilla per alta',
  '(horresco referens) immensis orbibus angues',
  'incumbunt pelago pariterque ad litora tendunt.',
];

const TRANSLATION =
  'And behold — from Tenedos, across the calm deep (I shudder to recall it), twin serpents with vast coils bear down upon the sea and together make for the shore.';

export function SceneSerpents1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2400),
      setTimeout(() => setPhase(4), 3600),
      setTimeout(() => setPhase(5), 5200),
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center bg-bg-dark z-10 px-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 1 }}
    >
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-[0.22] blur-[2px] pointer-events-none"
        src={`${import.meta.env.BASE_URL}video/serpents_sequence_bg.mp4`}
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="absolute inset-0 bg-bg-dark/65 pointer-events-none" />

      <motion.h3
        className="relative text-[1.5vw] font-body tracking-[0.4em] uppercase text-secondary mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.8 }}
      >
        The serpents come · Aeneid II
      </motion.h3>

      <div className="relative flex flex-col items-start gap-6 max-w-[84vw] border-l-4 border-primary pl-10">
        {LINES.map((line, i) => (
          <motion.p
            key={line}
            className="text-[3.4vw] font-display italic leading-[1.15] text-text-inverse text-left w-full"
            initial={{ opacity: 0, x: -30, filter: 'blur(8px)' }}
            animate={
              phase >= i + 2
                ? { opacity: 1, x: 0, filter: 'blur(0px)' }
                : { opacity: 0, x: -30, filter: 'blur(8px)' }
            }
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{ textShadow: '0 4px 24px rgba(0,0,0,0.9)' }}
          >
            {line}
          </motion.p>
        ))}
      </div>

      <motion.p
        className="relative mt-10 max-w-[74vw] text-center text-[1.7vw] font-body font-light text-text-muted leading-snug"
        initial={{ opacity: 0, y: 16 }}
        animate={phase >= 5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        {TRANSLATION}
      </motion.p>
    </motion.div>
  );
}
