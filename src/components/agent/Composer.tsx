import { useEffect, useRef, useState, type FormEvent } from 'react';
import { fill, LANG_TAGS } from '../../i18n';
import { useI18n } from '../../i18n/context';
import { readStore, writeStore } from '../../lib/storage';
import { pathFor } from '../../routes';
import type { VoiceError } from '../../ai/voice';
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
type MicState = 'idle' | 'arming' | 'listening' | 'transcribing';
type Pending = { kind: 'text'; text: string; voice: boolean } | { kind: 'mic' };

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
  const [pending, setPending] = useState<Pending | null>(null);
  const [provider, setProvider] = useState('');
  const [mic, setMic] = useState<MicState>('idle');
  const [level, setLevel] = useState(0);
  const [voiceError, setVoiceError] = useState<VoiceError | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [replyToPlay, setReplyToPlay] = useState<{ text: string; tts: boolean } | null>(null);
  const [muted, setMuted] = useState(false);
  /** depois de usar voz, o botão de silenciar fica sempre à mão */
  const [voiceUsed, setVoiceUsed] = useState(false);
  const [sending, setSending] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    setConsent(readStore<Consent>(CONSENT_KEY, 'unknown'));
    setMuted(readStore<boolean>(MUTE_KEY, false));
    return () => cancelRef.current?.(); // sai da página/modo a meio de uma gravação → liberta o microfone
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
    setReplyToPlay(null);
    setSpeaking(true);
    const r = await v.speak(reply, lang, LANG_TAGS[lang], serverTts);
    setSpeaking(false);
    // o browser bloqueou o som (autoplay) → botão «Ouvir resposta» (um clique conta como interação)
    if (r === 'blocked') setReplyToPlay({ text: reply, tts: serverTts });
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
      setPending({ kind: 'text', text: clean, voice });
      return;
    }
    setSending(true);
    const r = await runTurn({ text: clean, voice, lang, t, state: stateRef.current, act });
    setSending(false);
    // Fala quando o visitante usou a voz ou pediu áudio — nunca em autoplay (houve sempre interação).
    if (r.ok && (voice || r.wantVoice)) void speakReply(r.text, h.tts);
  };

  /**
   * Microfone. Caminho principal: gravar + transcrever no servidor (Gemini) — funciona em todos os
   * browsers modernos. Alternativa: reconhecimento do próprio browser. Todos os erros ficam visíveis.
   */
  const startMic = async (consentGiven = consent) => {
    setVoiceError(null);
    setReplyToPlay(null);
    const v = await loadVoice();
    v.stopSpeaking();
    setSpeaking(false);
    setVoiceUsed(true);
    const fail = (reason: VoiceError) => {
      setMic('idle');
      setLevel(0);
      setVoiceError(reason);
    };
    if (!v.isSecure()) return fail('insecure');
    const { health } = await loadSession();
    const h = await health();
    const serverStt = h.llm && h.stt && v.canRecord() && consentGiven !== 'declined';
    try {
      if (serverStt) {
        if (consentGiven !== 'ok') {
          // o áudio vai para o fornecedor de IA → primeiro o aviso RGPD
          setProvider(h.provider ?? '');
          setPending({ kind: 'mic' });
          return;
        }
        setMic('arming');
        const rec = await v.record(setLevel);
        stopRef.current = () => rec.stop();
        cancelRef.current = () => rec.cancel();
        setMic('listening');
        const { blob, spoke } = await rec.done;
        stopRef.current = cancelRef.current = null;
        if (!spoke || !blob.size) return fail('no-speech');
        setMic('transcribing');
        const heard = await v.transcribe(blob, lang);
        setMic('idle');
        if (!heard) return fail('no-speech');
        return void send(heard, true);
      }
      if (v.canRecognize()) {
        setMic('listening');
        const l = v.listen(LANG_TAGS[lang], (interim) => setText(interim));
        stopRef.current = () => l.stop();
        const heard = await l.result;
        stopRef.current = null;
        setMic('idle');
        return void send(heard, true);
      }
      fail('unsupported');
    } catch (e) {
      stopRef.current = cancelRef.current = null;
      fail((e as { reason?: VoiceError }).reason ?? 'unsupported');
    }
  };

  const toggleMic = () => {
    if (mic === 'listening' || mic === 'arming') return stopRef.current?.();
    if (mic === 'transcribing') return;
    void startMic();
  };

  const decide = (c: Consent) => {
    writeStore(CONSENT_KEY, c);
    setConsent(c);
    const p = pending;
    setPending(null);
    if (p?.kind === 'text') void send(p.text, p.voice, c);
    if (p?.kind === 'mic') void startMic(c); // o clique em «Aceitar» é o gesto que autoriza o microfone
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(text);
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    writeStore(MUTE_KEY, next);
    if (next) void loadVoice().then((v) => v.stopSpeaking());
    setSpeaking(false);
  };

  const ERR: Record<VoiceError, string> = {
    insecure: t.ai.voiceInsecure,
    denied: t.ai.voiceDenied,
    'no-device': t.ai.voiceNoDevice,
    'no-speech': t.ai.voiceNoSpeech,
    unsupported: t.ai.voiceUnsupported,
    'stt-failed': t.ai.voiceSttFailed,
  };
  const listening = mic === 'listening' || mic === 'arming';
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

      <form className={`composer${listening ? ' is-listening' : ''}`} onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="composer-input">
          {t.ai.placeholder}
        </label>
        <input
          id="composer-input"
          className="composer__input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={prefetch}
          placeholder={listening ? t.ai.listening : mic === 'transcribing' ? t.ai.transcribing : t.ai.placeholder}
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
          aria-pressed={listening}
          aria-label={mic === 'idle' ? t.ai.mic : t.ai.micStop}
          title={mic === 'idle' ? t.ai.mic : t.ai.micStop}
          data-state={mic}
          onClick={toggleMic}
          disabled={mic === 'transcribing'}
        >
          {mic === 'idle' ? <IconMic /> : mic === 'transcribing' ? <span className="composer__spin" aria-hidden="true" /> : <IconStop />}
        </button>
        <button type="submit" className="composer__icon composer__send" aria-label={t.ai.send} title={t.ai.send} disabled={!text.trim() || sending}>
          <IconSend />
        </button>
      </form>

      {/* Estado da voz: sempre visível e anunciado (a ouvir / a transcrever / a falar / erro com ação) */}
      <div className="voice-status" role="status" aria-live="polite" data-state={voiceError ? 'error' : listening ? 'listening' : mic === 'transcribing' ? 'transcribing' : speaking ? 'speaking' : replyToPlay ? 'blocked' : 'idle'}>
        {listening && (
          <>
            <span className="voice-meter" aria-hidden="true">
              {[0.15, 0.35, 0.6, 0.35, 0.15].map((w, i) => (
                <i key={i} style={{ transform: `scaleY(${0.2 + Math.min(1, level * (1 + w * 2)) * 0.8})` }} />
              ))}
            </span>
            <span>{t.ai.listening}</span>
            <button type="button" className="voice-status__action" onClick={() => stopRef.current?.()}>
              {t.ai.micStop}
            </button>
          </>
        )}
        {mic === 'transcribing' && <span>{t.ai.transcribing}</span>}
        {speaking && !listening && <span>{t.ai.speaking}</span>}
        {voiceError && !listening && (
          <>
            <span className="voice-status__error">{ERR[voiceError]}</span>
            {voiceError !== 'insecure' && voiceError !== 'unsupported' && (
              <button type="button" className="voice-status__action" onClick={() => void startMic()}>
                {t.ai.retry}
              </button>
            )}
            <button type="button" className="voice-status__close" aria-label={t.ui.close} onClick={() => setVoiceError(null)}>
              ×
            </button>
          </>
        )}
        {replyToPlay && !speaking && !listening && (
          <button type="button" className="voice-status__action" onClick={() => void speakReply(replyToPlay.text, replyToPlay.tts)}>
            ▶ {t.ai.playReply}
          </button>
        )}
      </div>
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
