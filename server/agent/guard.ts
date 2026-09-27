/** Proteções: limites, histórico, filtro de prompt-injection e rate limit por IP (hash, nunca o IP em claro). */
import { createHash } from 'node:crypto';
import type { Brain } from './brain';

export interface ChatMsg {
  role: 'user' | 'assistant';
  text: string;
}

const clean = (s: string) =>
  s
    // eslint-disable-next-line no-control-regex -- remover caracteres de controlo é o objetivo
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s{3,}/g, '  ')
    .trim();

/**
 * Normaliza o histórico vindo do browser: só texto, papéis válidos, corta tamanho e número,
 * começa sempre por «user» e alterna papéis (exigência de Gemini/Anthropic).
 */
export function normalizeHistory(raw: unknown, brain: Brain): ChatMsg[] | null {
  if (!Array.isArray(raw)) return null;
  const L = brain.limits;
  let msgs: ChatMsg[] = raw
    .filter((m): m is { role: string; text: string } => !!m && typeof m === 'object' && typeof (m as ChatMsg).text === 'string')
    .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', text: clean(m.text).slice(0, L.maxMessageChars * 2) }) as ChatMsg)
    .filter((m) => m.text.length > 0)
    .slice(-L.maxHistory);
  // limite global de caracteres (descarta os mais antigos)
  while (msgs.reduce((n, m) => n + m.text.length, 0) > L.maxHistoryChars && msgs.length > 1) msgs = msgs.slice(1);
  while (msgs.length && msgs[0].role !== 'user') msgs = msgs.slice(1);
  const merged: ChatMsg[] = [];
  for (const m of msgs) {
    const last = merged[merged.length - 1];
    if (last && last.role === m.role) last.text += `\n${m.text}`;
    else merged.push({ ...m });
  }
  if (!merged.length || merged[merged.length - 1].role !== 'user') return null;
  const lastUser = merged[merged.length - 1];
  lastUser.text = lastUser.text.slice(0, L.maxMessageChars);
  return merged;
}

export function isInjection(text: string, brain: Brain): boolean {
  return brain.guard.patterns.some((p) => new RegExp(p, 'i').test(text));
}

interface Bucket {
  hits: number[];
  day: string;
  dayCount: number;
}
const buckets = new Map<string, Bucket>();

/** true = permitido. Proteção anti-abuso por IP (janela + teto diário). Os custos são geridos em euros (budget.ts). */
export function rateLimit(ip: string, brain: Brain, now = Date.now()): boolean {
  const key = createHash('sha256').update(`devloper-agent:${ip}`).digest('hex').slice(0, 24);
  const day = new Date(now).toISOString().slice(0, 10);
  const b = buckets.get(key) ?? { hits: [], day, dayCount: 0 };
  if (b.day !== day) {
    b.day = day;
    b.dayCount = 0;
  }
  b.hits = b.hits.filter((t) => now - t < brain.limits.windowSec * 1000);
  if (b.hits.length >= brain.limits.maxPerWindow || b.dayCount >= brain.limits.maxPerDay) {
    buckets.set(key, b);
    return false;
  }
  b.hits.push(now);
  b.dayCount++;
  buckets.set(key, b);
  return true;
}

/** Limpa o rate limit de um IP (ou de todos). Devolve quantos buckets foram apagados. */
export function clearRateLimit(ip?: string): number {
  if (ip === undefined) {
    const n = buckets.size;
    buckets.clear();
    return n;
  }
  const key = createHash('sha256').update(`devloper-agent:${ip}`).digest('hex').slice(0, 24);
  return buckets.delete(key) ? 1 : 0;
}

export function originAllowed(origin: string | undefined, host: string | undefined, brain: Brain, extra: string[]): boolean {
  if (!origin) return true; // pedidos sem cabeçalho Origin (GET same-origin)
  try {
    if (new URL(origin).host === host) return true; // same-origin
  } catch {
    return false;
  }
  if ([...brain.allowedOrigins, ...extra].includes(origin)) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin); // só em dev/preview
}
