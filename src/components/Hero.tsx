import React from 'react';
import styled from 'styled-components';
import { SplineRobot } from './SplineRobot';
import { useTranslation } from 'react-i18next';

const HeroContainer = styled.section`
  position: relative;
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  background-color: #000000;
  overflow: hidden;
`;

const HeroOverlay = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(var(--primary-rgb), 0.75);
  z-index: 2;
  pointer-events: none;
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 3;
  width: 100%;
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1rem;
  pointer-events: auto;
  opacity: 0;
  animation: fadeIn 0.5s ease-in-out forwards;
  animation-delay: 0.5s;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
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
      <SplineRobot />
      <HeroOverlay />
      <HeroContent>
        <div className="text-center space-y-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-anton text-white leading-tight">
            {t('hero.title')}
          </h1>
          <p className="text-lg sm:text-xl text-white/90 max-w-xl mx-auto">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={openWhatsApp}
              className="px-8 py-3 bg-gold text-primary hover:bg-transparent hover:text-gold border-2 border-gold transition-colors rounded-md text-lg font-medium"
            >
              {t('hero.cta')}
            </button>
          </div>
        </div>
      </HeroContent>
    </HeroContainer>
  );
};

export default Hero;