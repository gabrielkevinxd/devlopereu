/**
 * Painel do dono com os botões «Reiniciar o meu acesso» / «Reiniciar todos os clientes» (1440 e 390).
 * Cria 3 clientes (3 sessões) neste IP, carrega em «Reiniciar o meu acesso» e depois em «todos» (com confirmação).
 * Uso: BASE=http://127.0.0.1:8095 TOKEN=... node .verify/v6/shoot.cjs
 */
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT || 'C:/Users/User1/Overclock/Meu Primeiro Projeto/node_modules/playwright');

const BASE = process.env.BASE || 'http://127.0.0.1:8095';
const TOKEN = process.env.TOKEN;
const API = `${BASE}/api/agent.php`;
const OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
let fail = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? '✔' : '✘'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fail++;
};
const seed = async (n, tag) => {
  for (let i = 0; i < n; i++) {
    await (await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'chat', lang: 'pt', sid: `shot-${tag}-${i}-000`, messages: [{ role: 'user', text: 'Tenho uma loja' }], state: {} }) })).text();
  }
};

(async () => {
  const browser = await chromium.launch();
  for (const [w, h] of [[1440, 1000], [390, 844]]) {
    await seed(3, w);
    const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/api/admin.html`);
    await page.fill('#token', TOKEN);
    await page.click('#f button');
    await page.waitForSelector('[data-reset="mine"]');
    await page.screenshot({ path: path.join(OUT, `${w}-painel-botoes.png`), fullPage: true });
    await page.click('[data-reset="mine"]');
    await page.waitForSelector('#reset-result .result');
    const msg = await page.textContent('#reset-result');
    check(`${w} «Reiniciar o meu acesso» → «3 clientes reiniciados» + dica`, /3 clientes reiniciados/.test(msg) && /separador novo/.test(msg), msg);
    await page.screenshot({ path: path.join(OUT, `${w}-painel-reiniciado.png`), fullPage: true });
    // «todos»: cancelar a confirmação não faz nada; aceitar reinicia
    await seed(2, `${w}b`);
    page.once('dialog', (d) => d.dismiss());
    await page.click('[data-reset="all"]');
    await page.waitForTimeout(500);
    check(`${w} «todos» cancelado na confirmação → nada muda`, (await page.textContent('#reset-result')) === msg);
    let asked = '';
    page.once('dialog', (d) => {
      asked = d.message();
      d.accept();
    });
    await page.click('[data-reset="all"]');
    await page.waitForFunction((m) => document.querySelector('#reset-result')?.textContent !== m, msg);
    const msg2 = await page.textContent('#reset-result');
    check(`${w} «todos» com confirmação → «2 clientes reiniciados»`, /confirm|TODOS/.test(asked) && /2 clientes reiniciados/.test(msg2), msg2);
    const o = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
    check(`${w} sem scroll horizontal`, o);
    check(`${w} sem erros JS`, errors.length === 0, errors.join(' | '));
    await page.screenshot({ path: path.join(OUT, `${w}-painel-todos.png`), fullPage: true });
    await page.context().close();
  }
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
