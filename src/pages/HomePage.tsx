import React, { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Diagnostic from '../components/Diagnostic';
import { BookButton } from '../components/ui';

const Process = lazy(() => import('../components/Process'));
const Advantages = lazy(() => import('../components/Advantages').then((m) => ({ default: m.Advantages })));
const About = lazy(() => import('../components/About'));
const LeadMagnet = lazy(() => import('../components/LeadMagnet'));
const FAQ = lazy(() => import('../components/FAQ').then((m) => ({ default: m.FAQ })));
const Booking = lazy(() => import('../components/Booking'));

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <section id="inicio" aria-label="DevloperEU">
        <Hero />
      </section>
      <Services />
      <Diagnostic />
      <Suspense fallback={<div style={{ minHeight: '100vh' }} aria-hidden="true" />}>
        <Process />
        <Advantages />
        <About />
        <LeadMagnet />
        <FAQ />
        <Booking />
      </Suspense>
      <section aria-label={t('v2.footerCta.title')} className="px-4 pb-24 pt-8 text-center">
        <p className="font-anton uppercase text-4xl sm:text-6xl bg-gradient-to-r from-[#F3D77A] via-gold to-[#B8901F] bg-clip-text text-transparent">{t('v2.footerCta.title')}</p>
        <div className="mt-6"><BookButton label={t('v2.footerCta.cta')} /></div>
      </section>
    </>
  );
};

export default HomePage;
