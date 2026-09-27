/**
 * Mega Brain (centro de comando das capacidades): 3 fluxos adaptados diferentes, 390/1440 (+360/1920 responsivo).
 *   1) conversa com o LLM (mock) numa clínica → módulos escolhidos pelo modelo + fluxo gerado pelo modelo
 *   2) fluxo guiado: comércio + atendimento → fluxo do catálogo adaptado ({who}/{pain}/{sector})
 *   3) fluxo guiado: indústria + encomendas/stock → previsão (ML) adaptada
 * Uso: BASE=http://127.0.0.1:8097 node .verify/v5/megabrain.cjs
 */
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT || 'C:/Users/User1/Overclock/Meu Primeiro Projeto/node_modules/playwright');

const BASE = process.env.BASE || 'http://127.0.0.1:8097';
const OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const report = { steps: 0, overflow: [], errors: [], checks: {} };
const check = (name, ok, detail = '') => {
  report.checks[name] = ok ? 'ok' : `FALHOU ${detail}`;
  console.log(`${ok ? '✔' : '✘'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
};
async function shot(page, w, name, full = false) {
  const o = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  if (o[0] > o[1]) report.overflow.push(`${w} ${name}: ${o[0]} > ${o[1]}`);
  await page.waitForTimeout(650); // fim da animação de entrada do painel
  await page.screenshot({ path: path.join(OUT, `${w}-${name}.png`), fullPage: full });
  report.steps++;
}
async function settle(page) {
  await page.waitForFunction(() => !document.querySelector('.msg--typing'), null, { timeout: 20000 });
  await page.waitForFunction(() => document.querySelector('.chat__answers')?.dataset.streaming !== 'true', null, { timeout: 20000 });
  await page.waitForTimeout(400);
}
async function newPage(browser, w, h, reduce = false) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: reduce ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => report.errors.push(`${w}: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && report.errors.push(`${w} console: ${m.text()}`));
  await page.addInitScript(() => {
    localStorage.setItem('dev-consent-v1', '{"marketing":false}');
    localStorage.setItem('dev-ai-consent-v1', '"ok"');
  });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  return { ctx, page };
}
const panel = (page) => page.evaluate(() => ({
  title: document.querySelector('.mb__head h2')?.textContent,
  name: document.querySelector('.mb-panel h3')?.textContent,
  flow: [...document.querySelectorAll('.mb-flow__text')].map((e) => e.textContent),
  nodes: document.querySelectorAll('.mb-node').length,
  on: document.querySelectorAll('.mb-node.is-on').length,
  note: document.querySelector('.mb-panel__note')?.textContent,
  why: document.querySelector('.mb-panel__why')?.textContent ?? '',
}));

async function guided(page, sectorIdx, painIdx) {
  await page.click('.chat__answers .btn--gold'); // «Mostre-me na minha empresa»
  await settle(page);
  await page.click(`.chat__answers .answer >> nth=${sectorIdx}`);
  await settle(page);
  await page.click(`.chat__answers .answer >> nth=${painIdx}`);
  await settle(page);
  await page.click('.team .btn--gold');
  await page.waitForSelector('.chat__answers .btn--gold', { timeout: 30000 });
  await settle(page);
  await page.click('.chat__answers .btn--gold'); // «Que capacidades usaria?»
  await page.waitForSelector('.mb-panel', { timeout: 15000 });
  await page.waitForTimeout(900);
}

(async () => {
  const browser = await chromium.launch();
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    // 1) LLM (mock): clínica → capacidades escolhidas pelo modelo, com fluxo gerado pelo modelo
    {
      const { ctx, page } = await newPage(browser, w, h);
      for (const t of ['Tenho uma clínica dentária e perdemos imenso tempo com marcações por telefone e WhatsApp', '4 pessoas, 6 horas cada', 'Que serviços usariam?']) {
        await page.fill('#composer-input', t);
        await page.click('.composer__send');
        await settle(page);
      }
      await page.waitForSelector('.mb-panel', { timeout: 15000 });
      await page.waitForTimeout(1800); // deixa a animação do fluxo avançar
      const p = await panel(page);
      check(`${w} LLM: 15 módulos, 3 ativados pelo modelo`, p.nodes === 15 && p.on === 3, `${p.nodes}/${p.on}`);
      check(`${w} LLM: fluxo adaptado gerado pelo modelo + razão`, p.flow[0] === 'Paciente liga para marcar consulta' && /24\/7/.test(p.why), p.flow.join(' | '));
      check(`${w} LLM: marcado como exemplo ilustrativo`, /ilustrativo/.test(p.note ?? ''));
      await page.locator('.mb').scrollIntoViewIfNeeded();
      await shot(page, w, 'mb-01-llm-clinica');
      // módulo disponível (não ativado) com fluxo adaptado ao caso da clínica
      await page.click('.mb-node[aria-label^="IA sobre os seus documentos"]');
      await page.waitForTimeout(700);
      const p2 = await panel(page);
      check(`${w} LLM: módulo não ativado mostra fluxo adaptado ao caso`, p2.name?.startsWith('IA sobre os seus documentos') && p2.flow[0].includes('marcações'), p2.flow.join(' | '));
      await page.locator('.mb-panel').scrollIntoViewIfNeeded();
      await shot(page, w, 'mb-02-llm-modulo-disponivel');
      // funil: o CTA leva ao agendamento
      await page.click('.mb-panel .btn--gold');
      await page.waitForSelector('.stage .book', { timeout: 10000 });
      check(`${w} CTA do Mega Brain → agendamento`, true);
      await ctx.close();
    }
    // 2) Guiado: comércio + atendimento
    {
      const { ctx, page } = await newPage(browser, w, h);
      await guided(page, 0, 0);
      const p = await panel(page);
      check(`${w} guiado comércio: fluxo WhatsApp adaptado (clientes da loja)`, p.name === 'Automação de WhatsApp' && p.flow[0] === 'Mensagem de clientes da loja no WhatsApp', p.flow.join(' | '));
      check(`${w} guiado comércio: título com o setor`, /comércio e e-commerce/.test(p.title ?? ''), p.title);
      await page.locator('.mb').scrollIntoViewIfNeeded();
      await shot(page, w, 'mb-03-guiado-comercio');
      await ctx.close();
    }
    // 3) Guiado: indústria + encomendas e stock
    {
      const { ctx, page } = await newPage(browser, w, h);
      await guided(page, 2, 5);
      const p = await panel(page);
      check(`${w} guiado indústria: previsão ML adaptada ao setor`, p.name === 'Previsão e machine learning' && p.flow[0] === 'Histórico de indústria e logística', p.flow.join(' | '));
      await page.locator('.mb').scrollIntoViewIfNeeded();
      await shot(page, w, 'mb-04-guiado-industria');
      await ctx.close();
    }
  }
  // Responsivo extra: 360 e 1920
  for (const [w, h] of [[360, 780], [1920, 1080]]) {
    const { ctx, page } = await newPage(browser, w, h);
    await guided(page, 3, 2); // saúde + marcações
    await page.locator('.mb').scrollIntoViewIfNeeded();
    await shot(page, w, 'mb-05-responsivo');
    await ctx.close();
  }
  // prefers-reduced-motion: sem animações, fluxo completo visível
  {
    const { ctx, page } = await newPage(browser, 1440, 900, true);
    await guided(page, 1, 1);
    const all = await page.evaluate(() => document.querySelector('.mb-flow')?.dataset.step);
    check('reduced-motion: fluxo mostrado completo e estático', all === '4', `data-step=${all}`);
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'megabrain.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ steps: report.steps, overflow: report.overflow, errors: report.errors }, null, 2));
  if (report.overflow.length || report.errors.length) process.exitCode = 1;
})();
