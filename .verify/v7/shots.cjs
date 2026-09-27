/**
 * v7 — screenshots de TODAS as secções do modo clássico e dos estados do modo agente.
 * Uso: BASE=http://127.0.0.1:8098 PHASE=antes|depois THEMES=light,dark node .verify/v7/shots.cjs
 *   - tema: preferência do sistema emulada (colorScheme) + escolha guardada (dev-theme) — antes do
 *     tema escuro existir, «dark» mostra o que um visitante com o sistema em escuro via.
 *   - clássico: página inteira + cada secção (filhos diretos de .classic) + rodapé
 *   - agente: início, conversa guiada (simulação), Mega Brain, agendamento
 */
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT || 'C:/Users/User1/Overclock/Meu Primeiro Projeto/node_modules/playwright');

const BASE = process.env.BASE || 'http://127.0.0.1:8098';
const PHASE = process.env.PHASE || 'depois';
const THEMES = (process.env.THEMES || 'light,dark').split(',');
const OUT = path.join(__dirname, 'shots', PHASE);
fs.mkdirSync(OUT, { recursive: true });
const report = { phase: PHASE, shots: 0, overflow: [], errors: [] };

async function ctxFor(browser, w, h, theme, mode) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme, reducedMotion: 'reduce' });
  await ctx.addInitScript(
    ([theme, mode]) => {
      localStorage.setItem('dev-consent-v1', '{"marketing":false}');
      localStorage.setItem('dev-ai-consent-v1', '"ok"');
      localStorage.setItem('dev-theme', JSON.stringify(theme));
      localStorage.setItem('dev-mode', JSON.stringify(mode));
    },
    [theme, mode],
  );
  const page = await ctx.newPage();
  page.on('pageerror', (e) => report.errors.push(`${w} ${theme} ${mode}: ${e.message}`));
  return { ctx, page };
}
async function shot(page, name, opts = {}) {
  const o = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  if (o[0] > o[1]) report.overflow.push(`${name}: ${o[0]} > ${o[1]}`);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), ...opts });
  report.shots++;
}
async function settle(page) {
  await page.waitForFunction(() => !document.querySelector('.msg--typing'), null, { timeout: 20000 });
  await page.waitForFunction(() => document.querySelector('.chat__answers')?.dataset.streaming !== 'true', null, { timeout: 20000 });
  await page.waitForTimeout(400);
}

(async () => {
  const browser = await chromium.launch();
  for (const theme of THEMES) {
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const tag = `${w}-${theme}`;
      // ── modo clássico ──
      {
        const { ctx, page } = await ctxFor(browser, w, h, theme, 'read');
        await page.goto(BASE + '/#navegar', { waitUntil: 'networkidle' });
        await page.waitForSelector('.classic:not([hidden])');
        await page.waitForTimeout(500);
        await shot(page, `${tag}-classico-00-pagina`, { fullPage: true });
        await shot(page, `${tag}-classico-01-topo`);
        const parts = await page.$$('.classic > *');
        for (let i = 0; i < parts.length; i++) {
          const id = await parts[i].evaluate((el) => el.id || el.getAttribute('aria-labelledby') || el.className.split(' ')[0]);
          await parts[i].scrollIntoViewIfNeeded();
          await parts[i].screenshot({ path: path.join(OUT, `${tag}-classico-${String(i + 2).padStart(2, '0')}-${id}.png`) });
          report.shots++;
        }
        await (await page.$('footer')).screenshot({ path: path.join(OUT, `${tag}-classico-99-rodape.png`) });
        report.shots++;
        await ctx.close();
      }
      // ── modo agente ──
      {
        const { ctx, page } = await ctxFor(browser, w, h, theme, 'chat');
        await page.goto(BASE + '/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(800);
        await shot(page, `${tag}-agente-01-inicio`);
        await page.click('.chat__answers .btn--gold');
        await settle(page);
        await page.click('.chat__answers .answer >> nth=3');
        await settle(page);
        await page.click('.chat__answers .answer >> nth=2');
        await settle(page);
        await page.click('.team .btn--gold');
        await page.waitForSelector('.chat__answers .btn--gold', { timeout: 30000 });
        await settle(page);
        await shot(page, `${tag}-agente-02-simulacao`);
        await page.click('.chat__answers .btn--gold');
        await page.waitForSelector('.mb-panel', { timeout: 15000 });
        await page.waitForTimeout(900);
        await shot(page, `${tag}-agente-03-megabrain`);
        await page.click('.mb-panel .btn--gold');
        await page.waitForSelector('.stage .book', { timeout: 10000 });
        await page.waitForTimeout(500);
        await shot(page, `${tag}-agente-04-agendar`);
        await ctx.close();
      }
    }
  }
  await browser.close();
  fs.writeFileSync(path.join(__dirname, `shots-${PHASE}.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ shots: report.shots, overflow: report.overflow, errors: report.errors }, null, 2));
  if (report.overflow.length || report.errors.length) process.exitCode = 1;
})();
