import type { Dict } from './pt';

export type { Dict };

export const LANGS = ['pt', 'en', 'fr', 'es', 'de', 'sv'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'pt';

/** Nome nativo de cada idioma (não se traduz). */
export const LANG_NAMES: Record<Lang, string> = {
  pt: 'Português',
  en: 'English',
  fr: 'Français',
  es: 'Español',
  de: 'Deutsch',
  sv: 'Svenska',
};

/** Código BCP-47 usado em <html lang> e Intl. */
export const LANG_TAGS: Record<Lang, string> = {
  pt: 'pt-PT',
  en: 'en',
  fr: 'fr',
  es: 'es',
  de: 'de',
  sv: 'sv',
};

export const isLang = (v: string): v is Lang => (LANGS as readonly string[]).includes(v);

const loaders: Record<Lang, () => Promise<Dict>> = {
  pt: () => import('./pt').then((m) => m.pt),
  en: () => import('./en').then((m) => m.en),
  fr: () => import('./fr').then((m) => m.fr),
  es: () => import('./es').then((m) => m.es),
  de: () => import('./de').then((m) => m.de),
  sv: () => import('./sv').then((m) => m.sv),
};

export const loadDict = (lang: Lang): Promise<Dict> => loaders[lang]();

/** Substitui {chave} por valores. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
