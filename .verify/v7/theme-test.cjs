/**
 * Tema claro/escuro da superfície de leitura.
 *  - sem flash: com a app (JS) BLOQUEADA, a página pré-renderizada já pinta no tema certo (script inline no <head>);
 *  - padrão = sistema (prefers-color-scheme); escolha guardada ganha e persiste; localStorage a falhar não parte nada;
 *  - alternador sol/lua acessível (nome muda com o estado); modo agente sempre escuro e sem alternador;
 *  - theme-color coerente com a superfície visível;
 *  - axe-core (WCAG 2 A/AA, inclui contraste) sem violações no modo clássico, página legal e checklist, nos 2 temas.
 * Uso: BASE=http://127.0.0.1:8098 node .verify/v7/theme-test.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const NM = 'C:/Users/User1/Overclock/Meu Primeiro Projeto/node_modules';
const { chromium } = require(process.env.PLAYWRIGHT || `${NM}/playwright`);
const AXE = fs.readFileSync(require.resolve(`${NM}/axe-core/axe.min.js`), 'utf8');

const BASE = process.env.BASE || 'http://127.0.0.1:8098';
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✔' : '✘'} ${name}${detail ? ` — ${detail}` : ''}`);
};
const PAPER = { light: 'rgb(246, 241, 230)', dark: 'rgb(12, 11, 8)' };

async function ctx(browser, { scheme = 'light', stored, mode, w = 1440, h = 900, brokenStorage = false, noApp = false } = {}) {
  const c = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme });
  await c.addInitScript(
    ([stored, mode, broken]) => {
      if (broken) {
        Object.defineProperty(window, 'localStorage', {
          get() {
            throw new Error('bloqueado');
          },
        });
        return;
      }
      localStorage.setItem('dev-consent-v1', '{"marketing":false}');
      if (stored) localStorage.setItem('dev-theme', JSON.stringify(stored));
      if (mode) localStorage.setItem('dev-mode', JSON.stringify(mode));
    },
    [stored, mode, brokenStorage],
  );
  const page = await c.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  if (noApp) await page.route(/\/assets\/.*\.js$/, (r) => r.abort());
  return { c, page, errors };
}
const state = (page) =>
  page.evaluate(() => ({
    theme: document.documentElement.getAttribute('data-theme'),
    body: getComputedStyle(document.body).backgroundColor,
    meta: document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
  }));

(async () => {
  const browser = await chromium.launch();

  // 1) Sem flash: HTML pré-renderizado + script inline, sem a app (JS bloqueado) → já no tema certo.
  const head = fs.readFileSync(path.join(__dirname, '..', '..', 'dist', 'privacy-policy', 'index.html'), 'utf8');
  check('script de tema inline no <head>, antes do CSS', head.indexOf("setAttribute('data-theme'") > 0 && head.indexOf("setAttribute('data-theme'") < head.indexOf('<style>'));
  for (const scheme of ['light', 'dark']) {
    const { c, page } = await ctx(browser, { scheme, noApp: true });
    await page.goto(BASE + '/privacy-policy/', { waitUntil: 'domcontentloaded' });
    const s = await state(page);
    check(`sem flash (app bloqueada) · sistema ${scheme} → pinta ${scheme}`, s.theme === scheme && s.body === PAPER[scheme], JSON.stringify(s));
    await c.close();
  }

  // 2) Preferência do sistema vs escolha guardada; persistência; alternador acessível.
  {
    const { c, page, errors } = await ctx(browser, { scheme: 'dark', mode: 'read' });
    await page.goto(BASE + '/#navegar', { waitUntil: 'networkidle' });
    await page.waitForSelector('.classic:not([hidden])');
    let s = await state(page);
    check('padrão = sistema (escuro)', s.theme === 'dark' && s.meta === '#0c0b08', JSON.stringify(s));
    const btn = page.locator('.theme-toggle');
    check('alternador visível no header (modo clássico)', await btn.isVisible());
    const label1 = await btn.getAttribute('aria-label');
    await btn.click();
    s = await state(page);
    const label2 = await btn.getAttribute('aria-label');
    const stored = await page.evaluate(() => localStorage.getItem('dev-theme'));
    check('clique → claro, guardado em localStorage, theme-color claro', s.theme === 'light' && stored === '"light"' && s.meta === '#f6f1e6', JSON.stringify({ ...s, stored }));
    check('nome acessível do alternador acompanha o estado', label1 !== label2 && /claro/i.test(label1) && /escuro/i.test(label2), `${label1} → ${label2}`);
    await page.reload({ waitUntil: 'networkidle' });
    s = await state(page);
    check('escolha guardada ganha ao sistema depois de recarregar', s.theme === 'light', JSON.stringify(s));
    await btn.focus();
    await page.keyboard.press('Enter');
    check('alternador funciona pelo teclado', (await state(page)).theme === 'dark');
    check('sem erros JS', errors.length === 0, errors.join(' | '));
    await c.close();
  }

  // 3) localStorage a falhar (modo privado/bloqueado): segue o sistema, sem erros.
  {
    const { c, page, errors } = await ctx(browser, { scheme: 'dark', brokenStorage: true });
    await page.goto(BASE + '/privacy-policy/', { waitUntil: 'networkidle' });
    const s = await state(page);
    check('localStorage bloqueado → tema do sistema, sem erros', s.theme === 'dark' && errors.length === 0, JSON.stringify({ ...s, errors }));
    await c.close();
  }

  // 4) Modo agente: sempre escuro e sem alternador, mesmo com tema claro escolhido.
  {
    const { c, page } = await ctx(browser, { scheme: 'light', stored: 'light', mode: 'chat' });
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    const r = await page.evaluate(() => ({
      toggle: !!document.querySelector('.theme-toggle'),
      stage: getComputedStyle(document.querySelector('.stage')).backgroundColor,
      topbar: getComputedStyle(document.querySelector('.topbar')).backgroundColor,
      meta: document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
    }));
    check('modo agente com tema claro: palco e header escuros, sem alternador, theme-color escuro', !r.toggle && r.stage === 'rgb(13, 11, 8)' && r.topbar.startsWith('rgba(7, 6, 5') && r.meta === '#070605', JSON.stringify(r));
    // e ao passar a «Navegar», o tema escolhido aplica-se
    await page.click('.topbar__mode button:nth-child(2)');
    const s = await state(page);
    check('«Navegar» aplica o tema escolhido (claro)', s.body === PAPER.light && (await page.locator('.theme-toggle').isVisible()), JSON.stringify(s));
    await c.close();
  }

  // 5) Acessibilidade (axe WCAG 2 A/AA, com contraste) nas superfícies de leitura, 2 temas × 2 larguras.
  for (const theme of ['light', 'dark']) {
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      for (const [name, url, mode] of [['clássico', '/#navegar', 'read'], ['política de privacidade', '/privacy-policy/', null], ['checklist', '/checklist/', null]]) {
        const { c, page } = await ctx(browser, { scheme: theme, stored: theme, mode, w, h });
        await page.goto(BASE + url, { waitUntil: 'networkidle' });
        if (mode) await page.waitForSelector('.classic:not([hidden])');
        await page.addScriptTag({ content: AXE });
        const v = await page.evaluate(async () => {
          const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
          return r.violations.map((x) => `${x.id} (${x.nodes.length}): ${x.nodes[0].target.join(' ')} ${x.nodes[0].failureSummary?.split('\n')[1] ?? ''}`);
        });
        check(`axe ${theme} ${w} ${name}: 0 violações WCAG A/AA`, v.length === 0, v.join(' | '));
        await c.close();
      }
    }
  }

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} ok`);
  fs.writeFileSync(path.join(__dirname, 'theme-test.json'), JSON.stringify(results, null, 2));
  process.exit(failed.length ? 1 : 0);
})();
