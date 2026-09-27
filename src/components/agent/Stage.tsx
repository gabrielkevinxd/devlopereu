import { forwardRef, lazy, Suspense } from 'react';
import { useI18n } from '../../i18n/context';
import { BookingForm } from '../booking/BookingForm';
import { Awake } from './stage/Awake';
import { Closed, Done } from './stage/Done';
import { Profile } from './stage/Profile';
import { Simulation } from './stage/Simulation';
import type { Action, AgentState } from './useAgent';
import './Stage.css';

// Mega Brain: carregado só quando a conversa chega às capacidades (fora do bundle inicial).
const CommandCenter = lazy(() => import('./stage/CommandCenter'));

interface Props {
  state: AgentState;
  act: (a: Action) => void;
}

type View = 'awake' | 'profile' | 'sim' | 'caps' | 'booking' | 'done' | 'closed';

const viewFor = (s: AgentState): View => {
  switch (s.phase) {
    case 'intro':
      return 'awake';
    case 'sector':
    case 'pain':
    case 'team':
      return 'profile';
    case 'sim':
      return 'sim';
    case 'caps':
      return 'caps';
    case 'booking':
      return 'booking';
    case 'done':
      return 'done';
    case 'closed':
      return 'closed';
  }
};

export const Stage = forwardRef<HTMLElement, Props>(function Stage({ state, act }, ref) {
  const { t } = useI18n();
  const view = viewFor(state);
  const sector = t.sectors.find((s) => s.id === state.sectorId);
  const pain = t.pains.find((p) => p.id === state.painId);
  const caseSummary =
    !state.ai && sector && pain ? { sector: sector.label, pain: pain.label, people: state.people, hours: state.hours } : undefined;
  const x = state.profileX;
  const caseText = x
    ? [x.company, x.sector, x.pain, x.team && `${x.team} ${t.ai.peopleUnit}`, x.hours && `${x.hours} h`].filter(Boolean).join(' · ')
    : undefined;

  const path = {
    awake: 'boot',
    profile: 'perfil',
    sim: 'simulacao',
    caps: 'capacidades',
    booking: 'agendar',
    done: 'ok',
    closed: 'obrigado',
  }[view];

  return (
    <section ref={ref} className="stage" aria-label={t.ui.stageLabel} data-view={view} id="agendar-agente">
      <div className="stage__bar mono" aria-hidden="true">
        <span className="stage__dots">
          <i />
          <i />
          <i />
        </span>
        <span className="stage__path">devloper.eu/agente/{path}</span>
        {view === 'sim' && <span className="stage__badge">{t.ui.simulation}</span>}
      </div>
      <div className="stage__body" key={`${view}-${state.stageKey}`}>
        {view === 'awake' && <Awake />}
        {view === 'profile' && <Profile state={state} />}
        {view === 'sim' && (pain || state.simX) && <Simulation state={state} onDone={() => act({ type: 'simDone' })} />}
        {view === 'caps' && (
          <Suspense fallback={<p className="mono stage__loading">Mega Brain…</p>}>
            <CommandCenter state={state} act={act} />
          </Suspense>
        )}
        {view === 'booking' && (
          <BookingForm
            idPrefix="ag"
            caseSummary={caseSummary}
            caseText={caseSummary ? undefined : caseText || undefined}
            prefill={state.bookingX}
            onDone={(via) => act({ type: 'booked', via })}
          />
        )}
        {view === 'done' && <Done />}
        {view === 'closed' && <Closed />}
      </div>
    </section>
  );
});
