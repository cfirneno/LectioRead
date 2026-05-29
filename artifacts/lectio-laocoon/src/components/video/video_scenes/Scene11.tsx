import { motion } from 'framer-motion';

export function Scene11() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center bg-bg-dark z-10 px-24 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 1 }}
    >
      <motion.p
        className="text-[1.6vw] font-body tracking-[0.4em] uppercase text-secondary mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        Your turn
      </motion.p>
      <motion.h2
        className="text-[3.2vw] font-display italic leading-tight text-text-inverse"
        initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 1.1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        Now read it aloud yourself.
      </motion.h2>
    </motion.div>
  );
}
