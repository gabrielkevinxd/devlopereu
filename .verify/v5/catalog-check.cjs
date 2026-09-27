// Confirma que o catálogo (src/data/capabilities.ts) e o cérebro do LLM (agent-brain.json) usam os mesmos ids,
// e que cada capacidade tem os 6 idiomas completos com 4 passos de fluxo.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(root, 'src/data/capabilities.ts'), 'utf8');
const brain = JSON.parse(fs.readFileSync(path.join(root, 'public/api/agent-brain.json'), 'utf8'));
const catIds = [...src.matchAll(/^\s{4}id: '([a-z-]+)',$/gm)].map((m) => m[1]);
const tool = brain.tools.find((t) => t.name === 'unlock_capabilities');
const enumIds = tool.parameters.properties.ids.items.enum;
const flowEnum = tool.parameters.properties.flows.items.properties.id.enum;
const promptIds = [...brain.system.matchAll(/\[([a-z-]+)\]/g)].map((m) => m[1]);
const same = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
let ok = true;
const t = (name, cond, detail = '') => {
  console.log(`${cond ? '✔' : '✘'} ${name}${detail ? ' — ' + detail : ''}`);
  ok = ok && cond;
};
t(`catálogo tem ${catIds.length} capacidades`, catIds.length === 15, catIds.join(', '));
t('enum de unlock_capabilities = catálogo', same(catIds, enumIds));
t('enum dos fluxos = catálogo', same(catIds, flowEnum));
t('system prompt lista todas as capacidades', catIds.every((id) => promptIds.includes(id)));
const S = "'[^']+'";
for (const lang of ['pt', 'en', 'fr', 'es', 'de', 'sv']) {
  const re = new RegExp(String.raw`\b${lang}: \{ name: ${S}, tagline: ${S}, how: ${S}, flow: \[${S}, ${S}, ${S}, ${S}\] \}`, 'g');
  const n = [...src.matchAll(re)].length;
  t(`idioma ${lang}: 15 capacidades com nome, frase, como funciona e 4 passos`, n === 15, `${n}/15`);
}
process.exit(ok ? 0 : 1);
