import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Data da última atualização dos Termos de Uso (dinâmica)
const LAST_UPDATE = new Date().toISOString().slice(0, 10);

const TermsOfService: React.FC = () => {
  const { t, i18n } = useTranslation();

  // Função para formatar a data de acordo com o idioma atual
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const getArrayFromTranslation = (key: string): string[] => {
    const translation = t(key, { returnObjects: true });
    return Array.isArray(translation) ? translation : [];
  };

  return (
    <div className="bg-primary min-h-screen">
      <div className="container mx-auto px-4 pt-32 pb-12 text-gray-light">
        <h1 className="text-4xl font-anton text-white mb-8 mt-8 sm:mt-16">{t('terms.title')}</h1>
        <p className="mb-8">{t('terms.lastUpdated', { date: formatDate(LAST_UPDATE) })}</p>

        <section className="mb-12">
          <h2 className="text-2xl font-anton text-white mb-4">{t('terms.sections.acceptance.title')}</h2>
          <p className="mb-4">{t('terms.sections.acceptance.content')}</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-anton text-white mb-4">{t('terms.sections.services.title')}</h2>
          <p className="mb-4">{t('terms.sections.services.content')}</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            {getArrayFromTranslation('terms.sections.services.items').map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-anton text-white mb-4">{t('terms.sections.userResponsibilities.title')}</h2>
          <p className="mb-4">{t('terms.sections.userResponsibilities.intro')}</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            {getArrayFromTranslation('terms.sections.userResponsibilities.items').map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-anton text-white mb-4">{t('terms.sections.intellectualProperty.title')}</h2>
          <p className="mb-4">{t('terms.sections.intellectualProperty.content')}</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-anton text-white mb-4">{t('terms.sections.liability.title')}</h2>
          <p className="mb-4">{t('terms.sections.liability.content')}</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-anton text-white mb-4">{t('terms.sections.modifications.title')}</h2>
          <p className="mb-4">{t('terms.sections.modifications.content')}</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-anton text-white mb-4">{t('terms.sections.termination.title')}</h2>
          <p className="mb-4">{t('terms.sections.termination.content')}</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-anton text-white mb-4">{t('terms.sections.applicableLaw.title')}</h2>
          <p className="mb-4">{t('terms.sections.applicableLaw.content')}</p>
        </section>

        <div className="mt-12 pt-8 border-t border-gray-medium">
          <p className="mb-4">{t('terms.footer.moreInfo')}</p>
          <div className="space-x-4">
            <Link to="/privacy-policy" className="text-gold hover:text-white transition-colors">
              {t('footer.legal.privacy')}
            </Link>
            <Link to="/cookie-policy" className="text-gold hover:text-white transition-colors">
              {t('footer.legal.cookies')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;