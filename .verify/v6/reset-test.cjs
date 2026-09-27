/**
 * «Reiniciar cliente» do painel do dono (POST action=admin_reset), contra os DOIS backends:
 *   php  → public/api/agent.php (produção)     vite → server/agent (dev/preview)
 * Dois IPs reais da mesma máquina: 127.0.0.1 (A) e o IP da rede local (B, variável LAN).
 * Uso: PHP=<php.exe> LAN=192.168.1.235 node .verify/v6/reset-test.cjs [php|vite]
 */
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const ROOT = path.resolve(__dirname, '..', '..');
const PHP = process.env.PHP;
const LAN = process.env.LAN || Object.values(os.networkInterfaces()).flat().find((i) => i.family === 'IPv4' && !i.internal)?.address;
const ONLY = process.argv[2];
const TOKEN = 'teste-token-admin-0123456789abcdef';
const results = [];
let port = 8300;

const tmpDir = (name) => fs.mkdtempSync(path.join(os.tmpdir(), `dv6-${name}-`));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = { 'content-type': 'application/json' };

function periodMonth() {
  const [y, m] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit' }).format(new Date()).split('-');
  return `${y}-${m}`;
}

async function start(kind) {
  const dataDir = tmpDir('data');
  const rlDir = tmpDir('rl');
  const p = port++;
  const env = { ...process.env, AGENT_PROVIDER: 'mock', AGENT_MODEL: '', AGENT_DATA_DIR: dataDir, AGENT_ADMIN_TOKEN: TOKEN, AGENT_MAX_TURNS: '4', TMP: rlDir, TEMP: rlDir };
  const proc =
    kind === 'php'
      ? spawn(PHP, ['-S', `0.0.0.0:${p}`, '-t', path.join(ROOT, 'public')], { env, stdio: 'ignore' })
      : spawn(process.execPath, [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(p), '--strictPort', '--host', '0.0.0.0'], { cwd: ROOT, env, stdio: 'ignore' });
  const A = `http://127.0.0.1:${p}/api/agent.php`;
  const B = `http://${LAN}:${p}/api/agent.php`;
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(A)).ok) break;
    } catch {
      /* ainda a arrancar */
    }
    await sleep(250);
  }
  const ledger = () => JSON.parse(fs.readFileSync(path.join(dataDir, `ledger-${periodMonth()}.json`), 'utf8'));
  return { A, B, dataDir, rlDir, ledger, stop: () => proc.kill() };
}

/** Continua a conversa do MESMO cliente (mesma sessão) e devolve o resultado de cada turno. */
async function converse(url, sid, texts, messages = []) {
  const out = [];
  for (const t of texts) {
    messages.push({ role: 'user', text: t });
    const r = await fetch(url, { method: 'POST', headers: J, body: JSON.stringify({ action: 'chat', lang: 'pt', sid, messages, state: {} }) });
    const ev = (await r.text()).split('\n').filter(Boolean).map((l) => JSON.parse(l));
    const text = ev.filter((e) => e.t === 'text').map((e) => e.d).join('');
    messages.push({ role: 'assistant', text: text || '...' });
    out.push({ check: ev.find((e) => e.t === 'meta')?.check, fallback: ev.find((e) => e.t === 'fallback')?.reason });
  }
  return out;
}
const Q = ['Tenho uma clínica dentária e perco tempo com marcações', 'Somos 3 pessoas, 10 horas por semana', 'Usamos WhatsApp e agenda online', 'Queremos resolver este trimestre', 'Mais uma pergunta'];

const reset = async (url, scope, token = TOKEN, headers = {}) => {
  const r = await fetch(url, {
    method: 'POST',
    headers: { ...J, ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
    body: JSON.stringify({ action: 'admin_reset', scope }),
  });
  return { status: r.status, body: await r.json().catch(() => null) };
};
const admin = async (url) => (await fetch(`${url}?action=admin`, { headers: { authorization: `Bearer ${TOKEN}` } })).json();
const event = async (url, sid) => (await fetch(url, { method: 'POST', headers: J, body: JSON.stringify({ action: 'event', sid, type: 'noop' }) })).status;
const money = (l) => JSON.stringify({ spentEur: l.spentEur, calls: l.calls, byDay: l.byDay, reservations: l.reservations });
const turnsOf = (l) => Object.values(l.clients).map((c) => c.turns).sort();

function check(kind, name, ok, detail = '') {
  results.push({ kind, name, ok, detail });
  console.log(`${ok ? '✔' : '✘'} [${kind}] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function scenarios(kind) {
  const s = await start(kind);
  try {
    // A (127.0.0.1) esgota o limite; B (IP da rede) fica a meio da conversa.
    const a1 = await converse(s.A, 'sid-ip-a-0001', Q);
    const bMsgs = [];
    await converse(s.B, 'sid-ip-b-0001', Q.slice(0, 3), bMsgs);
    check(kind, 'preparação: A chega ao check match (turno 4) e ao limite (turno 5)', a1[3].check === true && a1[4].fallback === 'client_limit', `${a1[3].check}/${a1[4].fallback}`);
    const l0 = s.ledger();
    check(kind, 'cada registo de cliente guarda só um hash do IP (24 hex), 2 IPs distintos', Object.values(l0.clients).every((c) => /^[0-9a-f]{24}$/.test(c.ip)) && new Set(Object.values(l0.clients).map((c) => c.ip)).size === 2);
    check(kind, 'nenhum IP em claro no ledger', !JSON.stringify(l0).includes('127.0.0.1') && !JSON.stringify(l0).includes(LAN));

    // Segurança
    const no = await reset(s.A, 'all', '');
    const bad = await reset(s.A, 'all', 'token-errado-0123456789abcdefghij');
    const hdr = await reset(s.A, 'mine', '', { 'x-admin-token': 'token-errado-0123456789abcdefghij' });
    check(kind, '401 sem token / token errado', no.status === 401 && bad.status === 401 && hdr.status === 401, `${no.status}/${bad.status}/${hdr.status}`);
    const get = await fetch(`${s.A}?action=admin_reset&scope=all`, { headers: { authorization: `Bearer ${TOKEN}` } });
    check(kind, 'GET não reinicia nada', get.status === 200 && Object.keys(s.ledger().clients).length === 2, `HTTP ${get.status}, clientes ${Object.keys(s.ledger().clients).length}`);

    // Rate limit de A cheio → a ação do dono ainda funciona e limpa-o
    let st = 0;
    for (let i = 0; i < 40 && st !== 429; i++) st = await event(s.A, 'sid-ip-a-0001');
    check(kind, 'A fica com o rate limit cheio (429)', st === 429);
    const beforeMoney = money(s.ledger());

    // 1) Reiniciar o meu acesso (A)
    const mine = await reset(s.A, 'mine');
    const l1 = s.ledger();
    check(kind, '«o meu acesso» → 200, 1 cliente reiniciado, rate limit do IP limpo', mine.status === 200 && mine.body.clients === 1 && mine.body.scope === 'mine' && mine.body.rateLimits === 1, JSON.stringify(mine.body));
    check(kind, '«o meu acesso» só afeta o próprio IP (B mantém 3 turnos)', JSON.stringify(turnsOf(l1)) === '[3]', JSON.stringify(turnsOf(l1)));
    check(kind, 'gasto, chamadas, dias e reservas intactos', money(l1) === beforeMoney);
    check(kind, 'A volta a poder pedir (rate limit limpo)', (await event(s.A, 'sid-ip-a-0001')) === 204);
    // check match só ao fim de um novo limite (mesma sessão, mesmo IP)
    const a2 = await converse(s.A, 'sid-ip-a-0001', Q);
    check(kind, 'depois do reinício: sem check match nos turnos 1–3, check no 4, limite no 5',
      a2.slice(0, 3).every((t) => t.check === false && !t.fallback) && a2[3].check === true && a2[4].fallback === 'client_limit',
      a2.map((t) => t.fallback || t.check).join(','));
    const b4 = await converse(s.B, 'sid-ip-b-0001', [Q[3]], bMsgs);
    check(kind, 'B não foi reiniciado: o turno seguinte é o 4 → check match', b4[0].check === true, String(b4[0].check));

    // 2) Reiniciar todos os clientes (pedido de B)
    const m2 = money(s.ledger());
    const sum0 = await admin(s.A);
    const all = await reset(s.B, 'all');
    const l2 = s.ledger();
    check(kind, '«todos» → 200, 2 clientes, mapa de clientes vazio, rate limits de todos limpos', all.status === 200 && all.body.clients === 2 && Object.keys(l2.clients).length === 0 && all.body.rateLimits >= 2, JSON.stringify(all.body));
    check(kind, '«todos»: gasto, chamadas, dias e reservas intactos', money(l2) === m2);
    const sum1 = await admin(s.A);
    check(kind, 'painel: histórico preservado (conversas/respostas) e activeClients=0', sum1.conversations === sum0.conversations && sum1.turns === sum0.turns && sum1.activeClients === 0 && sum1.spentEur === sum0.spentEur,
      `conv ${sum0.conversations}→${sum1.conversations}, turns ${sum0.turns}→${sum1.turns}`);
    const b5 = await converse(s.B, 'sid-ip-b-0001', ['Olá de novo'], bMsgs);
    check(kind, 'B recomeça do zero (turno 1, sem check match)', b5[0].check === false && !b5[0].fallback);

    // Registo da ação sem PII + mostrado no painel
    const log = s.ledger().adminLog;
    check(kind, 'registo: quando, âmbito e quantos — sem IP nem chaves', log.length === 2 && log.every((e) => Object.keys(e).sort().join() === 'at,clients,rateLimits,scope') && !JSON.stringify(log).match(/127\.0\.0\.1|192\.168|[0-9a-f]{24}/),
      JSON.stringify(log));
    check(kind, 'painel mostra os reinícios recentes (mais recente primeiro)', sum1.resets?.[0]?.scope === 'all' && sum1.resets?.[1]?.scope === 'mine');

    // Rate limit da própria ação: 10 por 10 min
    const codes = [];
    for (let i = 0; i < 9; i++) codes.push((await reset(s.A, 'mine')).status);
    check(kind, 'rate limit da ação: 10 reinícios em 10 min, o 11.º → 429', codes.slice(0, 8).every((c) => c === 200) && codes[8] === 429, codes.join(','));
  } finally {
    s.stop();
  }
}

(async () => {
  if (!LAN) throw new Error('sem IP de rede local (defina LAN=)');
  for (const kind of ['php', 'vite'].filter((k) => !ONLY || k === ONLY)) await scenarios(kind);
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} ok`);
  fs.writeFileSync(path.join(__dirname, 'reset-test.json'), JSON.stringify(results, null, 2));
  process.exit(failed.length ? 1 : 0);
})();
