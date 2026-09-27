import { CAP_COUNT } from '../data/capIds';
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

/**
 * Contagens derivadas — nunca escritas à mão na cópia: {tasks} = itens da checklist, {langs} = idiomas do site,
 * {caps} = capacidades do catálogo (src/data/capIds.ts). Resolvidas uma vez, ao carregar o dicionário.
 */
function withCounts(d: Dict): Dict {
  const vars: Record<string, number> = { tasks: d.magnet.items.length, langs: LANGS.length, caps: CAP_COUNT };
  const walk = (v: unknown): unknown =>
    typeof v === 'string'
      ? v.replace(/\{(tasks|langs|caps)\}/g, (_, k: string) => String(vars[k]))
      : Array.isArray(v)
        ? v.map(walk)
        : v && typeof v === 'object'
          ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]))
          : v;
  return walk(d) as Dict;
}

export const loadDict = (lang: Lang): Promise<Dict> => loaders[lang]().then(withCounts);

/** Substitui {chave} por valores. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
