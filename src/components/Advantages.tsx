import React from 'react';
import { useTranslation } from 'react-i18next';
import { Eyebrow, Reveal, SectionTitle } from './ui';

const KEYS = ['efficiency', 'experience', 'insights', 'scalability', 'integration', 'growth'] as const;

export const Advantages: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section id="vantagens" aria-labelledby="h-why" className="section">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <Eyebrow>{t('v2.eyebrow.why')}</Eyebrow>
          <SectionTitle id="h-why">{t('v2.why.title')}</SectionTitle>
          <p className="mt-5 max-w-2xl text-lg text-gray-light">{t('advantages.description')}</p>
        </Reveal>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {KEYS.map((k, i) => (
            <li key={k}>
              <Reveal delay={(i % 3) * 0.08} className="h-full">
                <article className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-7 hover:border-gold/50 transition-colors">
                  <h3 className="font-anton text-xl uppercase text-gold">{t(`advantages.items.${k}.title`)}</h3>
                  <p className="mt-3 text-gray-light leading-relaxed">{t(`advantages.items.${k}.description`)}</p>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
