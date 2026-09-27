import { useEffect, useRef, type CSSProperties } from 'react';
import { useI18n } from '../../i18n/context';
import { useAppState } from '../../lib/app-state';
import { pathFor } from '../../routes';
import { Logo, maskUrl } from '../brand/Logo';
import type { Action, AgentState } from './useAgent';
import { Composer } from './Composer';
import { TeamInput } from './TeamInput';
import './Chat.css';

interface Props {
  state: AgentState;
  typing: boolean;
  act: (a: Action) => void;
}

export function Chat({ state, typing, act }: Props) {
  const { t, lang } = useI18n();
  const { setMode } = useAppState();
  const logRef = useRef<HTMLDivElement>(null);
  const answersRef = useRef<HTMLDivElement>(null);
  const firstRun = useRef(true);

  // Mantém a última mensagem visível: scroll interno (desktop) ou da página (telemóvel).
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const log = logRef.current;
    if (!log) return;
    if (log.scrollHeight > log.clientHeight + 1) {
      log.scrollTo({ top: log.scrollHeight, behavior: 'smooth' });
      return;
    }
    // No agendamento quem conduz o scroll é o Workspace (leva ao formulário).
    if (state.phase === 'booking' || state.phase === 'done' || state.phase === 'closed') return;
    const last = log.lastElementChild?.getBoundingClientRect();
    const answers = answersRef.current?.getBoundingClientRect();
    if (last && answers && last.bottom > answers.top - 12) {
      window.scrollBy({ top: last.bottom - answers.top + 24, behavior: 'smooth' });
    }
  }, [state.messages.length, typing, state.phase, state.streamingId]);

  // «A escrever…» enquanto há mensagens em fila ou o LLM ainda não mandou a primeira palavra.
  const streaming = state.messages.find((m) => m.id === state.streamingId);
  const waitingAi = !!streaming && !streaming.text;
  const busy = typing || state.queue.length > 0 || waitingAi;
  const aiActive = state.ai || state.streamingId !== undefined;

  return (
    <section className="chat" aria-label={t.ui.chatLabel}>
      <div className="chat__head">
        <span className={`chat__avatar${busy ? ' shimmer' : ''}`} style={{ '--mask': `url(${maskUrl('mark')})` } as CSSProperties}>
          <Logo variant="mark" sizes="40px" alt="" />
        </span>
        <p className="chat__who">
          <strong>{t.ui.agent}</strong>
          <span className="mono">
            {busy ? t.ui.typing : `● ${t.ui.status}`}
            {aiActive && <em className="chat__live">{t.ai.live}</em>}
          </span>
        </p>
        <div className="chat__tools">
          {state.phase !== 'intro' && (
            <button type="button" className="chat__tool" onClick={() => act({ type: 'restart' })}>
              ↺ <span>{t.ui.restart}</span>
            </button>
          )}
          <button type="button" className="chat__tool chat__tool--classic" onClick={() => setMode('read')}>
            {t.ui.toClassic}
          </button>
        </div>
      </div>

      <div className="chat__log" ref={logRef} role="log" aria-live="polite" aria-relevant="additions">
        {state.messages.map((m) =>
          !m.text ? null : m.tone === 'title' ? (
            <h1 key={m.id} className="msg msg--agent msg--title">
              {m.text}
            </h1>
          ) : (
            <p key={m.id} className={`msg msg--${m.from}${m.tone === 'note' ? ' msg--note' : ''}`}>
              <span className="sr-only">{m.from === 'agent' ? t.ui.agent : t.ui.you}: </span>
              {m.text}
            </p>
          ),
        )}
        {busy && (
          <p className="msg msg--agent msg--typing" aria-label={t.ui.typing}>
            <i />
            <i />
            <i />
          </p>
        )}
      </div>

      <div ref={answersRef} className="chat__answers" aria-label={t.ui.answersLabel} role="group" data-busy={busy} data-streaming={state.streamingId !== undefined}>
        {!busy && !aiActive && <Answers state={state} act={act} />}
        {!busy && (state.phase === 'done' || state.phase === 'closed') && (
          <a className="btn btn--gold" href={pathFor(lang, 'checklist')}>
            {t.chat.magnetCta}
          </a>
        )}
        {state.phase !== 'closed' && state.phase !== 'done' && (
          <Composer state={state} act={act} busy={busy || state.streamingId !== undefined} />
        )}
      </div>
    </section>
  );
}

function Answers({ state, act }: { state: AgentState; act: (a: Action) => void }) {
  const { t } = useI18n();
  const { setMode } = useAppState();
  switch (state.phase) {
    case 'intro':
      return (
        <>
          <button type="button" className="btn btn--gold" onClick={() => act({ type: 'start' })}>
            {t.chat.introYes}
          </button>
          <button type="button" className="btn" onClick={() => setMode('read')}>
            {t.chat.introNo}
          </button>
        </>
      );
    case 'sector':
      return (
        <>
          {t.sectors.map((s) => (
            <button key={s.id} type="button" className="btn answer" onClick={() => act({ type: 'sector', id: s.id })}>
              {s.label}
            </button>
          ))}
        </>
      );
    case 'pain':
      return (
        <>
          {t.pains.map((p) => (
            <button key={p.id} type="button" className="btn answer" onClick={() => act({ type: 'pain', id: p.id })}>
              {p.label}
            </button>
          ))}
        </>
      );
    case 'team':
      return <TeamInput people={state.people} hours={state.hours} act={act} />;
    case 'sim':
      return state.simDone ? (
        <button type="button" className="btn btn--gold" onClick={() => act({ type: 'caps' })}>
          {t.chat.toCaps}
        </button>
      ) : null;
    case 'caps':
      return (
        <button type="button" className="btn btn--gold" onClick={() => act({ type: 'book' })}>
          {t.chat.toBook}
        </button>
      );
    default:
      return null;
  }
}
