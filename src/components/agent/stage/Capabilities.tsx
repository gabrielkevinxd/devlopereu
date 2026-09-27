import { useI18n } from '../../../i18n/context';
import type { Action, AgentState } from '../useAgent';

/** Momento «uau» 4: os serviços como capacidades que o agente liga para o caso concreto. */
export function Capabilities({ state, act }: { state: AgentState; act: (a: Action) => void }) {
  const { t } = useI18n();
  const unlocked = state.capsX?.ids ?? t.pains.find((p) => p.id === state.painId)?.services ?? [];
  const reasons = state.capsX?.reasons ?? {};
  const ordered = [...t.services].sort((a, b) => Number(unlocked.includes(b.id)) - Number(unlocked.includes(a.id)));

  return (
    <div className="caps">
      <header className="stage__head">
        <h2>{t.caps.title}</h2>
        <p className="mono">
          {unlocked.length}/{t.services.length} · {t.caps.unlocked}
        </p>
      </header>
      <ul className="caps__grid">
        {ordered.map((s, i) => {
          const on = unlocked.includes(s.id);
          const open = state.openCap === s.id;
          return (
            <li key={s.id} className={`cap${on ? ' is-on' : ''}${open ? ' is-open' : ''}`} style={{ animationDelay: `${i * 90}ms` }}>
              <button type="button" aria-expanded={open} onClick={() => act({ type: 'openCap', id: s.id })}>
                <span className="cap__state mono">{on ? `◆ ${t.caps.unlocked}` : `◇ ${t.caps.available}`}</span>
                <span className="cap__name">{s.name}</span>
                <span className="cap__short">{s.short}</span>
              </button>
              {open && (
                <div className="cap__more">
                  <ul>
                    {s.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  {on && (
                    <p>
                      <strong>{t.caps.why}:</strong> {reasons[s.id] ?? s.why}
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
