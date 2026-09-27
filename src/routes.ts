import { DEFAULT_LANG, LANGS, isLang, type Lang } from './i18n';
import { SITE_URL } from './config';

export const PAGES = ['home', 'privacy', 'cookies', 'terms', 'checklist'] as const;
export type Page = (typeof PAGES)[number];

/** Slugs iguais em todos os idiomas (mantêm os URLs do site antigo). */
const SLUGS: Record<Exclude<Page, 'home'>, string> = {
  privacy: 'privacy-policy',
  cookies: 'cookie-policy',
  terms: 'terms',
  checklist: 'checklist',
};

export interface Route {
  lang: Lang;
  page: Page;
}

export function pathFor(lang: Lang, page: Page): string {
  const prefix = lang === DEFAULT_LANG ? '/' : `/${lang}/`;
  return page === 'home' ? prefix : `${prefix}${SLUGS[page]}/`;
}

export const urlFor = (lang: Lang, page: Page) => `${SITE_URL}${pathFor(lang, page)}`;

export function parsePath(pathname: string): Route {
  const parts = pathname.split('/').filter(Boolean);
  let lang: Lang = DEFAULT_LANG;
  if (parts[0] && isLang(parts[0])) lang = parts.shift() as Lang;
  const slug = parts[0];
  const page = (Object.keys(SLUGS) as Array<keyof typeof SLUGS>).find((p) => SLUGS[p] === slug) ?? 'home';
  return { lang, page };
}

export const allRoutes = (): Route[] => LANGS.flatMap((lang) => PAGES.map((page) => ({ lang, page })));
