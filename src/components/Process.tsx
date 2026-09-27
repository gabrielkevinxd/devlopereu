import React from 'react';
import { useTranslation } from 'react-i18next';
import { BookButton, Eyebrow, Reveal, SectionTitle } from './ui';

const Process: React.FC = () => {
  const { t } = useTranslation();
  const steps = t('v2.process.steps', { returnObjects: true }) as { t: string; d: string }[];
  return (
    <section id="metodo" aria-labelledby="h-proc" className="section">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <Eyebrow>{t('v2.eyebrow.process')}</Eyebrow>
          <SectionTitle id="h-proc">{t('v2.process.title')}</SectionTitle>
        </Reveal>
        <ol className="mt-14 relative grid gap-10 md:grid-cols-4 md:gap-6">
          <span aria-hidden="true" className="hidden md:block absolute left-0 right-0 top-6 h-px bg-gradient-to-r from-gold via-gold/40 to-transparent" />
          {steps.map((s, i) => (
            <li key={s.t} className="relative">
              <Reveal delay={i * 0.08}>
                <span className="relative z-10 grid place-items-center h-12 w-12 rounded-full bg-primary border-2 border-gold text-gold font-anton text-xl">{i + 1}</span>
                <h3 className="mt-5 font-anton text-2xl uppercase">{s.t}</h3>
                <p className="mt-2 text-gray-light leading-relaxed">{s.d}</p>
              </Reveal>
            </li>
          ))}
        </ol>
        <Reveal className="mt-12"><BookButton /></Reveal>
      </div>
    </section>
  );
};

export default Process;
