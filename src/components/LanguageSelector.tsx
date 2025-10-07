import React from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'pt', name: 'Português' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'sv', name: 'Svenska' }
];

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <div className="relative inline-block text-left">
      <select
        onChange={(e) => changeLanguage(e.target.value)}
        value={i18n.language}
        className="bg-transparent text-white border border-[#FFD700] rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700] appearance-none cursor-pointer hover:bg-[#FFD700] hover:bg-opacity-10 transition-all"
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