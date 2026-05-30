import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const LINES = [
  'illi agmine certo Laocoonta petunt;',
  'et primum parva duorum corpora natorum',
  'serpens amplexus uterque implicat.',
  'post ipsum corripiunt spirisque ligant ingentibus;',
  'clamores simul horrendos ad sidera tollit.',
];

const TRANSLATION =
  'In sure formation they strike at Laocoön. First each serpent coils about the small bodies of his two sons; then they seize the man himself and bind him in their vast coils — and he lifts horrible cries to the stars.';

export function SceneSerpents2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 4400),
      setTimeout(() => setPhase(4), 6600),
      setTimeout(() => setPhase(5), 9000),
      setTimeout(() => setPhase(6), 11600),
      setTimeout(() => setPhase(7), 15000),
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
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-[0.18] blur-[2px] pointer-events-none"
        src={`${import.meta.env.BASE_URL}video/serpents_sequence_bg.mp4`}
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="absolute inset-0 bg-bg-dark/70 pointer-events-none" />

      <motion.h3
        className="relative text-[1.6vw] font-body tracking-[0.4em] uppercase text-secondary mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 1 }}
      >
        The attack · Aeneid II
      </motion.h3>

      <div className="relative flex flex-col items-start gap-4 max-w-[82vw] border-l-4 border-primary pl-10">
        {LINES.map((line, i) => (
          <motion.p
            key={line}
            className="text-[2.4vw] font-display italic leading-tight text-text-inverse text-left w-full"
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

      <motion.p
        className="relative mt-9 max-w-[70vw] text-center text-[1.4vw] font-body font-light text-text-muted leading-snug"
        initial={{ opacity: 0, y: 16 }}
        animate={phase >= 7 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      >
        {TRANSLATION}
      </motion.p>
    </motion.div>
  );
}
