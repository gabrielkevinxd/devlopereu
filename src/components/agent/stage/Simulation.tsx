import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { fill } from '../../../i18n';
import { useI18n } from '../../../i18n/context';
import { prefersReducedMotion } from '../../../lib/storage';
import { scenarioHours, type AgentState } from '../useAgent';

const STEP_MS = 950;
/** Carimbos determinísticos (a simulação é ilustrativa, não um relógio real). */
const stamp = (i: number) => `09:14:${String(2 + i * 2 + (i > 2 ? 1 : 0)).padStart(2, '0')}`;
/** Evento i → nó do fluxo que o produz (distribuição proporcional). */
const nodeOf = (i: number, events: number, nodes: number) => Math.min(nodes - 1, Math.floor((i * nodes) / Math.max(1, events)));

/**
 * Momento «uau» 3: o agente a trabalhar no caso do visitante.
 * Tudo é determinístico e rotulado como simulação ilustrativa.
 */
export function Simulation({ state, onDone }: { state: AgentState; onDone: () => void }) {
  const { t } = useI18n();
  const pain = t.pains.find((p) => p.id === state.painId) ?? t.pains[0];
  const x = state.simX; // simulação desenhada pelo LLM para o caso do visitante
  const flowSteps = x?.flow ?? pain.flow;
  const events = x?.events ?? pain.log;
  const title = x?.title || fill(t.sim.title, { pain: pain.agentName });
  const people = x ? x.people : state.people;
  const hours = x ? x.hours : state.hours;
  const share = x?.share ?? 0.5;
  const total = events.length;
  const [step, setStep] = useState(0);
  const [tasks, setTasks] = useState(0);
  const doneRef = useRef(false);
  const result = people && hours ? scenarioHours(people, hours, share) : undefined;

  useEffect(() => {
    if (prefersReducedMotion()) {
      setStep(total);
      setTasks(24);
      return;
    }
    const a = window.setInterval(() => setStep((s) => Math.min(total, s + 1)), STEP_MS);
    const b = window.setInterval(() => setTasks((n) => n + 1 + (n % 3)), 700);
    return () => {
      window.clearInterval(a);
      window.clearInterval(b);
    };
  }, [total]);

  useEffect(() => {
    if (step >= total && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  }, [step, total, onDone]);

  const activeNode = step === 0 ? -1 : nodeOf(Math.min(step, total) - 1, total, flowSteps.length);

  return (
    <div className="sim">
      <header className="stage__head">
        <h2>{title}</h2>
        <p className="mono sim__live">
          <span className="pulse" /> {t.sim.running}
        </p>
      </header>

      <ol className="flow" style={{ '--n': flowSteps.length } as CSSProperties}>
        {flowSteps.map((label, i) => {
          const state = i === activeNode ? 'active' : i < activeNode || step >= total ? 'done' : 'idle';
          return (
            <li key={label} className={`flow__node is-${state}`} style={{ '--i': i } as CSSProperties}>
              <span className="flow__idx mono">{String(i + 1).padStart(2, '0')}</span>
              <span className="flow__label">{label}</span>
              {i < flowSteps.length - 1 && <span className="flow__wire" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>

      <div className="sim__grid">
        <section className="sim__log" aria-label={t.sim.events}>
          <h3 className="mono">{t.sim.events}</h3>
          <ol className="mono" aria-live="polite">
            {events.slice(0, step).map((line, i) => (
              <li key={line}>
                <time>{stamp(i)}</time> {line}
              </li>
            ))}
            {step < total && <li className="sim__cursor" aria-hidden="true" />}
          </ol>
        </section>

        <dl className="sim__metrics">
          <div>
            <dt className="mono">{t.sim.tasks}</dt>
            <dd className="sim__big">{tasks}</dd>
          </div>
          <div>
            <dt className="mono">{t.sim.response}</dt>
            <dd className="sim__big">{t.sim.responseValue}</dd>
          </div>
          {result !== undefined && (
            <div className="sim__scenario">
              <dt className="mono">{t.sim.scenario}</dt>
              <dd>
                <span className="sim__big sim__gold">{result} h</span>
                <span className="mono sim__formula">
                  {fill(t.sim.formula, { people: people ?? 0, hours: hours ?? 0, share: Math.round(share * 100), result })}
                </span>
              </dd>
            </div>
          )}
        </dl>
      </div>

      <p className="sim__note">{t.sim.disclaimer}</p>
    </div>
  );
}
