import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 2500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center bg-primary"
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(20px)' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      style={{ background: 'radial-gradient(circle, #8C1C13 0%, #050505 100%)' }}
    >
      
      {/* Background coils abstraction */}
      <motion.div 
        className="absolute inset-0"
        initial={{ rotate: 0 }}
        animate={{ rotate: 5 }}
        transition={{ duration: 8, ease: "linear" }}
      >
        <motion.div 
          className="absolute top-[20%] left-[20%] w-[80vw] h-[80vw] border-[4vw] border-black/30 rounded-full blur-[10px]"
          initial={{ scale: 2, opacity: 0 }}
          animate={phase >= 2 ? { scale: 0.8, opacity: 1 } : { scale: 2, opacity: 0 }}
          transition={{ duration: 3, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.div 
          className="absolute -top-[10%] -left-[10%] w-[100vw] h-[100vw] border-[2vw] border-black/40 rounded-full blur-[15px]"
          initial={{ scale: 2.5, opacity: 0 }}
          animate={phase >= 2 ? { scale: 0.9, opacity: 1 } : { scale: 2.5, opacity: 0 }}
          transition={{ duration: 4, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </motion.div>

      <div className="relative z-10 w-full text-center px-[10vw]">
        <motion.h2 
          className="text-[4.5vw] font-display text-text-inverse leading-tight tracking-tight uppercase font-bold"
          initial={{ opacity: 0, y: 50, rotateX: 20 }}
          animate={phase >= 3 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 50, rotateX: 20 }}
          transition={{ duration: 1.5, type: 'spring', bounce: 0.3 }}
          style={{ textShadow: '0 10px 40px rgba(0,0,0,0.8)' }}
        >
          They seize Laocoön<br/>and his sons
        </motion.h2>
        <motion.p
          className="text-[2vw] font-body text-white/70 mt-6 tracking-widest"
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, delay: 1 }}
        >
          CRUSHING THEM IN THEIR COILS
        </motion.p>
      </div>
    </motion.div>
  );
}
