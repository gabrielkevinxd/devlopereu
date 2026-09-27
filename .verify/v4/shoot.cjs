/**
 * Verificação v4 — CHECK MATCH no browser (qualificado e desqualificado), limite da conversa e painel do dono.
 * Servidor: PHP de produção a servir dist/ com AGENT_PROVIDER=mock e AGENT_MAX_TURNS=4 (check match ao 4.º turno).
 * Uso: BASE=http://127.0.0.1:8095 TOKEN=... node .verify/v4/shoot.cjs
 */
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT || 'C:/Users/User1/Overclock/Meu Primeiro Projeto/node_modules/playwright');

const BASE = process.env.BASE || 'http://127.0.0.1:8095';
const TOKEN = process.env.TOKEN;
const OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const report = { steps: 0, overflow: [], errors: [], checks: {} };
const check = (name, ok, detail) => {
  report.checks[name] = ok ? 'ok' : `FALHOU ${detail ?? ''}`;
  if (!ok) process.exitCode = 1;
};

async function shot(page, w, name) {
  const o = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  if (o[0] > o[1]) report.overflow.push(`${w} ${name}: ${o[0]} > ${o[1]}`);
  await page.screenshot({ path: path.join(OUT, `${w}-${name}.png`) });
  report.steps++;
}
async function settle(page) {
  await page.waitForFunction(() => !document.querySelector('.msg--typing'), null, { timeout: 20000 });
  await page.waitForFunction(() => document.querySelector('.chat__answers')?.dataset.streaming === 'false', null, { timeout: 20000 });
  await page.waitForTimeout(500);
}
async function say(page, text) {
  await page.fill('#composer-input', text);
  await page.click('.composer__send');
  await settle(page);
}
async function newPage(browser, w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => report.errors.push(`${w}: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && report.errors.push(`${w} console: ${m.text()}`));
  await page.addInitScript(() => {
    localStorage.setItem('dev-consent-v1', '{"marketing":false}');
    localStorage.setItem('dev-ai-consent-v1', '"ok"');
    window.open = (u) => ((window.__opened = u), null);
  });
  return { ctx, page };
}

async function qualified(browser, [w, h]) {
  const { ctx, page } = await newPage(browser, w, h);
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await say(page, 'Sou o dono de uma clínica dentária e perdemos imenso tempo com marcações por telefone');
  await say(page, 'Somos 3 pessoas, 10 horas cada por semana');
  await say(page, 'Usamos WhatsApp e uma agenda online');
  await shot(page, w, '01-conversa-antes-do-check-match');
  await say(page, 'Queremos resolver isto este trimestre');
  await page.waitForSelector('.stage .book');
  await page.waitForTimeout(600);
  const f = await page.evaluate(() => ({
    time: document.querySelector('.stage .chip--time input:checked')?.value,
    day: document.querySelector('.stage .book__chips--days input:checked')?.value,
    notes: document.querySelector('#ag-notes')?.value,
    last: [...document.querySelectorAll('.msg--agent')].pop()?.textContent ?? '',
  }));
  check(`${w} qualificado: resumo + pergunta de fecho`, /Resumindo/.test(f.last) && /30 minutos/.test(f.last), f.last.slice(0, 90));
  check(`${w} qualificado: agendamento com dia e hora já preenchidos`, f.time === '10:30' && /^\d{4}-\d{2}-\d{2}$/.test(f.day ?? ''), JSON.stringify(f));
  await page.evaluate(() => document.querySelector('.chat__log')?.scrollTo({ top: 1e6 }));
  await shot(page, w, '02-check-match-qualificado');
  await page.locator('.stage .book__preview').scrollIntoViewIfNeeded();
  await shot(page, w, '03-qualificado-agendamento-preenchido');
  // limite da conversa atingido → segue para o agendamento guiado, sem erro
  await say(page, 'E quanto tempo demora a implementar?');
  const txt = await page.locator('.chat__log').innerText();
  check(`${w} limite atingido → agendamento guiado sem erro`, /deixei o agendamento pronto/.test(txt) && (await page.locator('.stage .book').count()) === 1, txt.slice(-120));
  await shot(page, w, '04-limite-da-conversa');
  await page.fill('#ag-name', 'Ana Teste');
  await page.fill('#ag-contact', 'ana@exemplo.pt');
  await page.check('.stage .consent input');
  await page.click('.stage .book button[type=submit]');
  await page.waitForTimeout(800);
  check(`${w} pedido de reunião enviado`, String(await page.evaluate(() => window.__opened || '')).includes('wa.me'));
  await ctx.close();
}

async function disqualified(browser, [w, h]) {
  const { ctx, page } = await newPage(browser, w, h);
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  for (const t of ['Olá, sou estudante e estou só a ver', 'Quero só perceber como funciona a IA', 'É mesmo só curiosidade', 'Obrigado pela explicação']) await say(page, t);
  await page.waitForSelector('.stage[data-view="closed"]');
  const last = await page.locator('.msg--agent').last().innerText();
  check(`${w} desqualificado: agradece + checklist + contactos`, /checklist/i.test(last) && /929 070 650/.test(last), last.slice(0, 90));
  check(`${w} desqualificado: conversa com o LLM termina (sem campo de texto)`, (await page.locator('#composer-input').count()) === 0);
  check(`${w} desqualificado: palco com checklist`, (await page.locator('.stage .done a[href*="checklist"]').count()) === 1);
  await shot(page, w, '05-check-match-desqualificado');
  await ctx.close();
}

async function panel(browser, [w, h]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/api/admin.html');
  await page.fill('#token', TOKEN);
  await page.click('button');
  await page.waitForSelector('.grid');
  const t = await page.locator('main').textContent();
  check(`${w} painel do dono mostra gasto e resultados`, /Gasto/.test(t) && /Qualificados/.test(t) && /Desqualificados/.test(t) && /Pedidos de reunião/.test(t), t.slice(0, 120));
  await shot(page, w, '06-painel-do-dono');
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch();
  for (const s of [[390, 844], [1440, 900]]) {
    await qualified(browser, s);
    await disqualified(browser, s);
  }
  for (const s of [[390, 844], [1440, 900]]) await panel(browser, s);
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (report.overflow.length || report.errors.length) process.exitCode = 1;
})();
