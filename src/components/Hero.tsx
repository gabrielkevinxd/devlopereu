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

const TitleContainer = styled(motion.h1)`
  font-family: 'Anton', sans-serif;
  text-transform: uppercase;
  line-height: 1.1;
  letter-spacing: 0.02em;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  perspective: 1000px; /* Enable 3D perspective for flip animations */
`;

const TitlePart1 = styled.span`
  color: #ffffff;
  font-size: 2.25rem; /* text-4xl equivalent */
  font-weight: normal;
  display: block;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);

  @media (min-width: 640px) {
    font-size: 3.5rem;
  }

  @media (min-width: 1024px) {
    font-size: 5rem;
  }
`;

const TitleConnector = styled.span`
  color: #D4AF37;
  font-family: 'Montserrat', sans-serif;
  font-weight: 300;
  text-transform: lowercase;
  font-size: 1.5rem;
  margin: 0.25rem 0;
  display: block;
  opacity: 0.85;
  text-shadow: 0 0 15px rgba(212, 175, 55, 0.4);

  @media (min-width: 640px) {
    font-size: 2rem;
  }

  @media (min-width: 1024px) {
    font-size: 2.5rem;
  }
`;
const TitlePart2 = styled.span`
  display: block;
  font-size: 2.5rem;
  font-weight: 800;

  @media (min-width: 640px) {
    font-size: 4rem;
  }

  @media (min-width: 1024px) {
    font-size: 5.75rem;
  }
`;

const GradientLetter = styled(motion.span)`
  display: inline-block;
  background: linear-gradient(135deg, #D4AF37 0%, #FFF3B0 50%, #D4AF37 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shine-letter 6s linear infinite;

  @keyframes shine-letter {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`;

interface AnimatedLettersProps {
  text: string;
  delayOffset: number;
  hoverColor?: string;
  isGradient?: boolean;
}

const AnimatedLetters: React.FC<AnimatedLettersProps> = ({ text, delayOffset, hoverColor, isGradient }) => {
  const letters = Array.from(text);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: delayOffset,
      },
    },
  };

  const letterVariants = {
    hidden: {
      opacity: 0,
      y: 40,
      rotateX: -75,
      scale: 0.85,
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      scale: 1,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.span
      className="inline-flex flex-wrap justify-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {letters.map((char, index) => {
        if (char === ' ') {
          return <span key={index}>&nbsp;</span>;
        }
        
        const hoverState = isGradient
          ? {
              y: -12,
              scale: 1.2,
              transition: { type: 'spring', stiffness: 400, damping: 8 },
            }
          : {
              y: -12,
              scale: 1.2,
              color: hoverColor || '#D4AF37',
              textShadow: '0 0 20px #D4AF37, 0 0 35px #FFF3B0',
              transition: { type: 'spring', stiffness: 400, damping: 8 },
            };

        const Component = isGradient ? GradientLetter : motion.span;

        return (
          <Component
            key={index}
            className="inline-block cursor-default origin-center select-none"
            variants={letterVariants}
            whileHover={hoverState}
          >
            {char}
          </Component>
        );
      })}
    </motion.span>
  );
};

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
          <TitleContainer>
            <TitlePart1>
              <AnimatedLetters text={t('hero.title_part1')} delayOffset={0.3} />
            </TitlePart1>
            <TitleConnector>
              <AnimatedLetters text={t('hero.title_connector')} delayOffset={0.9} hoverColor="#ffffff" />
            </TitleConnector>
            <TitlePart2>
              <AnimatedLetters text={t('hero.title_part2')} delayOffset={1.2} hoverColor="#ffffff" isGradient={true} />
            </TitlePart2>
          </TitleContainer>
          <motion.p
            className="text-lg sm:text-2xl text-white/90 max-w-2xl mx-auto font-montserrat font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.8 }}
          >
            {t('hero.subtitle')}
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2.1 }}
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