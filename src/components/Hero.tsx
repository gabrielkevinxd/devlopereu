import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { NeuralNetwork } from './NeuralNetwork';
import AutomationMap from './AutomationMap';
import { BookButton } from './ui';
import { scrollToId } from '../lib/booking';

const AREAS = ['support', 'sales', 'ops', 'data', 'software'];

const Hero: React.FC = () => {
  const { t } = useTranslation();
  const [bg, setBg] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setBg(true), 400);
    return () => window.clearTimeout(id);
  }, []);
  const trust = t('v2.hero.trust', { returnObjects: true }) as string[];

  return (
    <div className="relative min-h-[100svh] flex items-center overflow-hidden pt-24 pb-16">
      {bg && <NeuralNetwork />}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_75%_30%,rgba(212,175,55,0.16),transparent_70%)] pointer-events-none" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-center w-full">
        <div>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.28em] text-gold mb-6">{t('v2.hero.kicker')}</p>
          <h1 className="font-anton uppercase leading-[0.95] text-[2.9rem] sm:text-7xl lg:text-[5.6rem]">
            <span className="block text-white">{t('v2.hero.l1')}</span>
            <span className="block bg-gradient-to-r from-[#F3D77A] via-gold to-[#B8901F] bg-clip-text text-transparent">{t('v2.hero.l2')}</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg sm:text-xl text-gray-light leading-relaxed">{t('v2.hero.sub')}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <BookButton label={t('v2.hero.cta')} />
            <a
              href="#diagnostico"
              onClick={(e) => { e.preventDefault(); scrollToId('diagnostico'); }}
              className="inline-flex items-center gap-1 rounded-full px-6 py-3 min-h-[48px] font-bold text-white border border-white/25 hover:border-gold hover:text-gold transition-colors"
            >
              {t('v2.hero.cta2')} <ChevronRight size={18} aria-hidden="true" />
            </a>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-light">
            {trust.map((x) => (
              <li key={x} className="flex items-center gap-2">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-gold" /> {x}
              </li>
            ))}
          </ul>
        </div>
        <div className="hidden md:block" aria-hidden="true">
          <AutomationMap modules={AREAS.map((a) => t(`v2.diag.areas.${a}.label`))} core="DEVLOPER.EU" label="" compact />
        </div>
      </div>
    </div>
  );
};

export default Hero;
