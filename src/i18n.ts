import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importando as traduções
import translationPT from './locales/pt/translation.json';

import v2PT from './locales/v2/pt.json';

type Dict = { [k: string]: unknown };
const merge = (a: Dict, b: Dict): Dict => {
  const out: Dict = { ...a };
  for (const k of Object.keys(b)) {
    const av = out[k], bv = b[k];
    out[k] = av && bv && typeof av === 'object' && typeof bv === 'object' && !Array.isArray(bv)
      ? merge(av as Dict, bv as Dict)
      : bv;
  }
  return out;
};

const resources = {
  pt: {
    translation: merge(translationPT as Dict, v2PT as Dict)
  }
};

// Idiomas além do PT carregam sob pedido (menos JS no primeiro carregamento).
const loaders: Record<string, () => Promise<[{ default: Dict }, { default: Dict }]>> = {
  en: () => Promise.all([import('./locales/en/translation.json'), import('./locales/v2/en.json')]) as never,
  fr: () => Promise.all([import('./locales/fr/translation.json'), import('./locales/v2/fr.json')]) as never,
  es: () => Promise.all([import('./locales/es/translation.json'), import('./locales/v2/es.json')]) as never,
  de: () => Promise.all([import('./locales/de/translation.json'), import('./locales/v2/de.json')]) as never,
  sv: () => Promise.all([import('./locales/sv/translation.json'), import('./locales/v2/sv.json')]) as never,
};

export async function loadLanguage(lng: string) {
  const code = lng.slice(0, 2);
  if (!loaders[code] || i18n.hasResourceBundle(code, 'translation')) return;
  const [base, v2] = await loaders[code]();
  i18n.addResourceBundle(code, 'translation', merge(base.default, v2.default), true, true);
}

export async function changeLanguage(lng: string) {
  await loadLanguage(lng);
  await i18n.changeLanguage(lng);
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt',
    supportedLngs: ['pt', 'en', 'fr', 'es', 'de', 'sv'],
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

// idioma detetado (localStorage/navegador) diferente de PT: carregar e re-renderizar
i18n.on('initialized', () => {
  const lng = i18n.language || 'pt';
  if (lng.slice(0, 2) !== 'pt') loadLanguage(lng).then(() => i18n.changeLanguage(lng));
});

export default i18n; 