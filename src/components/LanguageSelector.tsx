import React from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage as loadAndChange } from '../i18n';

const languages = [
  { code: 'pt', name: 'Português' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'sv', name: 'Svenska' }
];

const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (languageCode: string) => {
    loadAndChange(languageCode);
  };

  return (
    <div className="relative inline-block text-left">
      <select
        aria-label={t('v2.nav.lang')}
        onChange={(e) => changeLanguage(e.target.value)}
        value={i18n.resolvedLanguage || 'pt'}
        className="bg-transparent text-white border border-gold/70 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gold appearance-none cursor-pointer hover:bg-[#FFD700] hover:bg-opacity-10 transition-all"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-black">
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector; 