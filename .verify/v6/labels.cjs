/**
 * Mega Brain — etiquetas da órbita sem colisões + ecrã de arranque com o número do catálogo.
 *  - força qualquer combinação de módulos ativos intercetando a resposta NDJSON do chat (page.route):
 *    a app recebe um unlock_capabilities igual ao que o LLM enviaria — sem código de teste em produção;
 *  - para cada combinação e largura (1024/1440/1920) mede as caixas das etiquetas visíveis e verifica que
 *    não se intersectam entre si, não tapam os outros módulos nem saem do reator;
 *  - 3–4 módulos ADJACENTES (todos os quadrantes) + 40 combinações aleatórias (semente fixa) + módulo
 *    selecionado não ativo;
 *  - arranque: «capacidades · N/N» com N = nº de módulos do catálogo, nos 6 idiomas.
 * Uso: BASE=http://127.0.0.1:8097 PHASE=depois node .verify/v6/labels.cjs
 */
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT || 'C:/Users/User1/Overclock/Meu Primeiro Projeto/node_modules/playwright');

const BASE = process.env.BASE || 'http://127.0.0.1:8097';
const PHASE = process.env.PHASE || 'depois';
const OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const SRC = fs.readFileSync(path.join(__dirname, '..', '..', 'src/data/capabilities.ts'), 'utf8');
const IDS = [...SRC.matchAll(/^\s{4}id: '([a-z-]+)',$/gm)].map((m) => m[1]);
const report = { phase: PHASE, catalog: IDS.length, checks: [], failures: [] };
const check = (name, ok, detail = '') => {
  report.checks.push({ name, ok, detail });
  if (!ok) report.failures.push(`${name} ${detail}`);
  console.log(`${ok ? '✔' : '✘'} ${name}${detail ? ` — ${detail}` : ''}`);
};

// combinações de índices do catálogo (ordem da órbita, começa no topo e roda no sentido horário)
const ADJ = {
  'topo-0-3': [0, 1, 2, 3],
  'direita-3-6': [3, 4, 5, 6],
  'baixo-6-9': [6, 7, 8, 9],
  'esquerda-10-13': [10, 11, 12, 13],
  'volta-13-1': [13, 14, 0, 1],
  'clinica-1-2-7': [1, 2, 7],
};
let seed = 20260927;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const RANDOM = Array.from({ length: 40 }, () => {
  const k = 3 + Math.floor(rnd() * 4); // 3..6 (máximo que a app aceita)
  const s = new Set();
  while (s.size < k) s.add(Math.floor(rnd() * IDS.length));
  return [...s];
});

async function open(browser, w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    localStorage.setItem('dev-consent-v1', '{"marketing":false}');
    localStorage.setItem('dev-ai-consent-v1', '"ok"');
  });
  let ids = [];
  await page.route('**/api/agent.php', (route) => {
    if (route.request().method() !== 'POST' || !/"action":"chat"/.test(route.request().postData() || '')) return route.continue();
    const ev = [
      { t: 'meta', check: false },
      { t: 'text', d: 'Destaquei no palco as capacidades para o seu caso.' },
      { t: 'tool', name: 'unlock_capabilities', args: { ids, reasons: ids.map(() => 'Exemplo ilustrativo.') } },
      { t: 'done' },
    ];
    return route.fulfill({ status: 200, contentType: 'application/x-ndjson', body: ev.map((e) => JSON.stringify(e)).join('\n') + '\n' });
  });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  return { ctx, page, errors, setIds: (v) => (ids = v) };
}

async function unlock(page, setIds, idx, first) {
  setIds(idx.map((i) => IDS[i]));
  await page.fill('#composer-input', first ? 'Que serviços usariam?' : 'E estas capacidades?');
  await page.click('.composer__send');
  await page.waitForSelector('.mb-panel', { timeout: 15000 });
  await page.waitForFunction((n) => document.querySelectorAll('.mb-node.is-on').length === n, idx.length, { timeout: 15000 });
  await page.waitForFunction(() => document.querySelector('.chat__answers')?.dataset.streaming !== 'true', null, { timeout: 15000 });
  await page.waitForTimeout(700);
}

/** Caixas visíveis das etiquetas (qualquer implementação) + pontos dos módulos + reator. */
const measure = (page) =>
  page.evaluate(() => {
    const vis = (el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0 && r.width > 0 && r.height > 0;
    };
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, r: r.right, b: r.bottom };
    };
    const labels = [...document.querySelectorAll('.mb-tag, .mb-node__label')].filter(vis).map((el) => ({
      id: el.dataset.name || el.closest('.mb-node')?.getAttribute('aria-label')?.split(' — ')[0],
      text: el.querySelector('.mb-tag__full') ? el.dataset.name : el.textContent,
      short: el.dataset.fit === 'short',
      overflow: el.scrollWidth > el.clientWidth + 1,
      ...box(el),
    }));
    const dots = [...document.querySelectorAll('.mb-node__dot')].map((el) => ({ id: el.closest('.mb-node').getAttribute('aria-label').split(' — ')[0], ...box(el) }));
    const re = box(document.querySelector('.mb__reactor'));
    const names = new Map([...document.querySelectorAll('.mb-node')].map((b) => [b.getAttribute('aria-label').split(' — ')[0], b]));
    return { labels, dots, reactor: re, on: [...document.querySelectorAll('.mb-node.is-on, .mb-node.is-sel')].map((b) => b.getAttribute('aria-label').split(' — ')[0]), names: [...names.keys()], sel: document.querySelector('.mb-node.is-sel')?.getAttribute('aria-label').split(' — ')[0] };
  });

const hit = (a, b) => a.x < b.r && b.x < a.r && a.y < b.b && b.y < a.b;
function verify(tag, m) {
  const bad = [];
  for (let i = 0; i < m.labels.length; i++)
    for (let j = i + 1; j < m.labels.length; j++) if (hit(m.labels[i], m.labels[j])) bad.push(`«${m.labels[i].text}» × «${m.labels[j].text}»`);
  const overDots = [];
  // os módulos são círculos (border-radius 50 %): caixa × círculo; o próprio módulo também não pode ser tapado
  const hitCircle = (a, d) => {
    const cx = (d.x + d.r) / 2, cy = (d.y + d.b) / 2, r = (d.r - d.x) / 2;
    const dx = cx - Math.max(a.x, Math.min(cx, a.r)), dy = cy - Math.max(a.y, Math.min(cy, a.b));
    return dx * dx + dy * dy < r * r;
  };
  for (const l of m.labels) for (const d of m.dots) if (hitCircle(l, d)) overDots.push(`«${l.text}» tapa ${d.id}`);
  const out = m.labels.filter((l) => l.x < m.reactor.x - 1 || l.r > m.reactor.r + 1 || l.y < m.reactor.y - 1 || l.b > m.reactor.b + 1).map((l) => l.text);
  const named = m.labels.length;
  const shown = new Set(m.labels.map((l) => l.id));
  const hidden = m.on.filter((n) => !shown.has(n));
  if (hidden.length) console.log(`   · ${tag}: sem espaço → escondida(s) (nome no tooltip/painel): ${hidden.join(', ')}`);
  report.hidden = (report.hidden || 0) + hidden.length;
  const shortened = m.labels.filter((l) => l.short).map((l) => l.text);
  if (shortened.length) console.log(`   · ${tag}: abreviada(s) (nome completo no tooltip/painel): ${shortened.join(', ')}`);
  report.shortened = (report.shortened || 0) + shortened.length;
  report.total = (report.total || 0) + m.on.length;
  check(`${tag}: o módulo selecionado tem sempre etiqueta`, !m.sel || shown.has(m.sel), m.sel);
  const clipped = m.labels.filter((l) => l.overflow).map((l) => l.text);
  check(`${tag}: texto cabe na caixa`, clipped.length === 0, clipped.join('; '));
  check(`${tag}: etiquetas não se intersectam`, bad.length === 0, bad.join('; '));
  check(`${tag}: etiquetas não tapam outros módulos`, overDots.length === 0, overDots.join('; '));
  check(`${tag}: etiquetas dentro do reator`, out.length === 0, out.join('; '));
  return { named, active: m.on.length };
}

(async () => {
  const browser = await chromium.launch();
  let named = 0;
  let wanted = 0;
  for (const [w, h] of [[1024, 768], [1440, 900], [1920, 1080]]) {
    const { ctx, page, errors, setIds } = await open(browser, w, h);
    let first = true;
    for (const [name, idx] of Object.entries(ADJ)) {
      await unlock(page, setIds, idx, first);
      first = false;
      const r = verify(`${w} ${name}`, await measure(page));
      named += r.named;
      wanted += r.active;
      await page.locator('.mb__reactor').scrollIntoViewIfNeeded();
      await page.locator('.mb__reactor').screenshot({ path: path.join(OUT, `${PHASE}-${w}-mb-${name}.png`) });
    }
    // módulo selecionado NÃO ativo, entre dois ativos (etiqueta extra no meio)
    await unlock(page, setIds, [1, 3, 4], false);
    await page.click(`.mb-node >> nth=2`);
    await page.mouse.move(2, 2); // o tooltip de hover é transitório; mede-se o estado em repouso
    await page.waitForTimeout(500);
    verify(`${w} selecionado-inativo-2-entre-1-3`, await measure(page));
    await page.locator('.mb__reactor').screenshot({ path: path.join(OUT, `${PHASE}-${w}-mb-selecionado-inativo.png`) });
    if (w === 1440) await page.locator('.mb').screenshot({ path: path.join(OUT, `${PHASE}-1440-mb-completo.png`) });
    for (let i = 0; i < RANDOM.length; i++) {
      await unlock(page, setIds, RANDOM[i], false);
      verify(`${w} aleatória ${i + 1} [${RANDOM[i].join(',')}]`, await measure(page));
    }
    check(`${w} sem erros JS`, errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // mobile mantém o que estava: sem etiquetas na órbita (só o painel)
  for (const [w, h] of [[390, 844], [360, 780]]) {
    const { ctx, page, setIds } = await open(browser, w, h);
    await unlock(page, setIds, [0, 1, 2, 3], true);
    const m = await measure(page);
    check(`${w} mobile: sem etiquetas na órbita (como antes)`, m.labels.length === 0, `${m.labels.length} visíveis`);
    await page.locator('.mb__reactor').screenshot({ path: path.join(OUT, `${PHASE}-${w}-mb-mobile.png`) });
    await ctx.close();
  }
  console.log(`etiquetas visíveis ${named} para ${wanted} módulos ativos/selecionados (combinações adjacentes)`);
  console.log(`todas as combinações: ${report.total} etiquetas pedidas · ${report.shortened || 0} abreviadas · ${report.hidden || 0} escondidas`);
  report.labelsShown = { named, wanted };

  // Ecrã de arranque: número do catálogo nos 6 idiomas
  for (const lang of ['pt', 'en', 'fr', 'es', 'de', 'sv']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${BASE}/${lang === 'pt' ? '' : lang + '/'}`, { waitUntil: 'networkidle' });
    const txt = await page.textContent('.awake__boot');
    check(`arranque ${lang}: ${IDS.length}/${IDS.length}`, txt.includes(`${IDS.length}/${IDS.length}`) && !/\b6\/6\b/.test(txt), txt.replace(/\s+/g, ' ').trim());
    if (lang === 'pt') {
      await page.waitForTimeout(2500);
      await page.screenshot({ path: path.join(OUT, `${PHASE}-1440-arranque.png`) });
    }
    await page.close();
  }
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto(BASE + '/', { waitUntil: 'networkidle' });
  await m.waitForTimeout(2500);
  await m.screenshot({ path: path.join(OUT, `${PHASE}-390-arranque.png`) });
  await browser.close();
  const fails = report.failures.length;
  console.log(`\n${report.checks.length - fails}/${report.checks.length} ok`);
  fs.writeFileSync(path.join(__dirname, `labels-${PHASE}.json`), JSON.stringify(report, null, 2));
  process.exit(fails ? 1 : 0);
})();
