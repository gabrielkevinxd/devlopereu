import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

/** "Espinha" neuronal: linha dourada fixa à esquerda que se preenche com o scroll (decorativa, só em ecrãs largos). */
const ScrollSpine: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.4 });
  return (
    <div aria-hidden="true" className="pointer-events-none fixed left-5 top-24 bottom-24 z-30 hidden 2xl:block w-px bg-white/10">
      <motion.div style={{ scaleY, transformOrigin: 'top' }} className="h-full w-px bg-gradient-to-b from-gold to-[#B8901F] shadow-[0_0_12px_#D4AF37]" />
    </div>
  );
};

export default ScrollSpine;
