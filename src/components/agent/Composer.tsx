import { useEffect, useRef, useState, type FormEvent } from 'react';
import { fill, LANG_TAGS } from '../../i18n';
import { useI18n } from '../../i18n/context';
import { readStore, writeStore } from '../../lib/storage';
import { pathFor } from '../../routes';
import type { Action, AgentState } from './useAgent';
import './Composer.css';

/*
 * Conversa livre + voz. Este componente é leve: a sessão com o LLM (src/ai/session.ts) e a voz
 * (src/ai/voice.ts) só são descarregadas quando o visitante escreve, fala ou passa por cima.
 */
const loadSession = () => import('../../ai/session');
const loadVoice = () => import('../../ai/voice');

const CONSENT_KEY = 'dev-ai-consent-v1';
const MUTE_KEY = 'dev-ai-muted';
type Consent = 'unknown' | 'ok' | 'declined';
type MicState = 'idle' | 'listening' | 'recording' | 'transcribing';

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/** Sem LLM: tenta reconhecer a opção guiada que o visitante escreveu/disse. */
function matchOption(text: string, options: { id: string; label: string }[]): string | undefined {
  const n = norm(text);
  return options.find((o) =>
    norm(o.label)
      .split(/[^a-z0-9]+/)
      .some((w) => w.length >= 4 && n.includes(w)),
  )?.id;
}

interface Props {
  state: AgentState;
  act: (a: Action) => void;
  busy: boolean;
}

export function Composer({ state, act, busy }: Props) {
  const { t, lang } = useI18n();
  const [text, setText] = useState('');
  const [consent, setConsent] = useState<Consent>('unknown');
  const [pending, setPending] = useState<{ text: string; voice: boolean } | null>(null);
  const [provider, setProvider] = useState('');
  const [mic, setMic] = useState<MicState>('idle');
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  /** depois de usar voz, o botão de silenciar fica sempre à mão */
  const [voiceUsed, setVoiceUsed] = useState(false);
  const [sending, setSending] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    setConsent(readStore<Consent>(CONSENT_KEY, 'unknown'));
    setMuted(readStore<boolean>(MUTE_KEY, false));
  }, []);

  const prefetch = () => void loadSession().then((m) => m.health());

  /** Fluxo guiado (sem LLM, sem consentimento ou após falha): reconhece a opção ou dá um empurrão educado. */
  const scripted = (value: string) => {
    const s = stateRef.current;
    if (s.phase === 'sector') {
      const id = matchOption(value, t.sectors);
      if (id) return act({ type: 'sector', id });
    }
    if (s.phase === 'pain') {
      const id = matchOption(value, t.pains);
      if (id) return act({ type: 'pain', id });
    }
    act({ type: 'user_text', text: value });
    act({ type: 'ai_fallback' });
  };

  const speakReply = async (reply: string, serverTts: boolean) => {
    if (!reply || readStore<boolean>(MUTE_KEY, false)) return;
    const v = await loadVoice();
    setVoiceUsed(true);
    setSpeaking(true);
    await v.speak(reply, lang, LANG_TAGS[lang], serverTts);
    setSpeaking(false);
  };

  const send = async (value: string, voice = false, consentGiven = consent) => {
    const clean = value.trim().slice(0, 600);
    if (!clean || sending) return;
    setText('');
    const { health, runTurn } = await loadSession();
    const h = await health();
    if (!h.llm || consentGiven === 'declined') return scripted(clean);
    if (consentGiven !== 'ok') {
      setProvider(h.provider ?? '');
      setPending({ text: clean, voice });
      return;
    }
    setSending(true);
    const r = await runTurn({ text: clean, voice, lang, t, state: stateRef.current, act });
    setSending(false);
    // Fala quando o visitante usou a voz ou pediu áudio — nunca em autoplay (houve sempre interação).
    if (r.ok && (voice || r.wantVoice)) void speakReply(r.text, h.tts);
  };

  const decide = (c: Consent) => {
    writeStore(CONSENT_KEY, c);
    setConsent(c);
    const p = pending;
    setPending(null);
    if (p) void send(p.text, p.voice, c);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(text);
  };

  const toggleMic = async () => {
    if (mic === 'listening' || mic === 'recording') return stopRef.current?.();
    if (mic === 'transcribing') return;
    const v = await loadVoice();
    v.stopSpeaking();
    setSpeaking(false);
    setVoiceUsed(true);
    try {
      if (v.canRecognize()) {
        setMic('listening');
        const l = v.listen(LANG_TAGS[lang], (interim) => setText(interim));
        stopRef.current = () => l.stop();
        const heard = await l.result;
        setMic('idle');
        if (heard) void send(heard, true);
        else setText('');
        return;
      }
      const { health } = await loadSession();
      const h = await health();
      if (!v.canRecord() || !h.stt || consent !== 'ok') throw new Error('no-stt');
      setMic('recording');
      const r = await v.record();
      await new Promise<void>((resolve) => {
        stopRef.current = () => resolve();
      });
      setMic('transcribing');
      const heard = await v.transcribe(await r.stop(), lang);
      setMic('idle');
      if (heard) void send(heard, true);
    } catch {
      setMic('idle');
      act({ type: 'say', text: t.ai.micDenied });
    } finally {
      stopRef.current = null;
    }
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    writeStore(MUTE_KEY, next);
    if (next) void loadVoice().then((v) => v.stopSpeaking());
    setSpeaking(false);
  };

  const status = mic === 'listening' || mic === 'recording' ? t.ai.listening : mic === 'transcribing' ? t.ai.transcribing : speaking ? t.ai.speaking : '';
  const showSuggestions = state.ai && !busy && state.suggestions.length > 0;

  return (
    <div className="composer-wrap" onPointerEnter={prefetch}>
      {pending && (
        <div className="ai-consent" role="dialog" aria-labelledby="ai-consent-title">
          <p id="ai-consent-title" className="ai-consent__title">
            {t.ai.consentTitle}
          </p>
          <p>
            {fill(t.ai.consentText, { provider: (provider && PROVIDER_LABEL[provider]) || 'IA' })}{' '}
            <a href={pathFor(lang, 'privacy')}>{t.ai.consentLink}</a>.
          </p>
          <div className="ai-consent__actions">
            <button type="button" className="btn btn--gold" onClick={() => decide('ok')}>
              {t.ai.consentAccept}
            </button>
            <button type="button" className="btn" onClick={() => decide('declined')}>
              {t.ai.consentDecline}
            </button>
          </div>
        </div>
      )}

      {showSuggestions && (
        <div className="suggestions">
          {state.suggestions.map((s) => (
            <button key={s} type="button" className="btn answer" onClick={() => void send(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <form className="composer" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="composer-input">
          {t.ai.placeholder}
        </label>
        <input
          id="composer-input"
          className="composer__input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={prefetch}
          placeholder={status || t.ai.placeholder}
          maxLength={600}
          autoComplete="off"
          enterKeyHint="send"
        />
        {(speaking || muted || voiceUsed) && (
          <button type="button" className="composer__icon" aria-pressed={muted} aria-label={muted ? t.ai.unmute : t.ai.mute} title={muted ? t.ai.unmute : t.ai.mute} onClick={toggleMute}>
            {muted ? <IconMuted /> : <IconSpeaker />}
          </button>
        )}
        <button
          type="button"
          className={`composer__icon composer__mic${mic !== 'idle' ? ' is-on' : ''}`}
          aria-pressed={mic === 'listening' || mic === 'recording'}
          aria-label={mic === 'idle' ? t.ai.mic : t.ai.micStop}
          title={mic === 'idle' ? t.ai.mic : t.ai.micStop}
          onClick={() => void toggleMic()}
        >
          {mic === 'idle' ? <IconMic /> : <IconStop />}
        </button>
        <button type="submit" className="composer__icon composer__send" aria-label={t.ai.send} title={t.ai.send} disabled={!text.trim() || sending}>
          <IconSend />
        </button>
      </form>
      <p className="composer__status mono" aria-live="polite">
        {status}
      </p>
    </div>
  );
}

const PROVIDER_LABEL: Record<string, string> = {
  gemini: 'Google Gemini',
  openai: 'OpenAI',
  anthropic: 'Anthropic Claude',
  mock: 'mock',
};

const svg = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
const IconMic = () => (
  <svg {...svg}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
);
const IconStop = () => (
  <svg {...svg}>
    <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" />
  </svg>
);
const IconSend = () => (
  <svg {...svg}>
    <path d="M4 12h14M13 6l6 6-6 6" />
  </svg>
);
const IconSpeaker = () => (
  <svg {...svg}>
    <path d="M4 10v4h4l5 4V6L8 10H4z" />
    <path d="M17 9a4 4 0 0 1 0 6" />
  </svg>
);
const IconMuted = () => (
  <svg {...svg}>
    <path d="M4 10v4h4l5 4V6L8 10H4z" />
    <path d="M17 10l4 4M21 10l-4 4" />
  </svg>
);
