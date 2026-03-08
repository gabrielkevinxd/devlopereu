import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { NeuralNetwork } from './NeuralNetwork';

const HeroContainer = styled.section`
  position: relative;
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  background-color: #0d0d0d;
  overflow: hidden;
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1rem;
  pointer-events: none; /* Let clicks pass to neural network underneath */

  /* Fix for letting text/buttons be interactive while passing events on the empty space */
  & > * {
      pointer-events: auto;
  }

  @media (min-width: 640px) {
    padding: 0 1.5rem;
  }

  @media (min-width: 1024px) {
    padding: 0 2rem;
  }
`;

const Hero = () => {
  const { t } = useTranslation();

  const openWhatsApp = () => {
    window.open('https://wa.me/351929070650', '_blank');
  };

  return (
    <HeroContainer>
      <NeuralNetwork />
      <HeroContent>
        <motion.div
          className="text-center space-y-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        >
          <motion.h1
            className="text-4xl sm:text-5xl lg:text-7xl font-anton text-white leading-tight tracking-wide uppercase"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          >
            {t('hero.title')}
          </motion.h1>
          <motion.p
            className="text-lg sm:text-2xl text-white/90 max-w-2xl mx-auto font-montserrat font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            {t('hero.subtitle')}
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <button
              onClick={openWhatsApp}
              className="group relative px-8 py-4 bg-gold text-primary hover:text-white border-2 border-gold transition-all duration-300 rounded-md text-xl font-bold font-montserrat tracking-wide overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-primary -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></div>
              <span className="relative z-10">{t('hero.cta')}</span>
            </button>
          </motion.div>
        </motion.div>
      </HeroContent>
    </HeroContainer>
  );
};

export default Hero;