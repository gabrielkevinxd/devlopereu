/**
 * Orçamento em EUROS (espelho de budget_* em api/agent.php).
 *
 * - Custo real de cada chamada = usage devolvido pelo provider × tabela de preços (agent-brain.json) × margem.
 * - Antes de CADA chamada reserva-se o PIOR caso; só passa se couber no teto → nunca se ultrapassa o orçamento.
 * - Ledger por período (mês civil por omissão) num ficheiro JSON; clientes identificados só por hash.
 */
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Brain } from './brain';

export interface Usage {
  inText: number;
  inAudio: number;
  outText: number;
  outAudio: number;
}
export const noUsage = (): Usage => ({ inText: 0, inAudio: 0, outText: 0, outAudio: 0 });
export const addUsage = (a: Usage, b: Usage): Usage => ({
  inText: a.inText + b.inText,
  inAudio: a.inAudio + b.inAudio,
  outText: a.outText + b.outText,
  outAudio: a.outAudio + b.outAudio,
});

export type Tier = 'normal' | 'economy' | 'reserve' | 'over';
export type Outcome = 'qualified' | 'disqualified' | null;

export interface ClientRec {
  eur: number;
  turns: number;
  tts: number;
  first: number;
  last: number;
  mode: 'normal' | 'check' | 'closed';
  checkAt: number | null;
  outcome: Outcome;
  booked: boolean;
}

export interface Ledger {
  v: 1;
  period: string;
  spentEur: number;
  reservations: Record<string, { eur: number; t: number }>;
  calls: { chat: number; tts: number; stt: number; denied: number };
  byDay: Record<string, number>;
  clients: Record<string, ClientRec>;
  booked: number;
  fails: { company: number; pain: number; automatable: number; decision: number };
}

type Env = Record<string, string | undefined>;

export interface BudgetCfg {
  eur: number;
  period: 'month' | 'week' | 'day';
  targetConversations: number;
  maxTurns: number;
  clientEur: number;
  dir: string;
}

export function budgetConfig(env: Env, brain: Brain, rootDir: string): BudgetCfg {
  const b = brain.budget;
  const eur = Number(env.AGENT_BUDGET_EUR) > 0 ? Number(env.AGENT_BUDGET_EUR) : b.eur;
  const period = (['month', 'week', 'day'].includes(env.AGENT_BUDGET_PERIOD ?? '') ? env.AGENT_BUDGET_PERIOD : b.period) as BudgetCfg['period'];
  const targetConversations = Number(env.AGENT_TARGET_CONVERSATIONS) > 0 ? Number(env.AGENT_TARGET_CONVERSATIONS) : b.targetConversations;
  const maxTurns = Number(env.AGENT_MAX_TURNS) > 0 ? Number(env.AGENT_MAX_TURNS) : b.maxTurns;
  return { eur, period, targetConversations, maxTurns, clientEur: eur / targetConversations, dir: env.AGENT_DATA_DIR || join(rootDir, '.agent-data') };
}

/* ───────── Preços ───────── */

interface Price {
  input?: number;
  inputAudio?: number;
  output?: number;
  outputAudio?: number;
}

export function priceFor(brain: Brain, model: string): Price {
  const m = brain.pricing.models;
  if (m[model]) return m[model];
  // prefixo mais longo (ex.: gemini-2.5-flash-001 → gemini-2.5-flash); desconhecido → preço conservador
  const key = Object.keys(m)
    .filter((k) => !k.startsWith('_') && model.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return key ? m[key] : m._unknown;
}

/** EUR com margem de segurança. */
export function costEur(brain: Brain, model: string, u: Usage): number {
  const p = priceFor(brain, model);
  const usd =
    (u.inText * (p.input ?? 0) + u.inAudio * (p.inputAudio ?? p.input ?? 0) + u.outText * (p.output ?? 0) + u.outAudio * (p.outputAudio ?? p.output ?? 0)) /
    1e6;
  return usd * brain.pricing.eurPerUsd * brain.pricing.safetyMargin;
}

/* Estimativas de PIOR caso (usadas para reservar antes da chamada). */
export const worstChat = (brain: Brain, promptChars: number, maxOut: number): Usage => ({
  inText: Math.ceil(promptChars / brain.budget.charsPerTokenWorst) + 200,
  inAudio: 0,
  outText: maxOut,
  outAudio: 0,
});
/** ~25 tokens de áudio por segundo; fala ≈ 12 caracteres/s → 3 tokens/carácter é pessimista. */
export const worstTts = (text: string): Usage => ({ inText: Math.ceil(text.length / 2) + 100, inAudio: 0, outText: 0, outAudio: text.length * 3 + 200 });
/** 1 KB/s de áudio (pessimista para opus) × 32 tokens/s. */
export const worstStt = (bytes: number): Usage => ({ inText: 100, inAudio: Math.ceil((bytes / 1000) * 32) + 100, outText: 300, outAudio: 0 });

/* ───────── Período e ficheiros ───────── */

export function periodKey(period: BudgetCfg['period'], tz: string, now = new Date()): string {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now).split('-');
  if (period === 'day') return `${y}-${m}-${d}`;
  if (period === 'week') {
    const date = new Date(Date.UTC(+y, +m - 1, +d));
    const day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - day);
    const yStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((date.getTime() - yStart.getTime()) / 86400000 + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  }
  return `${y}-${m}`;
}

const emptyLedger = (period: string): Ledger => ({
  v: 1,
  period,
  spentEur: 0,
  reservations: {},
  calls: { chat: 0, tts: 0, stt: 0, denied: 0 },
  byDay: {},
  clients: {},
  booked: 0,
  fails: { company: 0, pain: 0, automatable: 0, decision: 0 },
});

function salt(dir: string): string {
  const f = join(dir, 'salt.txt');
  if (!existsSync(f)) writeFileSync(f, randomBytes(24).toString('hex'));
  return readFileSync(f, 'utf8').trim();
}

/** Chave do cliente: hash(sal secreto + IP + sessão). Nunca se guarda IP nem id de sessão em claro. */
export function clientKey(cfg: BudgetCfg, ip: string, sid: string): string {
  mkdirSync(cfg.dir, { recursive: true });
  return createHash('sha256').update(`${salt(cfg.dir)}|${ip}|${sid}`).digest('hex').slice(0, 24);
}

/**
 * Abre o ledger do período, aplica `fn` e grava. Em Node (um só processo, código síncrono)
 * a leitura-modificação-escrita é atómica; no PHP usa-se flock.
 */
export function withLedger<T>(cfg: BudgetCfg, brain: Brain, fn: (l: Ledger) => T): T {
  mkdirSync(cfg.dir, { recursive: true });
  const period = periodKey(cfg.period, brain.budget.timezone);
  const file = join(cfg.dir, `ledger-${period}.json`);
  let l: Ledger = emptyLedger(period);
  if (existsSync(file)) {
    try {
      l = { ...emptyLedger(period), ...(JSON.parse(readFileSync(file, 'utf8')) as Ledger) };
    } catch {
      l = emptyLedger(period);
    }
  }
  const now = Date.now();
  for (const [id, r] of Object.entries(l.reservations)) {
    if (now - r.t > brain.budget.reservationTtlSec * 1000) delete l.reservations[id]; // reserva órfã
  }
  const out = fn(l);
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, JSON.stringify(l));
  renameSync(tmp, file);
  return out;
}

const reservedEur = (l: Ledger) => Object.values(l.reservations).reduce((n, r) => n + r.eur, 0);

/** Pior caso de UMA chamada de chat típica (prompt + ferramentas + histórico máximo + saída máxima). */
export function nextWorstEur(brain: Brain, model: string, provider: string): number {
  const chars = brain.system.length + 1500 + JSON.stringify(brain.tools).length + brain.limits.maxHistoryChars;
  const thinking = provider === 'gemini' && !/^gemini-2\.5-flash/.test(model) ? 2048 : 0;
  return costEur(brain, model, worstChat(brain, chars, brain.limits.maxOutputTokens + thinking));
}

/**
 * Patamar do orçamento. «over» = já não cabe o pior caso da próxima chamada dentro do teto
 * (orçamento × hardCeiling) → fluxo guiado até ao próximo período; nunca se ultrapassa o orçamento.
 */
export function tierOf(cfg: BudgetCfg, brain: Brain, l: Ledger, nextWorst = 0): Tier {
  const used = l.spentEur + reservedEur(l);
  const pct = used / cfg.eur;
  if (pct >= 1 || used + nextWorst > cfg.eur * brain.budget.hardCeiling) return 'over';
  if (pct >= brain.budget.tiers.reserve) return 'reserve';
  if (pct >= brain.budget.tiers.economy) return 'economy';
  return 'normal';
}

export const newClient = (): ClientRec => ({
  eur: 0,
  turns: 0,
  tts: 0,
  first: Date.now(),
  last: Date.now(),
  mode: 'normal',
  checkAt: null,
  outcome: null,
  booked: false,
});

/** Reserva o pior caso se couber no teto (orçamento × hardCeiling). Devolve o id da reserva ou null. */
export function reserve(cfg: BudgetCfg, brain: Brain, eur: number): string | null {
  return withLedger(cfg, brain, (l) => {
    const ceiling = cfg.eur * brain.budget.hardCeiling;
    if (l.spentEur + reservedEur(l) + eur > ceiling) {
      l.calls.denied++;
      return null;
    }
    const id = randomBytes(8).toString('hex');
    l.reservations[id] = { eur, t: Date.now() };
    return id;
  });
}

/** Troca a reserva pelo custo real e acumula no período, no dia e no cliente. */
export function settle(cfg: BudgetCfg, brain: Brain, id: string, eur: number, kind: 'chat' | 'tts' | 'stt', key: string | null) {
  withLedger(cfg, brain, (l) => {
    delete l.reservations[id];
    l.spentEur += eur;
    l.calls[kind]++;
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: brain.budget.timezone }).format(new Date());
    l.byDay[day] = (l.byDay[day] ?? 0) + eur;
    if (key) {
      const c = (l.clients[key] ??= newClient());
      c.eur += eur;
      c.last = Date.now();
      if (kind === 'tts') c.tts++;
    }
  });
}

/** Resumo para o painel do dono — só agregados, sem dados pessoais. */
export function summary(cfg: BudgetCfg, brain: Brain, nextWorst = 0) {
  return withLedger(cfg, brain, (l) => {
    const clients = Object.values(l.clients);
    const convs = clients.filter((c) => c.turns > 0);
    const now = Date.now();
    const staleCheck = (c: ClientRec) => c.mode === 'check' && !c.outcome && now - c.last > brain.budget.noAnswerAfterSec * 1000;
    const llmSpent = convs.reduce((n, c) => n + c.eur, 0);
    const avg = convs.length ? llmSpent / convs.length : 0;
    const remaining = Math.max(0, cfg.eur - l.spentEur);
    return {
      period: l.period,
      budgetEur: cfg.eur,
      spentEur: +l.spentEur.toFixed(5),
      reservedEur: +reservedEur(l).toFixed(5),
      pct: +((l.spentEur / cfg.eur) * 100).toFixed(2),
      tier: tierOf(cfg, brain, l, nextWorst),
      nextCallWorstCaseEur: +nextWorst.toFixed(5),
      perConversationLimitEur: +cfg.clientEur.toFixed(4),
      conversations: convs.length,
      turns: convs.reduce((n, c) => n + c.turns, 0),
      avgCostPerConversationEur: +avg.toFixed(5),
      conversationsLeftEstimate: avg > 0 ? Math.floor(remaining / avg) : Math.floor(remaining / cfg.clientEur),
      calls: l.calls,
      outcomes: {
        qualified: convs.filter((c) => c.outcome === 'qualified').length,
        disqualified: convs.filter((c) => c.outcome === 'disqualified').length,
        noAnswer: convs.filter(staleCheck).length,
        pendingCheckMatch: convs.filter((c) => c.mode === 'check' && !c.outcome && !staleCheck(c)).length,
      },
      disqualifiedBy: l.fails,
      booked: l.booked,
      byDay: l.byDay,
    };
  });
}
