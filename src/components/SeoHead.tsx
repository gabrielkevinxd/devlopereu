import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SITE_URL } from '../config';

const setMeta = (sel: string, attr: string, value: string) => {
  document.head.querySelector(sel)?.setAttribute(attr, value);
};

/** Mantém <html lang>, title, description, canonical e OG em sintonia com o idioma e a rota. */
const SeoHead: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();

  useEffect(() => {
    const lang = (i18n.resolvedLanguage || i18n.language || 'pt').slice(0, 2);
    document.documentElement.lang = lang === 'pt' ? 'pt-PT' : lang;
    if (pathname !== '/') return; // páginas legais mantêm o título definido por elas
    const title = t('v2.seo.title');
    const desc = t('v2.seo.description');
    document.title = title;
    setMeta('meta[name="description"]', 'content', desc);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', desc);
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', desc);
    setMeta('link[rel="canonical"]', 'href', `${SITE_URL}/`);
  }, [t, i18n.language, i18n.resolvedLanguage, pathname]);

  return null;
};

export default SeoHead;
