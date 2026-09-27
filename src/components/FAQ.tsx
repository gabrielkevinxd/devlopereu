import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { BookButton, Eyebrow, Reveal, SectionTitle } from './ui';

export const FAQ: React.FC = () => {
  const { t } = useTranslation();
  const qs = t('faq.questions', { returnObjects: true }) as { question: string; answer: string }[];

  // JSON-LD FAQPage gerado a partir do texto visível (idioma ativo)
  useEffect(() => {
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = 'ld-faq';
    el.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: qs.map((q) => ({ '@type': 'Question', name: q.question, acceptedAnswer: { '@type': 'Answer', text: q.answer } })),
    });
    document.getElementById('ld-faq')?.remove();
    document.head.appendChild(el);
    return () => el.remove();
  }, [qs]);

  return (
    <section id="faq" aria-labelledby="h-faq" className="section">
      <div className="max-w-4xl mx-auto">
        <Reveal>
          <Eyebrow>{t('v2.eyebrow.faq')}</Eyebrow>
          <SectionTitle id="h-faq">{t('faq.title')}</SectionTitle>
        </Reveal>
        <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
          {qs.map((q) => (
            <details key={q.question} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 min-h-[56px] font-bold text-lg [&::-webkit-details-marker]:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">
                {q.question}
                <Plus aria-hidden="true" className="shrink-0 text-gold transition-transform group-open:rotate-45" />
              </summary>
              <p className="pb-6 pr-8 text-gray-light leading-relaxed">{q.answer}</p>
            </details>
          ))}
        </div>
        <Reveal className="mt-10 flex flex-wrap items-center gap-4">
          <p className="text-lg">{t('v2.faqCta.text')}</p>
          <BookButton label={t('v2.faqCta.cta')} />
        </Reveal>
      </div>
    </section>
  );
};
