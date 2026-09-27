import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Play } from 'lucide-react';
import { BookButton, Eyebrow, Reveal, SectionTitle } from './ui';

// Vídeo institucional já existente no projeto (public/videos/DevloperEU.mp4, ~50 MB):
// só é pedido depois do clique, para não pesar no carregamento.
const About: React.FC = () => {
  const { t } = useTranslation();
  const [play, setPlay] = useState(false);
  const paragraphs = t('about.paragraphs', { returnObjects: true }) as string[];
  const stats = ['projects', 'satisfaction', 'support'] as const;

  return (
    <section id="sobre" aria-labelledby="h-about" className="section">
      <div className="max-w-7xl mx-auto grid gap-12 lg:grid-cols-2 items-center">
        <Reveal>
          <Eyebrow>{t('v2.eyebrow.about')}</Eyebrow>
          <SectionTitle id="h-about">{t('about.title')}</SectionTitle>
          <div className="mt-6 space-y-4 text-lg text-gray-light leading-relaxed">
            {paragraphs.map((p) => <p key={p}>{p}</p>)}
          </div>
          <dl className="mt-8 grid grid-cols-3 gap-4">
            {stats.map((s) => (
              <div key={s} className="border-l-2 border-gold pl-4">
                <dd className="font-anton text-3xl sm:text-4xl text-gold order-2">{t(`about.stats.${s}.value`)}</dd>
                <dt className="text-sm text-gray-light">{t(`about.stats.${s}.label`)}</dt>
              </div>
            ))}
          </dl>
          <div className="mt-8"><BookButton /></div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="relative aspect-video overflow-hidden rounded-3xl border border-gold/30 bg-black">
            {play ? (
              <video className="h-full w-full object-cover" src="/videos/DevloperEU.mp4" controls autoPlay playsInline aria-label={t('v2.about.videoLabel')} />
            ) : (
              <button type="button" onClick={() => setPlay(true)} className="group absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.25),transparent_65%)]">
                <span className="grid place-items-center h-20 w-20 rounded-full bg-gold text-primary transition-transform group-hover:scale-110">
                  <Play size={32} fill="currentColor" aria-hidden="true" />
                </span>
                <span className="absolute bottom-5 left-5 right-5 text-left font-bold">{t('v2.about.video')}</span>
              </button>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default About;
