import { CONTACT, SITE_URL, SOCIAL } from './config';
import { LANGS, LANG_TAGS, type Dict, type Lang } from './i18n';
import { urlFor, type Page } from './routes';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const OG_IMAGE = `${SITE_URL}/og-image.jpg`;
const LOGO = `${SITE_URL}/brand/logo-stacked-gold.png`;

function titleFor(t: Dict, page: Page): string {
  switch (page) {
    case 'home':
      return t.meta.title;
    case 'checklist':
      return `${t.magnet.title} | DevloperEU`;
    default:
      return `${t.legal[page].title} | DevloperEU`;
  }
}

function descriptionFor(t: Dict, page: Page): string {
  if (page === 'checklist') return t.magnet.lead;
  if (page === 'home') return t.meta.description;
  return `${t.legal[page].title} — DevloperEU, Braga, Portugal.`;
}

/** JSON-LD: Organization + ProfessionalService (Braga) + 6 Service + FAQPage + WebSite. */
export function jsonLd(t: Dict, lang: Lang): object {
  const orgId = `${SITE_URL}/#org`;
  const bizId = `${SITE_URL}/#business`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': orgId,
        name: 'DevloperEU',
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: LOGO, width: 560, height: 486 },
        image: OG_IMAGE,
        foundingDate: String(CONTACT.foundingYear),
        email: CONTACT.email,
        telephone: CONTACT.phoneE164,
        sameAs: Object.values(SOCIAL),
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'sales',
          telephone: CONTACT.phoneE164,
          email: CONTACT.email,
          availableLanguage: ['pt', 'en', 'fr', 'es', 'de', 'sv'],
        },
      },
      {
        '@type': 'ProfessionalService',
        '@id': bizId,
        name: 'DevloperEU',
        description: t.meta.description,
        url: urlFor(lang, 'home'),
        image: OG_IMAGE,
        logo: LOGO,
        telephone: CONTACT.phoneE164,
        email: CONTACT.email,
        parentOrganization: { '@id': orgId },
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Braga',
          addressRegion: 'Braga',
          addressCountry: 'PT',
        },
        areaServed: [
          { '@type': 'Country', name: 'Portugal' },
          { '@type': 'Place', name: 'Europe' },
        ],
        knowsLanguage: [...LANGS],
      },
      ...t.services.map((s) => ({
        '@type': 'Service',
        '@id': `${SITE_URL}/#service-${s.id}`,
        name: s.name,
        description: s.short,
        serviceType: s.name,
        provider: { '@id': bizId },
        areaServed: 'Europe',
        inLanguage: LANG_TAGS[lang],
      })),
      {
        '@type': 'FAQPage',
        '@id': `${urlFor(lang, 'home')}#faq`,
        inLanguage: LANG_TAGS[lang],
        mainEntity: t.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'DevloperEU',
        publisher: { '@id': orgId },
        inLanguage: LANGS.map((l) => LANG_TAGS[l]),
      },
    ],
  };
}

/** Tags do <head> específicas de cada página pré-renderizada. */
export function headTags(t: Dict, lang: Lang, page: Page): string {
  const title = titleFor(t, page);
  const desc = descriptionFor(t, page);
  const url = urlFor(lang, page);
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(desc)}">`,
    `<link rel="canonical" href="${url}">`,
    ...LANGS.map((l) => `<link rel="alternate" hreflang="${LANG_TAGS[l]}" href="${urlFor(l, page)}">`),
    `<link rel="alternate" hreflang="x-default" href="${urlFor('pt', page)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="DevloperEU">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:locale" content="${t.meta.ogLocale}">`,
    `<meta property="og:image" content="${OG_IMAGE}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${esc(t.meta.ogAlt)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:site" content="@DevloperEU">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(desc)}">`,
    `<meta name="twitter:image" content="${OG_IMAGE}">`,
  ];
  if (page === 'home') {
    tags.push(`<script type="application/ld+json">${JSON.stringify(jsonLd(t, lang)).replace(/</g, '\\u003c')}</script>`);
  }
  return tags.join('\n    ');
}
