/**
 * Verificação visual v2: cada momento da experiência × 6 larguras + agendamento,
 * overflow horizontal, logo real visível e RGPD do Meta Pixel.
 * Uso: BASE=http://localhost:4173 node .verify/v2/shoot.cjs
 */
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT || 'C:/Users/User1/Overclock/Meu Primeiro Projeto/node_modules/playwright');

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = path.join(__dirname, '..', 'v3', 'regressao-v2', 'shots');
fs.mkdirSync(OUT, { recursive: true });
const SIZES = [
  [360, 780],
  [390, 844],
  [768, 1024],
  [1024, 768],
  [1440, 900],
  [1920, 1080],
];
const report = { overflow: [], logo: [], pixel: {}, errors: [], opened: null, steps: 0 };

async function settle(page) {
  await page.waitForFunction(() => !document.querySelector('.msg--typing'), null, { timeout: 15000 });
  await page.waitForTimeout(250);
}

async function check(page, w, name) {
  const o = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  if (o.sw > o.cw) report.overflow.push(`${w} ${name}: scrollWidth ${o.sw} > ${o.cw}`);
  const logo = await page.evaluate(() =>
    [...document.querySelectorAll('.logo img')]
      .filter((i) => {
        const r = i.getBoundingClientRect();
        return i.complete && i.naturalWidth > 0 && r.width > 20 && r.bottom > 0 && r.top < innerHeight && getComputedStyle(i).visibility !== 'hidden';
      })
      .map((i) => i.currentSrc.split('/').pop()),
  );
  report.logo.push(`${w} ${name}: ${logo.join(', ') || 'NENHUM'}`);
}

async function shot(page, w, name) {
  await check(page, w, name);
  await page.screenshot({ path: path.join(OUT, `${w}-${name}.png`) });
  report.steps++;
}

async function flow(browser, [w, h]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => report.errors.push(`${w}: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && report.errors.push(`${w} console: ${m.text()}`));
  await page.addInitScript(() => {
    window.open = (u) => {
      window.__opened = u;
      return null;
    };
  });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await shot(page, w, '01-intro-cookies');
  await page.click('.cookie button:first-child'); // Rejeitar
  await shot(page, w, '02-intro');

  await page.click('.chat__answers .btn--gold');
  await settle(page);
  await shot(page, w, '03-setor');
  await page.click('.chat__answers .answer >> nth=1');
  await settle(page);
  await shot(page, w, '04-dor');
  await page.click('.chat__answers .answer >> nth=0');
  await settle(page);
  await page.fill('.team input[type=range] >> nth=0', '8');
  await page.fill('.team input[type=range] >> nth=1', '10');
  await shot(page, w, '05-equipa');
  await page.click('.team .btn--gold');
  await page.waitForSelector('.chat__answers .btn--gold', { timeout: 20000 });
  await settle(page);
  await shot(page, w, '06-simulacao');
  await page.click('.chat__answers .btn--gold');
  await settle(page);
  await page.click('.cap.is-on button >> nth=0');
  await settle(page);
  await shot(page, w, '07-capacidades');
  await page.click('.chat__answers .btn--gold');
  await settle(page);
  await page.waitForSelector('.stage .book .chip input', { state: 'attached' });
  await page.waitForTimeout(400);
  await shot(page, w, '08-agendar');
  await page.click('.stage .book__chips--days .chip >> nth=2');
  await page.click('.stage .chip--time >> nth=3');
  await page.fill('#ag-name', 'Maria Teste');
  await page.fill('#ag-company', 'Empresa Exemplo');
  await page.fill('#ag-contact', 'maria@exemplo.pt');
  await page.check('.stage .consent input');
  await page.locator('.stage .book__preview').scrollIntoViewIfNeeded();
  await shot(page, w, '09-agendar-preenchido');
  await page.click('.stage .book button[type=submit]');
  await settle(page);
  if (w === 390) report.opened = await page.evaluate(() => window.__opened);
  await page.waitForTimeout(600);
  await shot(page, w, '10-concluido');

  // Modo clássico
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('.topbar__mode button, .chat__tool--classic')].find(
      (el) => el.offsetParent !== null && (el.classList.contains('chat__tool--classic') || el.textContent.trim() === el.parentElement.lastElementChild.textContent.trim()),
    );
    b.click();
  });
  await page.waitForTimeout(400);
  await shot(page, w, '11-classico');
  await page.locator('#agendar').scrollIntoViewIfNeeded();
  await shot(page, w, '12-classico-agendar');
  await page.evaluate(() => localStorage.removeItem('dev-mode'));
  await ctx.close();
}

async function pixelCheck(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const fb = [];
  page.on('request', (r) => r.url().includes('facebook') && fb.push(r.url()));
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  report.pixel.beforeConsent = fb.length;
  await page.click('.cookie button:last-child'); // Aceitar
  await page.waitForTimeout(1500);
  report.pixel.afterAccept = fb.length;
  report.pixel.stored = await page.evaluate(() => localStorage.getItem('dev-consent-v1'));
  await page.reload({ waitUntil: 'networkidle' });
  report.pixel.bannerAfterReload = await page.locator('.cookie').count();
  await ctx.close();
}

async function extraPages(browser) {
  for (const [w, h] of [SIZES[0], SIZES[4]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.addInitScript(() => localStorage.setItem('dev-consent-v1', '{"marketing":false}'));
    for (const [p, n] of [
      ['/checklist/', '13-checklist'],
      ['/privacy-policy/', '14-privacidade'],
      ['/en/', '15-en'],
      ['/de/', '16-de'],
    ]) {
      await page.goto(BASE + p, { waitUntil: 'networkidle' });
      await shot(page, w, n);
    }
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await shot(page, w, '17-rodape');
    await ctx.close();
  }
}

(async () => {
  const browser = await chromium.launch();
  for (const s of SIZES) await flow(browser, s);
  await pixelCheck(browser);
  await extraPages(browser);
  await browser.close();
  fs.writeFileSync(path.join(__dirname, '..', 'v3', 'regressao-v2', 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ steps: report.steps, overflow: report.overflow, errors: report.errors.slice(0, 10), pixel: report.pixel, opened: report.opened }, null, 2));
  process.exit(report.overflow.length || report.errors.length ? 1 : 0);
})();
