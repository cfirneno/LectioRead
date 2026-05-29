import { motion } from 'framer-motion';

export function Scene10() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10 px-24 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 1 }}
    >
      <motion.p
        className="text-[1.6vw] font-body tracking-[0.4em] uppercase text-[var(--color-primary)] mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        Your turn
      </motion.p>
      <motion.h2
        className="text-[3.4vw] font-display italic leading-tight text-white"
        initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 1.1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        Now read it aloud yourself.
      </motion.h2>
    </motion.div>
  );
}
