import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { fill, type Dict } from '../../i18n';
import { prefersReducedMotion } from '../../lib/storage';
import type { BookVia } from '../booking/BookingForm';

export type Phase = 'intro' | 'sector' | 'pain' | 'team' | 'sim' | 'caps' | 'booking' | 'done';

export interface Msg {
  id: number;
  from: 'agent' | 'user';
  text: string;
  tone?: 'title' | 'note';
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
  | { type: 'book'; fromCta?: boolean }
  | { type: 'booked'; via: BookVia }
  | { type: 'restart' }
  | { type: 'deliver' };

/** Cenário honesto: o agente assume metade das horas que o próprio visitante indicou. */
export const scenarioHours = (people: number, hours: number) => Math.round(people * hours * 0.5);

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
        if (s.simDone || s.phase !== 'sim') return s;
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
    }
  };
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
