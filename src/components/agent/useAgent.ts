import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { fill, type Dict } from '../../i18n';
import { prefersReducedMotion } from '../../lib/storage';
import type { BookVia } from '../booking/BookingForm';

export type Phase = 'intro' | 'sector' | 'pain' | 'team' | 'sim' | 'caps' | 'booking' | 'done' | 'closed';

export interface Msg {
  id: number;
  from: 'agent' | 'user';
  text: string;
  tone?: 'title' | 'note';
}

/** Dados que o LLM escreve no palco através de tool calls (texto livre, já saneado). */
export interface AiProfile {
  company?: string;
  sector?: string;
  pain?: string;
  systems?: string;
  team?: number;
  hours?: number;
}
export interface AiSim {
  title: string;
  flow: string[];
  events: string[];
  people?: number;
  hours?: number;
  share: number;
}
export interface AiBooking {
  day?: string;
  time?: string;
  name?: string;
  contact?: string;
  company?: string;
  notes?: string;
}

export interface AgentState {
  phase: Phase;
  sectorId?: string;
  painId?: string;
  people: number;
  hours: number;
  messages: Msg[];
  queue: Msg[];
  openCap?: string;
  simDone: boolean;
  seq: number;
  /** true = conversa livre com o LLM (o palco segue as tool calls). */
  ai: boolean;
  /** id da mensagem do agente que está a chegar em streaming */
  streamingId?: number;
  profileX?: AiProfile;
  simX?: AiSim;
  capsX?: { ids: string[]; reasons: Record<string, string>; flows: Record<string, string[]> };
  bookingX?: AiBooking;
  /** capacidade pedida a partir do modo clássico (?cap=) — o Mega Brain abre já com ela selecionada */
  focusCap?: string;
  /** muda sempre que o LLM gera nova simulação / novo pré-preenchimento (remonta o componente) */
  stageKey: number;
  suggestions: string[];
}

export type Action =
  | { type: 'start' }
  | { type: 'sector'; id: string }
  | { type: 'pain'; id: string }
  | { type: 'people'; value: number }
  | { type: 'hours'; value: number }
  | { type: 'team' }
  | { type: 'simDone' }
  | { type: 'caps' }
  | { type: 'openCap'; id: string }
  | { type: 'showCap'; id: string; name: string }
  | { type: 'book'; fromCta?: boolean }
  | { type: 'booked'; via: BookVia }
  | { type: 'restart' }
  | { type: 'deliver' }
  | { type: 'user_text'; text: string }
  | { type: 'ai_start' }
  | { type: 'ai_delta'; text: string }
  | { type: 'ai_tool'; name: string; args: Record<string, unknown> }
  | { type: 'ai_end' }
  | { type: 'ai_fallback' }
  | { type: 'ai_limit' }
  | { type: 'say'; text: string };

/** Cenário honesto: o agente assume uma fração (por omissão metade) das horas que o próprio visitante indicou. */
export const scenarioHours = (people: number, hours: number, share = 0.5) => Math.round(people * hours * share);

/* Saneamento defensivo dos argumentos das tool calls (vêm de um modelo, não do nosso código). */
const str = (v: unknown, max = 80) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);
const int = (v: unknown, min: number, max: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && v !== null && v !== '' && v !== undefined ? Math.min(max, Math.max(min, n)) : undefined;
};
const list = (v: unknown, n: number, max: number) =>
  Array.isArray(v) ? v.map((x) => str(x, max)).filter((x): x is string => !!x).slice(0, n) : [];
const defined = <T extends object>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;

export function initialState(t: Dict): AgentState {
  return {
    phase: 'intro',
    people: 3,
    hours: 6,
    messages: [
      { id: 1, from: 'agent', text: t.chat.intro, tone: 'title' },
      { id: 2, from: 'agent', text: t.chat.introSub },
    ],
    queue: [],
    simDone: false,
    seq: 3,
    ai: false,
    stageKey: 0,
    suggestions: [],
  };
}

function makeReducer(t: Dict) {
  const sectorLabel = (id?: string) => t.sectors.find((s) => s.id === id)?.label ?? '';
  const pain = (id?: string) => t.pains.find((p) => p.id === id);

  return function reducer(s: AgentState, a: Action): AgentState {
    let seq = s.seq;
    const msg = (from: Msg['from'], text: string, tone?: Msg['tone']): Msg => ({ id: seq++, from, text, tone });
    const say = (user: string | null, agent: Array<[string, Msg['tone']?]>, patch: Partial<AgentState>): AgentState => {
      const messages = user ? [...s.messages, ...s.queue, msg('user', user)] : [...s.messages, ...s.queue];
      const queue = agent.map(([text, tone]) => msg('agent', text, tone));
      return { ...s, ...patch, messages, queue, seq };
    };

    switch (a.type) {
      case 'start':
        return say(t.chat.introYes, [[t.chat.askSector]], { phase: 'sector' });
      case 'sector':
        return say(sectorLabel(a.id), [[fill(t.chat.askPain, { sector: sectorLabel(a.id) })]], {
          phase: 'pain',
          sectorId: a.id,
        });
      case 'pain':
        return say(pain(a.id)?.label ?? '', [[t.chat.askTeam]], { phase: 'team', painId: a.id });
      case 'people':
        return { ...s, people: a.value };
      case 'hours':
        return { ...s, hours: a.value };
      case 'team':
        return say(
          fill(t.chat.teamAnswer, { people: s.people, hours: s.hours }),
          [[fill(t.chat.building, { pain: pain(s.painId)?.agentName ?? '', sector: sectorLabel(s.sectorId) })]],
          { phase: 'sim', simDone: false },
        );
      case 'simDone':
        if (s.ai || s.simDone || s.phase !== 'sim') return s;
        return say(null, [[fill(t.chat.simDone, { result: scenarioHours(s.people, s.hours) })], [t.chat.simNote, 'note']], {
          simDone: true,
        });
      case 'caps': {
        const count = pain(s.painId)?.services.length ?? 0;
        return say(t.chat.toCaps, [[fill(t.chat.capsIntro, { count })]], { phase: 'caps' });
      }
      case 'openCap': {
        const svc = t.services.find((x) => x.id === a.id);
        if (!svc || s.openCap === a.id) return { ...s, openCap: s.openCap === a.id ? undefined : s.openCap };
        return say(null, [[fill(t.chat.capsOpened, { name: svc.name, short: svc.short })]], { openCap: a.id });
      }
      case 'showCap':
        return say(null, [[fill(t.chat.capsFocus, { name: a.name })]], {
          phase: 'caps',
          capsX: { ids: [a.id], reasons: {}, flows: {} },
          focusCap: a.id,
          stageKey: s.stageKey + 1,
        });
      case 'book':
        if (s.phase === 'booking') return s;
        return a.fromCta
          ? say(null, [[t.chat.jumpBook]], { phase: 'booking' })
          : say(t.chat.toBook, [[t.chat.askBook]], { phase: 'booking' });
      case 'booked': {
        const text = a.via === 'whatsapp' ? t.chat.bookedWhatsapp : a.via === 'email' ? t.chat.bookedEmail : t.chat.bookedCalendar;
        return say(null, [[text], [t.chat.afterBook]], { phase: 'done' });
      }
      case 'restart':
        return { ...initialState(t), seq: s.seq + 10 };
      case 'deliver': {
        const [next, ...rest] = s.queue;
        return next ? { ...s, messages: [...s.messages, next], queue: rest } : s;
      }

      /* ───── conversa livre (LLM) ───── */
      case 'user_text':
        return { ...say(a.text, [], {}), suggestions: [] };
      case 'ai_start': {
        const m = msg('agent', '');
        return { ...s, ai: true, messages: [...s.messages, ...s.queue, m], queue: [], streamingId: m.id, seq, suggestions: [] };
      }
      case 'ai_delta':
        return {
          ...s,
          messages: s.messages.map((m) => (m.id === s.streamingId ? { ...m, text: m.text + a.text } : m)),
        };
      case 'ai_end':
        return { ...s, streamingId: undefined, messages: s.messages.filter((m) => m.id !== s.streamingId || m.text.trim()) };
      case 'ai_tool':
        return applyTool(s, a.name, a.args);
      case 'ai_fallback': {
        const messages = s.messages.filter((m) => m.id !== s.streamingId || m.text.trim());
        const base = { ...s, ai: false, streamingId: undefined, messages, suggestions: [] };
        const next: Array<[string, Msg['tone']?]> = [[t.ai.fallback, 'note']];
        let phase = s.phase;
        if (!s.sectorId) {
          phase = 'sector';
          next.push([t.chat.askSector]);
        } else if (!s.painId) {
          phase = 'pain';
          next.push([fill(t.chat.askPain, { sector: sectorLabel(s.sectorId) })]);
        }
        const queue = next.map(([text, tone]) => msg('agent', text, tone));
        return { ...base, phase, simDone: true, queue: [...s.queue, ...queue], seq };
      }
      case 'ai_limit': {
        // limite da conversa atingido (ou encerrada): sem erro — segue para o agendamento guiado
        const messages = s.messages.filter((m) => m.id !== s.streamingId || m.text.trim());
        const base = { ...s, ai: false, streamingId: undefined, messages, suggestions: [] };
        if (s.phase === 'closed' || s.phase === 'done') return base;
        return { ...base, phase: 'booking', queue: [...s.queue, msg('agent', t.ai.limitNote)], seq };
      }
      case 'say':
        return say(null, [[a.text]], {});
    }
  };
}

/** Efeito de cada tool call do LLM no palco. Ferramentas desconhecidas são ignoradas. */
function applyTool(s: AgentState, name: string, a: Record<string, unknown>): AgentState {
  const early = s.phase === 'intro' || s.phase === 'sector' || s.phase === 'pain' || s.phase === 'team';
  switch (name) {
    case 'update_profile': {
      const patch = defined({
        company: str(a.company, 60),
        sector: str(a.sector, 60),
        pain: str(a.pain, 80),
        systems: str(a.systems, 80),
        team: int(a.team_size, 1, 500),
        hours: int(a.hours_per_week, 1, 60),
      });
      return { ...s, profileX: { ...s.profileX, ...patch }, phase: early ? 'team' : s.phase };
    }
    case 'show_simulation': {
      const flow = list(a.flow, 5, 40);
      const events = list(a.events, 7, 140);
      if (flow.length < 2 || !events.length) return s;
      const share = Number(a.share);
      const simX: AiSim = {
        title: str(a.title, 60) ?? '',
        flow,
        events,
        people: int(a.people, 1, 500) ?? s.profileX?.team,
        hours: int(a.hours, 1, 60) ?? s.profileX?.hours,
        share: Number.isFinite(share) && share > 0 ? Math.min(0.8, Math.max(0.1, share)) : 0.5,
      };
      return { ...s, simX, phase: 'sim', simDone: true, stageKey: s.stageKey + 1 };
    }
    case 'unlock_capabilities': {
      // ids validados contra o catálogo (src/data/capabilities.ts) no próprio palco; aqui só formato
      const raw = Array.isArray(a.ids) ? a.ids : [];
      const ids = raw.filter((x): x is string => typeof x === 'string' && /^[a-z_-]{2,40}$/.test(x)).slice(0, 6);
      if (!ids.length) return s;
      const why = list(a.reasons, 6, 160);
      const reasons = Object.fromEntries(ids.map((id, i) => [id, why[i]]).filter(([, r]) => r));
      const flows: Record<string, string[]> = {};
      for (const f of Array.isArray(a.flows) ? a.flows.slice(0, 6) : []) {
        const id = str((f as { id?: unknown })?.id, 40);
        const steps = list((f as { steps?: unknown })?.steps, 4, 80);
        if (id && steps.length === 4) flows[id] = steps;
      }
      return { ...s, capsX: { ids, reasons, flows }, phase: 'caps', openCap: undefined };
    }
    case 'open_booking': {
      const bookingX = defined({
        day: /^\d{4}-\d{2}-\d{2}$/.test(String(a.day ?? '')) ? String(a.day) : undefined,
        time: /^\d{2}:\d{2}$/.test(String(a.time ?? '')) ? String(a.time) : undefined,
        name: str(a.name, 80),
        contact: str(a.contact, 120),
        company: str(a.company, 80) ?? s.profileX?.company,
        notes: str(a.notes, 200),
      });
      return { ...s, bookingX, phase: 'booking', stageKey: s.stageKey + 1 };
    }
    case 'suggest_replies':
      return { ...s, suggestions: list(a.options, 3, 60) };
    case 'qualify_lead':
      // CHECK MATCH: desqualificado → a conversa com o LLM termina (palco com checklist e contactos);
      // qualificado → o open_booking que acompanha abre o agendamento pré-preenchido.
      return a.qualified === false ? { ...s, phase: 'closed', ai: false, suggestions: [] } : s;
    default:
      return s;
  }
}

/** Máquina de estados da conversa + entrega das mensagens com «a escrever…». */
export function useAgent(t: Dict) {
  const reducer = useMemo(() => makeReducer(t), [t]);
  const [state, dispatch] = useReducer(reducer, t, initialState);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const next = state.queue[0];
    if (!next) {
      setTyping(false);
      return;
    }
    setTyping(true);
    const delay = prefersReducedMotion() ? 0 : 520 + Math.min(next.text.length * 9, 1100);
    const id = window.setTimeout(() => dispatch({ type: 'deliver' }), delay);
    return () => window.clearTimeout(id);
  }, [state.queue]);

  const act = useCallback((a: Action) => dispatch(a), []);
  return { state, typing, act };
}
