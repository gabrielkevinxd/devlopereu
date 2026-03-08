import React from 'react';
import { Brain, Notebook as Robot, Cpu, Database, Code, LineChart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const services = [
  {
    icon: Brain,
    key: 'ia_consultoria'
  },
  {
    icon: Robot,
    key: 'automacao'
  },
  {
    icon: Cpu,
    key: 'machine_learning'
  },
  {
    icon: Database,
    key: 'big_data'
  },
  {
    icon: Code,
    key: 'desenvolvimento'
  },
  {
    icon: LineChart,
    key: 'analytics'
  }
];

const Services = () => {
  const { t } = useTranslation();

  return (
    <section id="services" className="section bg-gray-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-anton text-gold mb-4">{t('services.title')}</h2>
          <p className="text-base sm:text-lg text-gray-light max-w-2xl mx-auto">
            {t('services.subtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {services.map((service, index) => {
            const slug = service.key.replace(/_/g, '-');
            return (
              <div id={slug} key={index} className="card group p-6 sm:p-8">
                <service.icon className="w-10 h-10 sm:w-12 sm:h-12 text-gold mb-4" />
                <h3 className="text-lg sm:text-xl font-anton mb-2">{t(`services.items.${service.key}.title`)}</h3>
                <p className="text-sm sm:text-base text-gray-light">{t(`services.items.${service.key}.description`)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;