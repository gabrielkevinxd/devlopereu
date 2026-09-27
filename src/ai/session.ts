/**
 * Sessão com o LLM (carregada só quando o visitante escreve ou fala — fora do bundle inicial).
 * Fala com /api/agent.php (PHP em produção, middleware Vite em dev). A chave nunca chega aqui.
 */
import type { Dict, Lang } from '../i18n';
import type { Action, AgentState } from '../components/agent/useAgent';

export const ENDPOINT = '/api/agent.php';

export interface Health {
  llm: boolean;
  provider: string | null;
  tts: boolean;
  stt: boolean;
}

const OFF: Health = { llm: false, provider: null, tts: false, stt: false };
let healthPromise: Promise<Health> | null = null;

/** Disponibilidade do agente (cache por página). Qualquer falha = sem LLM → fluxo guiado. */
export function health(): Promise<Health> {
  healthPromise ??= fetch(`${ENDPOINT}?action=health`, { headers: { accept: 'application/json' } })
    .then((r) => (r.ok ? (r.json() as Promise<Health>) : OFF))
    .then((h) => ({ ...OFF, ...h }))
    .catch(() => OFF);
  return healthPromise;
}

/** Resumo do palco enviado ao modelo (para ele saber o que o visitante está a ver). */
function stageSummary(s: AgentState, t: Dict) {
  const sector = t.sectors.find((x) => x.id === s.sectorId)?.label;
  const pain = t.pains.find((x) => x.id === s.painId)?.label;
  return {
    view: s.phase,
    profile: { ...(sector ? { sector } : {}), ...(pain ? { pain } : {}), ...s.profileX },
    simulation: s.simX?.title ?? null,
    capabilities: s.capsX?.ids ?? null,
    bookingOpen: s.phase === 'booking',
  };
}

function history(s: AgentState, text: string) {
  const past = s.messages
    .filter((m) => m.text.trim() && m.tone !== 'note')
    .map((m) => ({ role: m.from === 'user' ? 'user' : 'assistant', text: m.text }));
  return [...past, { role: 'user', text }].slice(-12);
}

export interface TurnResult {
  ok: boolean;
  text: string;
  wantVoice: boolean;
}

/**
 * Um turno: mostra a mensagem do visitante, faz streaming da resposta e aplica as tool calls ao palco.
 * Se algo falhar (sem chave, rate limit, timeout, rede), passa ao fluxo guiado sem mostrar erro.
 */
export async function runTurn(opts: {
  text: string;
  voice: boolean;
  lang: Lang;
  t: Dict;
  state: AgentState;
  act: (a: Action) => void;
}): Promise<TurnResult> {
  const { text, voice, lang, t, state, act } = opts;
  act({ type: 'user_text', text });
  act({ type: 'ai_start' });
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 35000);
  let reply = '';
  let wantVoice = false;
  let finished = false;
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'chat', lang, voice, messages: history(state, text), state: stageSummary(state, t) }),
      signal: ctrl.signal,
    });
    if (!res.ok || !res.body) throw new Error(String(res.status));
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    const handle = (line: string) => {
      if (!line.trim()) return;
      let e: { t: string; d?: string; name?: string; args?: Record<string, unknown> };
      try {
        e = JSON.parse(line);
      } catch {
        return;
      }
      if (e.t === 'text' && e.d) {
        reply += e.d;
        act({ type: 'ai_delta', text: e.d });
      } else if (e.t === 'tool' && e.name) {
        if (e.name === 'reply_with_voice') wantVoice = true;
        else act({ type: 'ai_tool', name: e.name, args: e.args ?? {} });
      } else if (e.t === 'fallback') {
        throw new Error('fallback');
      } else if (e.t === 'done') {
        finished = true;
      }
    };
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      lines.forEach(handle);
    }
    handle(buf);
    if (!finished || !reply.trim()) throw new Error('incomplete');
    act({ type: 'ai_end' });
    return { ok: true, text: reply, wantVoice };
  } catch {
    act({ type: 'ai_fallback' });
    return { ok: false, text: '', wantVoice: false };
  } finally {
    window.clearTimeout(timer);
  }
}
