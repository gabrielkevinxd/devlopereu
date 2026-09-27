/**
 * Testes do orçamento em euros (provider mock com usage realista), contra os DOIS backends:
 *   php  → public/api/agent.php (produção)     vite → server/agent (dev/preview)
 * Uso: PHP=<php.exe> node .verify/v4/budget-test.cjs [php|vite]
 * Cada cenário usa um servidor novo e uma pasta de dados nova (sem estado partilhado).
 */
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const ROOT = path.resolve(__dirname, '..', '..');
const PHP = process.env.PHP;
const ONLY = process.argv[2];
const TOKEN = 'teste-token-admin-0123456789abcdef';
const results = [];
let port = 8200;

const tmpDir = (name) => fs.mkdtempSync(path.join(os.tmpdir(), `dv4-${name}-`));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function periodMonth() {
  const [y, m] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit' }).format(new Date()).split('-');
  return `${y}-${m}`;
}

async function start(kind, extraEnv, seedSpent) {
  const dataDir = tmpDir('data');
  const rlDir = tmpDir('rl');
  if (seedSpent !== undefined) {
    fs.writeFileSync(path.join(dataDir, `ledger-${periodMonth()}.json`), JSON.stringify({ v: 1, period: periodMonth(), spentEur: seedSpent, reservations: {}, clients: {} }));
  }
  const p = port++;
  const env = {
    ...process.env,
    AGENT_PROVIDER: 'mock',
    AGENT_MODEL: '',
    AGENT_DATA_DIR: dataDir,
    AGENT_ADMIN_TOKEN: TOKEN,
    TMP: rlDir,
    TEMP: rlDir,
    ...extraEnv,
  };
  const proc =
    kind === 'php'
      ? spawn(PHP, ['-S', `127.0.0.1:${p}`, '-t', path.join(ROOT, 'public')], { env, stdio: 'ignore' })
      : spawn(process.execPath, [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(p), '--strictPort', '--host', '127.0.0.1'], {
          cwd: ROOT,
          env,
          stdio: 'ignore',
        });
  const url = `http://127.0.0.1:${p}/api/agent.php`;
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(url)).ok) break;
    } catch {
      /* ainda a arrancar */
    }
    await sleep(250);
  }
  return { url, dataDir, stop: () => proc.kill() };
}

/** Conversa de vários turnos do MESMO cliente; devolve o resultado de cada turno. */
async function converse(url, sid, texts, state = {}) {
  const messages = [];
  const out = [];
  for (const t of texts) {
    messages.push({ role: 'user', text: t });
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'chat', lang: 'pt', sid, messages, state }),
    });
    const ev = (await r.text()).split('\n').filter(Boolean).map((l) => JSON.parse(l));
    const text = ev.filter((e) => e.t === 'text').map((e) => e.d).join('');
    messages.push({ role: 'assistant', text: text || '...' });
    out.push({ ev, text, meta: ev.find((e) => e.t === 'meta'), fallback: ev.find((e) => e.t === 'fallback')?.reason, tools: ev.filter((e) => e.t === 'tool') });
  }
  return out;
}
const chat = async (url, sid, texts, state) => (await converse(url, sid, texts, state)).at(-1);

const admin = async (url, token = TOKEN) => {
  const r = await fetch(`${url}?action=admin`, { headers: token ? { authorization: `Bearer ${token}` } : {} });
  return { status: r.status, body: r.status === 200 ? await r.json() : null, raw: r.status === 200 ? null : await r.text() };
};
const health = async (url) => (await fetch(url)).json();

function check(kind, name, ok, detail = '') {
  results.push({ kind, name, ok, detail });
  console.log(`${ok ? '✔' : '✘'} [${kind}] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function scenarios(kind) {
  // A) Esgotar um orçamento pequeno: nenhuma chamada passa do teto.
  {
    const s = await start(kind, { AGENT_BUDGET_EUR: '0.01', AGENT_TARGET_CONVERSATIONS: '1' });
    let ok = 0;
    let denied = 0;
    for (let i = 0; i < 20; i++) {
      const r = await chat(s.url, `sid-exhaust-${i}`, ['Tenho uma clínica e perco tempo com marcações']);
      if (r.fallback === 'budget') denied++;
      else if (r.text) ok++;
    }
    const a = await admin(s.url);
    const h = await health(s.url);
    check(kind, 'A esgota 0,01 €: algumas chamadas passam e depois só fallback', ok > 0 && denied > 0, `${ok} ok, ${denied} recusadas`);
    check(kind, 'A gasto nunca ultrapassa o orçamento', a.body.spentEur <= 0.01, `gasto ${a.body.spentEur} € de 0,01 €`);
    check(kind, 'A com o orçamento esgotado, health diz llm=false e tier=over', h.llm === false && h.tier === 'over', JSON.stringify(h));
    const tts = await fetch(s.url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'tts', sid: 'x-tts-00001', text: 'Olá' }) });
    check(kind, 'A TTS também recusado quando esgotado', tts.status === 403 || tts.status === 402, `HTTP ${tts.status}`);
    s.stop();
  }
  // B) Patamares.
  {
    const s = await start(kind, {}, 3.6); // 72 %
    const h = await health(s.url);
    const tts = await fetch(s.url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'tts', sid: 'tier-econ-001', text: 'Olá' }) });
    const r = await chat(s.url, 'tier-econ-001', ['Tenho uma loja online']);
    check(kind, 'B 72 % → economy: sem TTS do provider', h.tier === 'economy' && h.tts === false && tts.status === 403, `tier=${h.tier} tts=${h.tts} http=${tts.status}`);
    check(kind, 'B 72 % → economy: LLM continua (respostas curtas)', r.meta?.tier === 'economy' && !!r.text, r.meta?.tier);
    s.stop();
  }
  {
    const s = await start(kind, {}, 4.6); // 92 %
    const cold = await chat(s.url, 'tier-res-new1', ['Olá, quero saber mais']);
    const warm = await chat(s.url, 'tier-res-new2', ['Quero ver isto'], { profile: { sector: 'Saúde', pain: 'Marcações', team: 3 } });
    check(kind, 'B 92 % → reserve: visitante novo sem diagnóstico vai para o fluxo guiado', cold.fallback === 'reserve', cold.fallback);
    check(kind, 'B 92 % → reserve: visitante já qualificado pelo diagnóstico guiado continua no LLM', warm.meta?.tier === 'reserve' && !!warm.text, warm.fallback ?? warm.meta?.tier);
    s.stop();
  }
  {
    const s = await start(kind, {}, 4.995); // ≥ teto
    const h = await health(s.url);
    const r = await chat(s.url, 'tier-over-001', ['Olá'], { profile: { sector: 'Saúde', pain: 'Marcações', team: 3 } });
    check(kind, 'B ≥ 100 % → over: llm=false e chat em fallback', h.llm === false && h.tier === 'over' && r.fallback === 'budget', `${h.tier} ${r.fallback}`);
    s.stop();
  }
  // C/D/E/F) Check match, limite por cliente, TTS por cliente, painel.
  {
    const s = await start(kind, { AGENT_MAX_TURNS: '4' });
    const q = ['Sou o dono de uma clínica dentária e perdemos imenso tempo com marcações por telefone', 'Somos 3 pessoas, 10 horas cada por semana', 'Usamos WhatsApp e uma agenda online', 'Queremos resolver isto este trimestre'];
    const turns = await converse(s.url, 'sid-qualifica-01', q);
    const last = turns[3];
    const ql = last.tools.find((t) => t.name === 'qualify_lead');
    const ob = last.tools.find((t) => t.name === 'open_booking');
    check(kind, 'C aos 75 % (turno 4/4) entra em CHECK MATCH', last.meta?.check === true && turns[2].meta?.check === false, `check turno3=${turns[2].meta?.check} turno4=${last.meta?.check}`);
    check(kind, 'C qualificado (4 critérios) → agendamento pré-preenchido com dia e hora', ql?.args.qualified === true && /^\d{4}-\d{2}-\d{2}$/.test(ob?.args.day) && ob?.args.time === '10:30', JSON.stringify(ob?.args));
    const after = await chat(s.url, 'sid-qualifica-01', ['Mais uma pergunta']);
    check(kind, 'C limite do cliente atingido → fluxo guiado sem erro', after.fallback === 'client_limit', after.fallback);

    const d = ['Olá, sou estudante e estou só a ver', 'Quero só perceber como funciona a IA', 'É mesmo só curiosidade', 'Obrigado'];
    const dl = (await converse(s.url, 'sid-desqualif-01', d)).at(-1);
    const dq = dl.tools.find((t) => t.name === 'qualify_lead');
    check(kind, 'D não qualificado → desqualifica com elegância (checklist + contactos)', dq?.args.qualified === false && /checklist/i.test(dl.text) && /929 070 650/.test(dl.text), dl.text.slice(0, 80));
    const closed = await chat(s.url, 'sid-desqualif-01', ['Afinal tenho outra pergunta']);
    check(kind, 'D conversa com o LLM termina após desqualificar', closed.fallback === 'closed', closed.fallback);

    const ttsStatus = [];
    for (let i = 0; i < 3; i++) {
      const r = await fetch(s.url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'tts', sid: 'sid-voz-00001', text: 'Olá, sou o agente.' }) });
      ttsStatus.push(r.status);
    }
    check(kind, 'E máx. 2 respostas com TTS do provider por cliente', ttsStatus.join(',') === '200,200,429', ttsStatus.join(','));

    await fetch(s.url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'event', sid: 'sid-qualifica-01', type: 'booked' }) });
    const noTok = await admin(s.url, '');
    const badTok = await admin(s.url, 'x'.repeat(TOKEN.length));
    const a = await admin(s.url);
    const raw = JSON.stringify(a.body);
    check(kind, 'F painel protegido por token (sem/errado → 401)', noTok.status === 401 && badTok.status === 401 && a.status === 200);
    check(
      kind,
      'F painel: gasto, %, conversas, qualificados/desqualificados/agendamentos',
      a.body.conversations === 2 && a.body.outcomes.qualified === 1 && a.body.outcomes.disqualified === 1 && a.body.booked === 1 && a.body.spentEur > 0,
      `gasto ${a.body.spentEur} € (${a.body.pct} %), conversas ${a.body.conversations}, média ${a.body.avgCostPerConversationEur} €/conversa`,
    );
    const ledger = fs.readFileSync(path.join(s.dataDir, `ledger-${periodMonth()}.json`), 'utf8');
    check(kind, 'F sem dados pessoais (sem IP, id de sessão, nomes ou texto das mensagens)', !/127\.0\.0\.1|sid-|clínica|estudante|Ana/.test(raw + ledger));
    check(kind, 'F média medida por conversa (mock, preços gemini-2.5-flash)', a.body.avgCostPerConversationEur > 0, `${a.body.avgCostPerConversationEur} €`);
    // G) Regressão (visto em teste real): qualify_lead fora do CHECK MATCH não fecha a conversa.
    const g = await converse(s.url, 'sid-qualify-fora', ['teste-qualify-fora-de-hora', 'Tenho uma loja online']);
    check(kind, 'G qualify_lead fora do check match é ignorado (conversa continua)', !g[0].tools.some((t) => t.name === 'qualify_lead') && !g[1].fallback && !!g[1].text, `${g[1].fallback ?? 'ok'}`);
    s.stop();
  }
}

(async () => {
  for (const kind of ['php', 'vite'].filter((k) => !ONLY || k === ONLY)) await scenarios(kind);
  const failed = results.filter((r) => !r.ok);
  fs.writeFileSync(path.join(__dirname, 'budget-test.json'), JSON.stringify(results, null, 2));
  console.log(`\n${results.length - failed.length}/${results.length} ok`);
  process.exit(failed.length ? 1 : 0);
})();
