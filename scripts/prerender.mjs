/**
 * Pré-renderização estática (SSG): gera dist/<rota>/index.html para cada idioma × página,
 * com <html lang>, <head> próprio (meta, OG, hreflang, JSON-LD) e o HTML da app.
 * Gera também sitemap.xml (com alternates hreflang) e 404.html.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const ssrEntry = join(root, 'dist-ssr', 'entry-server.js');
const SITE = 'https://devloper.eu';
const TAGS = { pt: 'pt-PT', en: 'en', fr: 'fr', es: 'es', de: 'de', sv: 'sv' };

// CSS crítico inline: o stylesheet (~7 kB gzip) deixa de bloquear a primeira pintura.
const template = readFileSync(join(dist, 'index.html'), 'utf8').replace(
  /<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/,
  (_, href) => `<style>${readFileSync(join(dist, href), 'utf8')}</style>`,
);
const { render, allRoutes } = await import(pathToFileURL(ssrEntry).href);

// modulepreload do dicionário do idioma (+ catálogo na página inicial): descarregam em paralelo com o JS
// principal em vez de só depois dele → a hidratação começa um round-trip mais cedo.
const manifestFile = join(dist, '.vite', 'manifest.json');
const manifest = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')) : {};
const preload = (src) => (manifest[src] ? `<link rel="modulepreload" crossorigin href="/${manifest[src].file}">` : '');
const preloads = (route) =>
  [preload(`src/i18n/${route.lang}.ts`), route.page === 'home' ? preload('src/data/capabilities.ts') : ''].filter(Boolean).join('\n    ');

const page = (r, route) =>
  template
    .replace('<html lang="pt-PT">', `<html lang="${r.htmlLang}">`)
    .replace('<!--head-->', `${r.head}\n    ${preloads(route)}`)
    .replace('<!--app-->', r.html);

const routes = allRoutes();
let count = 0;
for (const route of routes) {
  const r = await render(route);
  const file = join(dist, r.path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, page(r, route));
  count++;
}

// 404: página inicial PT com noindex (o Apache serve-a via ErrorDocument).
const notFound = await render({ lang: 'pt', page: 'home' });
writeFileSync(
  join(dist, '404.html'),
  page({ ...notFound, head: notFound.head.replace(/<link rel="canonical"[^>]*>/, '') + '\n    <meta name="robots" content="noindex">' }, { lang: 'pt', page: 'home' }),
);

// Sitemap com alternates hreflang.
const byPage = new Map();
for (const r of routes) {
  if (!byPage.has(r.page)) byPage.set(r.page, []);
  byPage.get(r.page).push(r);
}
const paths = new Map();
for (const r of routes) paths.set(`${r.lang}:${r.page}`, (await render(r)).path);
const loc = (r) => SITE + paths.get(`${r.lang}:${r.page}`);
const today = new Date().toISOString().slice(0, 10);
const urls = routes.map((r) => {
  const alts = byPage
    .get(r.page)
    .map((a) => `    <xhtml:link rel="alternate" hreflang="${TAGS[a.lang]}" href="${loc(a)}"/>`)
    .join('\n');
  const prio = r.page === 'home' ? '1.0' : r.page === 'checklist' ? '0.6' : '0.3';
  return `  <url>\n    <loc>${loc(r)}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${prio}</priority>\n${alts}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${loc({ ...r, lang: 'pt' })}"/>\n  </url>`;
});
writeFileSync(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`,
);

rmSync(join(root, 'dist-ssr'), { recursive: true, force: true });
rmSync(join(dist, '.vite'), { recursive: true, force: true }); // o manifesto só serve à pré-renderização
console.log(`prerender: ${count} páginas + 404.html + sitemap.xml (${routes.length} URLs)`);
