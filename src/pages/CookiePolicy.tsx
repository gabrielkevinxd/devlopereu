import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCookieConsent } from '../contexts/CookieContext';

const CookiePolicy: React.FC = () => {
  const { t } = useTranslation();
  const { toggleCookieConsent } = useCookieConsent();

  const getArrayFromTranslation = (key: string): string[] => {
    const translation = t(key, { returnObjects: true });
    return Array.isArray(translation) ? translation : [];
  };

  return (
    <div className="bg-primary min-h-screen">
      <div className="container mx-auto px-4 py-12 text-gray-light">
        <h1 className="text-4xl font-anton text-white mb-8">{t('cookies.title')}</h1>
        <p className="mb-8">{t('cookies.lastUpdated', { date: new Date().toLocaleDateString() })}</p>

        <section className="mb-12">
          <h2 className="text-2xl font-anton text-white mb-4">{t('cookies.sections.consent.title')}</h2>
          
          <h3 className="text-xl font-anton text-gold mb-3">{t('cookies.sections.consent.categoriesTitle')}</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-anton text-white mb-2">{t('cookies.sections.consent.categories.necessary.title')}</h4>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                {getArrayFromTranslation('cookies.sections.consent.categories.necessary.items').map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-anton text-white mb-2">{t('cookies.sections.consent.categories.preferences.title')}</h4>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                {getArrayFromTranslation('cookies.sections.consent.categories.preferences.items').map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-anton text-white mb-2">{t('cookies.sections.consent.categories.statistics.title')}</h4>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                {getArrayFromTranslation('cookies.sections.consent.categories.statistics.items').map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-anton text-white mb-2">{t('cookies.sections.consent.categories.marketing.title')}</h4>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                {getArrayFromTranslation('cookies.sections.consent.categories.marketing.items').map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-anton text-white mb-4">{t('cookies.sections.thirdParty.title')}</h2>
          
          <h3 className="text-xl font-anton text-gold mb-3">{t('cookies.sections.thirdParty.subtitle')}</h3>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            {getArrayFromTranslation('cookies.sections.thirdParty.services').map((service, index) => (
              <li key={index}>{service}</li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-anton text-white mb-4">{t('cookies.sections.storage.title')}</h2>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            {getArrayFromTranslation('cookies.sections.storage.periods').map((period, index) => (
              <li key={index}>{period}</li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-anton text-white mb-4">{t('cookies.sections.settings.title')}</h2>
          <p className="mb-4">{t('cookies.sections.settings.description')}</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            {getArrayFromTranslation('cookies.sections.settings.features').map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
          <button 
            className="bg-gold text-primary hover:bg-transparent hover:text-gold border-2 border-gold transition-colors duration-300 rounded-md px-6 py-2"
            onClick={toggleCookieConsent}
          >
            {t('cookies.sections.settings.manageButton')}
          </button>
        </section>

        <div className="mt-12 pt-8 border-t border-gray-medium">
          <p className="mb-4">{t('cookies.footer.moreInfo')}</p>
          <div className="space-x-4">
            <Link to="/privacy-policy" className="text-gold hover:text-white transition-colors">
              {t('cookies.footer.privacyLink')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy; 