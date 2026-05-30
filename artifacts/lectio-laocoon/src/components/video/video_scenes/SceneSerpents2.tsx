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
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2600),
      setTimeout(() => setPhase(4), 4000),
      setTimeout(() => setPhase(5), 5400),
      setTimeout(() => setPhase(6), 6800),
      setTimeout(() => setPhase(7), 9200),
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
        className="relative text-[1.5vw] font-body tracking-[0.4em] uppercase text-secondary mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.8 }}
      >
        The attack · Aeneid II
      </motion.h3>

      <div className="relative flex flex-col items-start gap-4 max-w-[86vw] border-l-4 border-primary pl-10">
        {LINES.map((line, i) => (
          <motion.p
            key={line}
            className="text-[3vw] font-display italic leading-[1.12] text-text-inverse text-left w-full"
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
        className="relative mt-8 max-w-[76vw] text-center text-[1.6vw] font-body font-light text-text-muted leading-snug"
        initial={{ opacity: 0, y: 16 }}
        animate={phase >= 7 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        {TRANSLATION}
      </motion.p>
    </motion.div>
  );
}
