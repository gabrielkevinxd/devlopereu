/**
 * v7 — funil e contagens:
 *  - «Ver o fluxo no agente» (modo clássico) → modo agente com o Mega Brain aberto nessa capacidade;
 *  - deep link /?cap=<id> (partilhável) → mesmo resultado; id inválido é ignorado;
 *  - contagens derivadas nos 6 idiomas (capacidades/áreas do catálogo, idiomas, tarefas da checklist);
 *  - responsivo 360→1920 nos 2 temas (modo clássico e agente) sem scroll horizontal.
 * Uso: BASE=http://127.0.0.1:8098 node .verify/v7/flow-test.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT || 'C:/Users/User1/Overclock/Meu Primeiro Projeto/node_modules/playwright');

const BASE = process.env.BASE || 'http://127.0.0.1:8098';
const ROOT = path.join(__dirname, '..', '..');
const SRC = fs.readFileSync(path.join(ROOT, 'src/data/capabilities.ts'), 'utf8');
const N_CAPS = [...SRC.matchAll(/^\s{4}id: '([a-z-]+)',$/gm)].length;
const N_GROUPS = new Set([...SRC.matchAll(/^\s{4}group: '([a-z]+)',$/gm)].map((m) => m[1])).size;
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✔' : '✘'} ${name}${detail ? ` — ${detail}` : ''}`);
};
async function open(browser, url, { w = 1440, h = 900, mode, scheme = 'light' } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme });
  await ctx.addInitScript((mode) => {
    localStorage.setItem('dev-consent-v1', '{"marketing":false}');
    localStorage.setItem('dev-ai-consent-v1', '"ok"');
    if (mode) localStorage.setItem('dev-mode', JSON.stringify(mode));
  }, mode);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  return { ctx, page, errors };
}

(async () => {
  const browser = await chromium.launch();

  // 1) CTA do modo clássico → Mega Brain nessa capacidade
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const { ctx, page, errors } = await open(browser, '/#navegar', { w, h, mode: 'read' });
    await page.waitForSelector('.classic:not([hidden]) .cap');
    const cta = page.locator('.cap__cta[href*="cap=whatsapp"]');
    const label = await cta.getAttribute('aria-label');
    await cta.scrollIntoViewIfNeeded();
    await cta.click();
    await page.waitForSelector('.mb-panel', { timeout: 15000 });
    // a mensagem do agente chega depois do «a escrever…»
    await page.waitForFunction(() => /Automação de WhatsApp/.test([...document.querySelectorAll('.msg--agent')].at(-1)?.textContent ?? ''), null, { timeout: 15000 }).catch(() => {});
    const r = await page.evaluate(() => ({
      mode: !document.querySelector('.ws').hidden,
      panel: document.querySelector('.mb-panel h3')?.textContent,
      on: document.querySelectorAll('.mb-node.is-on').length,
      msg: [...document.querySelectorAll('.msg--agent')].at(-1)?.textContent ?? '',
    }));
    check(`${w} «Ver o fluxo no agente» → modo agente, Mega Brain em «Automação de WhatsApp»`, r.mode && r.panel === 'Automação de WhatsApp' && r.on === 1 && /Automação de WhatsApp/.test(r.msg), JSON.stringify(r));
    check(`${w} nome acessível do CTA inclui a capacidade`, /Automação de WhatsApp/.test(label ?? ''), label);
    check(`${w} sem erros JS`, errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // 2) Deep link partilhável
  {
    const { ctx, page } = await open(browser, '/?cap=previsao-ml');
    await page.waitForSelector('.mb-panel', { timeout: 15000 });
    const name = await page.textContent('.mb-panel h3');
    check('/?cap=previsao-ml abre o Mega Brain nessa capacidade', name === 'Previsão e machine learning', name);
    await ctx.close();
    const { ctx: c2, page: p2, errors } = await open(browser, '/?cap=nao-existe');
    await p2.waitForTimeout(600);
    check('/?cap=<id inválido> é ignorado (sem erro, palco de arranque)', (await p2.locator('.mb-panel').count()) === 0 && errors.length === 0 && (await p2.locator('.awake').count()) === 1);
    await c2.close();
  }

  // 3) Contagens derivadas nos 6 idiomas
  const nums = { pt: /15 capacidades de IA em 5 áreas/, en: /15 AI capabilities across 5 areas/, fr: /15 capacités d’IA réparties en 5 domaines/, es: /15 capacidades de IA en 5 áreas/, de: /15 KI-Fähigkeiten in 5 Bereichen/, sv: /15 AI-förmågor inom 5 områden/ };
  const stale = /\b(seis|six|sechs|sex) (capacidades|capabilities|capacités|Fähigkeiten|förmågor)\b/i;
  const items = (fs.readFileSync(path.join(ROOT, 'src/i18n/pt.ts'), 'utf8').match(/items: \[([\s\S]*?)\]/)[1].match(/^\s+'/gm) || []).length;
  for (const lang of Object.keys(nums)) {
    const html = fs.readFileSync(path.join(ROOT, 'dist', lang === 'pt' ? '' : lang, 'index.html'), 'utf8');
    const re = new RegExp(String(nums[lang].source).replace('15', String(N_CAPS)).replace('5 ', `${N_GROUPS} `));
    check(`${lang}: «${N_CAPS} capacidades em ${N_GROUPS} áreas» no HTML pré-renderizado, sem «seis capacidades»`, re.test(html) && !stale.test(html));
    check(`${lang}: nº de tarefas da checklist derivado (${items}) e nº de idiomas (6)`, html.includes(`${items} `) && !/\{tasks\}|\{langs\}|\{caps\}/.test(html));
  }

  // 4) Responsivo 360→1920, 2 temas, sem scroll horizontal
  const over = [];
  for (const scheme of ['light', 'dark']) {
    for (const w of [360, 768, 1024, 1440, 1920]) {
      for (const [url, mode] of [['/#navegar', 'read'], ['/', 'chat']]) {
        const { ctx, page } = await open(browser, url, { w, h: 900, mode, scheme });
        const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (o > 0) over.push(`${scheme} ${w} ${mode}: +${o}px`);
        await ctx.close();
      }
    }
  }
  check('360/768/1024/1440/1920 × claro/escuro × clássico/agente: sem scroll horizontal', over.length === 0, over.join('; '));

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} ok`);
  fs.writeFileSync(path.join(__dirname, 'flow-test.json'), JSON.stringify(results, null, 2));
  process.exit(failed.length ? 1 : 0);
})();
