import { motion } from 'framer-motion';

const PAIRS: { la: string; en: string }[] = [
  { la: 'Arma', en: 'arms' },
  { la: 'virumque', en: 'and the man' },
  { la: 'cano', en: 'I sing' },
  { la: 'Troiae', en: 'of Troy' },
  { la: 'qui', en: 'who' },
  { la: 'primus', en: 'first' },
  { la: 'ab', en: 'from' },
  { la: 'oris', en: 'the shores' },
  { la: 'Italiam', en: 'to Italy' },
  { la: 'fato', en: 'by fate' },
  { la: 'profugus', en: 'an exile' },
  { la: 'Laviniaque', en: 'and Lavinian' },
  { la: 'venit', en: 'came' },
  { la: 'litora', en: 'to the coast' },
];

export function Scene8() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10 px-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <motion.h3
        className="text-[1.6vw] font-body tracking-[0.4em] uppercase text-[var(--color-primary)] mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        Word by Word
      </motion.h3>

      <div className="flex flex-wrap items-start justify-center gap-x-8 gap-y-7 max-w-[80vw]">
        {PAIRS.map((p, i) => (
          <motion.div
            key={p.la + i}
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 + i * 0.18, ease: 'easeOut' }}
          >
            <span className="text-[2.4vw] font-display italic text-white leading-none">
              {p.la}
            </span>
            <span className="mt-2 text-[1.25vw] font-body font-light text-[var(--color-text-muted)] leading-none">
              {p.en}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
