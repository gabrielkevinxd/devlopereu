import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, BarChart3, Brain, Code2, Cpu, Database, Workflow } from 'lucide-react';
import { Eyebrow, Reveal, SectionTitle } from './ui';
import { SERVICE_KEYS } from '../config';
import { scrollToId } from '../lib/booking';
import { TOPIC_EVENT } from './Booking';

const ICONS = { ia_consultoria: Brain, automacao: Workflow, machine_learning: Cpu, big_data: Database, desenvolvimento: Code2, analytics: BarChart3 };

const Services: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section id="servicos" aria-labelledby="h-serv" className="section">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <Eyebrow>{t('v2.eyebrow.services')}</Eyebrow>
          <SectionTitle id="h-serv">{t('services.title')}</SectionTitle>
          <p className="mt-5 max-w-2xl text-lg text-gray-light">{t('services.subtitle')}</p>
        </Reveal>
        <ul className="mt-12 grid gap-px bg-white/10 border border-white/10 rounded-3xl overflow-hidden sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_KEYS.map((k) => {
            const Icon = ICONS[k];
            const title = t(`services.items.${k}.title`);
            return (
              <li key={k} className="group relative bg-primary p-7 sm:p-9 transition-colors hover:bg-[#151208]">
                <Icon className="text-gold" size={34} strokeWidth={1.5} aria-hidden="true" />
                <h3 className="mt-6 font-anton text-2xl uppercase">{title}</h3>
                <p className="mt-3 text-gray-light leading-relaxed">{t(`services.items.${k}.description`)}</p>
                <a
                  href="#agendar"
                  onClick={(e) => {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent(TOPIC_EVENT, { detail: title }));
                    scrollToId('agendar');
                  }}
                  className="mt-6 inline-flex items-center gap-1 text-gold font-bold min-h-[44px] hover:underline"
                  aria-label={`${t('v2.serviceCta')}: ${title}`}
                >
                  {t('v2.serviceCta')} <ArrowUpRight size={18} aria-hidden="true" />
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default Services;
