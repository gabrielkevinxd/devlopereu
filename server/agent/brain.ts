/**
 * Cérebro partilhado: lê public/api/agent-brain.json — o MESMO ficheiro que o api/agent.php usa em produção.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export interface ToolDef {
  name: string;
  description: string;
  parameters: JsonSchema;
}
export interface JsonSchema {
  type: string;
  description?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  enum?: string[];
  required?: string[];
}
export interface Brain {
  limits: {
    maxMessageChars: number;
    maxHistory: number;
    maxHistoryChars: number;
    maxOutputTokens: number;
    timeoutSec: number;
    maxRounds: number;
    windowSec: number;
    maxPerWindow: number;
    maxPerDay: number;
    ttsMaxChars: number;
    sttMaxBytes: number;
    maxBodyBytes: number;
  };
  allowedOrigins: string[];
  defaults: {
    provider: string;
    gemini: { model: string; tts: string; voice: string };
    openai: { model: string; tts: string; voice: string; stt: string };
    anthropic: { model: string };
  };
  times: string[];
  system: string;
  tools: ToolDef[];
  guard: { patterns: string[]; redirect: Record<string, string>; busy: Record<string, string>; closed: Record<string, string> };
  budget: {
    eur: number;
    period: string;
    timezone: string;
    targetConversations: number;
    maxTurns: number;
    maxProviderTts: number;
    checkMatchAt: number;
    tiers: { economy: number; reserve: number };
    economyMaxOutputTokens: number;
    hardCeiling: number;
    charsPerTokenWorst: number;
    reservationTtlSec: number;
    noAnswerAfterSec: number;
    proposedTime: string;
  };
  pricing: {
    eurPerUsd: number;
    safetyMargin: number;
    source: string;
    models: Record<string, { input?: number; inputAudio?: number; output?: number; outputAudio?: number }>;
  };
  prompts: { economy: string; checkMatch: string };
}

const BRAIN_PATH = fileURLToPath(new URL('../../public/api/agent-brain.json', import.meta.url));

export function loadBrain(): Brain {
  // Relido a cada pedido em dev: editar o JSON tem efeito imediato.
  return JSON.parse(readFileSync(BRAIN_PATH, 'utf8')) as Brain;
}

const LANGS = ['pt', 'en', 'fr', 'es', 'de', 'sv'];
export const safeLang = (l: unknown): string => (typeof l === 'string' && LANGS.includes(l) ? l : 'pt');

/** Próximos 10 dias úteis (a partir de amanhã) na hora de Lisboa, no formato YYYY-MM-DD (dia). */
export function workdaySlots(now = new Date()): string[] {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit' });
  const [y, m, d] = fmt.format(now).split('-').map(Number);
  const cur = new Date(Date.UTC(y, m - 1, d));
  const out: string[] = [];
  while (out.length < 10) {
    cur.setUTCDate(cur.getUTCDate() + 1);
    const wd = cur.getUTCDay();
    if (wd !== 0 && wd !== 6) {
      out.push(`${cur.toISOString().slice(0, 10)} (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][wd]})`);
    }
  }
  return out;
}

export function buildSystem(brain: Brain, lang: string, state: unknown, now = new Date()): string {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(now);
  let stateJson = '{}';
  try {
    stateJson = JSON.stringify(state ?? {}).slice(0, 1500);
  } catch {
    /* estado inválido → vazio */
  }
  return brain.system
    .replace('{lang}', lang)
    .replace('{today}', today)
    .replace('{slots}', workdaySlots(now).join(', '))
    .replace('{times}', brain.times.join(', '))
    .replace('{state}', stateJson);
}
