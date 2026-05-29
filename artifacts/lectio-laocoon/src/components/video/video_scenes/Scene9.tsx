import { motion } from 'framer-motion';

const PAIRS: { la: string; en: string }[] = [
  { la: 'Equo', en: 'the horse' },
  { la: 'ne', en: 'do not' },
  { la: 'credite', en: 'trust' },
  { la: 'Teucri', en: 'Trojans' },
  { la: 'Quidquid', en: 'whatever' },
  { la: 'id', en: 'it' },
  { la: 'est', en: 'is' },
  { la: 'timeo', en: 'I fear' },
  { la: 'Danaos', en: 'the Greeks' },
  { la: 'et', en: 'even' },
  { la: 'dona', en: 'gifts' },
  { la: 'ferentis', en: 'bearing' },
];

export function Scene9() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center bg-bg-dark z-10 px-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <motion.h3
        className="text-[1.6vw] font-body tracking-[0.4em] uppercase text-secondary mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        Word by Word
      </motion.h3>

      <div className="flex flex-wrap items-start justify-center gap-x-9 gap-y-8 max-w-[78vw]">
        {PAIRS.map((p, i) => (
          <motion.div
            key={p.la + i}
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 + i * 0.22, ease: 'easeOut' }}
          >
            <span className="text-[2.6vw] font-display italic text-text-inverse leading-none">
              {p.la}
            </span>
            <span className="mt-2 text-[1.3vw] font-body font-light text-text-muted leading-none">
              {p.en}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
