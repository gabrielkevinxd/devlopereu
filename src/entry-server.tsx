import { renderToString } from 'react-dom/server';
import { App } from './App';
import { LANG_TAGS, loadDict } from './i18n';
import { allRoutes, pathFor, type Route } from './routes';
import { headTags } from './seo';

export interface Rendered {
  path: string;
  htmlLang: string;
  head: string;
  html: string;
}

export async function render({ lang, page }: Route): Promise<Rendered> {
  const dict = await loadDict(lang);
  return {
    path: pathFor(lang, page),
    htmlLang: LANG_TAGS[lang],
    head: headTags(dict, lang, page),
    html: renderToString(<App lang={lang} page={page} dict={dict} />),
  };
}

export { allRoutes };
