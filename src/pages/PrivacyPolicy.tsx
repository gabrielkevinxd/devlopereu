import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Data da última atualização da Política de Privacidade (dinâmica)
const LAST_UPDATE = new Date().toISOString().slice(0, 10);

const PrivacyPolicy: React.FC = () => {
  const { t, i18n } = useTranslation();

  // Função para formatar a data de acordo com o idioma atual
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Função auxiliar para garantir que o retorno é um array
  const getArrayFromTranslation = (key: string): string[] => {
    const value = t(key, { returnObjects: true });
    return Array.isArray(value) ? value : [];
  };

  return (
    <div className="bg-primary min-h-screen">
      <div className="container mx-auto px-4 pt-32 pb-12 text-gray-light">
        <h1 className="text-4xl font-anton text-white mb-8 mt-8 sm:mt-16">{t('privacy.title')}</h1>
        <p className="mb-8">{t('privacy.lastUpdated', { date: formatDate(LAST_UPDATE) })}</p>

        <section className="mb-12">
          <h2 className="text-2xl font-anton text-white mb-4">{t('privacy.sections.dataController.title')}</h2>
          <div className="space-y-4">
            <p>{t('privacy.sections.dataController.company')}</p>
            <p>{t('privacy.sections.dataController.location')}</p>
            <p>{t('privacy.sections.dataController.email')}</p>
            <p>{t('privacy.sections.dataController.dpo')}</p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-anton text-white mb-4">{t('privacy.sections.personalData.title')}</h2>
          
          <h3 className="text-xl font-anton text-gold mb-3">{t('privacy.sections.personalData.categories.title')}</h3>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            {getArrayFromTranslation('privacy.sections.personalData.categories.items').map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h3 className="text-xl font-anton text-gold mb-3">{t('privacy.sections.personalData.legalBasis.title')}</h3>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            {getArrayFromTranslation('privacy.sections.personalData.legalBasis.items').map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-anton text-white mb-4">{t('privacy.sections.processingPurposes.title')}</h2>
          
          <h3 className="text-xl font-anton text-gold mb-3">{t('privacy.sections.processingPurposes.purposes.title')}</h3>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            {getArrayFromTranslation('privacy.sections.processingPurposes.purposes.items').map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <p className="mb-4">{t('privacy.sections.processingPurposes.automated')}</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-anton text-white mb-4">{t('privacy.sections.dataRetention.title')}</h2>
          
          <h3 className="text-xl font-anton text-gold mb-3">{t('privacy.sections.dataRetention.periods.title')}</h3>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            {getArrayFromTranslation('privacy.sections.dataRetention.periods.items').map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-anton text-white mb-4">{t('privacy.sections.gdprRights.title')}</h2>
          <p className="mb-4">{t('privacy.sections.gdprRights.intro')}</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            {getArrayFromTranslation('privacy.sections.gdprRights.rights').map((right, index) => (
              <li key={index}>{right}</li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-anton text-white mb-4">{t('privacy.sections.internationalTransfers.title')}</h2>
          <p className="mb-4">{t('privacy.sections.internationalTransfers.transfers.title')}</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            {getArrayFromTranslation('privacy.sections.internationalTransfers.transfers.items').map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-anton text-white mb-4">{t('privacy.sections.securityMeasures.title')}</h2>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            {getArrayFromTranslation('privacy.sections.securityMeasures.measures').map((measure, index) => (
              <li key={index}>{measure}</li>
            ))}
          </ul>
        </section>

        <div className="mt-12 pt-8 border-t border-gray-medium">
          <p className="mb-4">{t('footer.legal.cookies')}</p>
          <div className="space-x-4">
            <Link to="/cookie-policy" className="text-gold hover:text-white transition-colors">
              {t('footer.legal.cookies')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;