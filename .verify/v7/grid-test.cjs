/**
 * «O que fazemos» (e «Como trabalhamos», «Sobre») sem células vazias — 360/768/1024/1440/1920.
 * Uma linha está «cheia» quando o último item acaba na margem direita do contentor (±2 px):
 * se sobrar espaço no fim de uma linha, é um buraco.
 *  1) catálogo real (15 capacidades em 5 grupos), nos 2 temas;
 *  2) robustez: cada lista é reescrita com 1…9 itens (clones) e volta a verificar-se;
 *  3) contagens: o texto da secção diz o nº real do catálogo e não há «seis/6 capacidades» escritos à mão.
 * Uso: BASE=http://127.0.0.1:8098 node .verify/v7/grid-test.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT || 'C:/Users/User1/Overclock/Meu Primeiro Projeto/node_modules/playwright');

const BASE = process.env.BASE || 'http://127.0.0.1:8098';
const SRC = fs.readFileSync(path.join(__dirname, '..', '..', 'src/data/capabilities.ts'), 'utf8');
const N_CAPS = [...SRC.matchAll(/^\s{4}id: '([a-z-]+)',$/gm)].length;
const N_GROUPS = new Set([...SRC.matchAll(/^\s{4}group: '([a-z]+)',$/gm)].map((m) => m[1])).size;
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✔' : '✘'} ${name}${detail ? ` — ${detail}` : ''}`);
};

/** Para cada contentor: agrupa os filhos por linha (top) e mede o espaço livre no fim de cada linha. */
const holes = (page, selector) =>
  page.evaluate((sel) => {
    const out = [];
    for (const box of document.querySelectorAll(sel)) {
      const cs = getComputedStyle(box);
      const r = box.getBoundingClientRect();
      const right = r.right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth);
      const rows = new Map();
      for (const el of box.children) {
        const b = el.getBoundingClientRect();
        if (!b.width) continue;
        const k = Math.round(b.top);
        rows.set(k, Math.max(rows.get(k) ?? 0, b.right));
      }
      [...rows.values()].forEach((end, i) => {
        const free = right - end;
        if (free > 2) out.push(`${sel}#${[...document.querySelectorAll(sel)].indexOf(box)} linha ${i + 1}: ${Math.round(free)} px vazios`);
      });
    }
    return out;
  }, selector);

(async () => {
  const browser = await chromium.launch();
  for (const theme of ['light', 'dark']) {
    for (const w of [360, 768, 1024, 1440, 1920]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, colorScheme: theme });
      await ctx.addInitScript(() => {
        localStorage.setItem('dev-consent-v1', '{"marketing":false}');
        localStorage.setItem('dev-mode', '"read"');
      });
      const page = await ctx.newPage();
      await page.goto(BASE + '/#navegar', { waitUntil: 'networkidle' });
      await page.waitForSelector('.classic:not([hidden]) .cap');
      const n = await page.$$eval('.cap', (e) => e.length);
      const g = await page.$$eval('.caps__group', (e) => e.length);
      if (theme === 'light') check(`${w}: catálogo completo (${N_CAPS} capacidades em ${N_GROUPS} grupos)`, n === N_CAPS && g === N_GROUPS, `${n}/${g}`);
      const h = [...(await holes(page, '.caps__list')), ...(await holes(page, '.steps')), ...(await holes(page, '.facts'))];
      check(`${w} ${theme}: «O que fazemos», «Como trabalhamos» e factos sem células vazias`, h.length === 0, h.join('; '));
      const cells = await page.$$eval('.classic li, .classic .caps__list', (els) => els.filter((e) => e.children.length === 0 && !e.textContent.trim()).length);
      check(`${w} ${theme}: nenhuma célula vazia no DOM`, cells === 0, `${cells}`);
      if (theme === 'light') {
        // robustez: qualquer nº de itens (1…9) em cada lista
        const bad = [];
        for (let k = 1; k <= 9; k++) {
          await page.evaluate((k) => {
            for (const list of document.querySelectorAll('.caps__list')) {
              if (!list.dataset.orig) list.dataset.orig = list.innerHTML;
              const tpl = list.firstElementChild.cloneNode(true);
              list.replaceChildren(...Array.from({ length: k }, () => tpl.cloneNode(true)));
              list.dataset.count = String(k);
            }
          }, k);
          const hk = await holes(page, '.caps__list');
          if (hk.length) bad.push(`${k} itens: ${hk[0]}`);
        }
        check(`${w}: 1…9 itens por grupo nunca deixam buracos`, bad.length === 0, bad.join('; '));
        if (w === 1440) {
          // controlo negativo: o layout antigo (grelha de 4 colunas com 6 itens) TEM de ser apanhado
          await page.addStyleTag({ content: '.caps__list{display:grid!important;grid-template-columns:repeat(4,1fr)}' });
          await page.evaluate(() => {
            const list = document.querySelector('.caps__list');
            const tpl = list.firstElementChild.cloneNode(true);
            list.replaceChildren(...Array.from({ length: 6 }, () => tpl.cloneNode(true)));
          });
          const neg = await holes(page, '.caps__list');
          check('controlo negativo: grelha antiga (6 em 4 colunas) é detetada como buraco', neg.length > 0, neg[0] ?? 'não detetou');
        }
        const lead = await page.textContent('#c-services .shead__lead p');
        const text = await page.textContent('.classic');
        check(`${w}: texto diz ${N_CAPS} capacidades em ${N_GROUPS} áreas (derivado)`, text.includes(`${N_CAPS} capacidades de IA em ${N_GROUPS} áreas`), lead);
        check(`${w}: sem «Seis capacidades»/«seis idiomas» escritos à mão`, !/seis capacidades|seis idiomas/i.test(text), '');
      }
      await ctx.close();
    }
  }
  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} ok`);
  fs.writeFileSync(path.join(__dirname, 'grid-test.json'), JSON.stringify(results, null, 2));
  process.exit(failed.length ? 1 : 0);
})();
