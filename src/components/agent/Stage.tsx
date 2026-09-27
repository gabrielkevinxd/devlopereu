import { forwardRef } from 'react';
import { useI18n } from '../../i18n/context';
import { BookingForm } from '../booking/BookingForm';
import { Awake } from './stage/Awake';
import { Capabilities } from './stage/Capabilities';
import { Done } from './stage/Done';
import { Profile } from './stage/Profile';
import { Simulation } from './stage/Simulation';
import type { Action, AgentState } from './useAgent';
import './Stage.css';

interface Props {
  state: AgentState;
  act: (a: Action) => void;
}

type View = 'awake' | 'profile' | 'sim' | 'caps' | 'booking' | 'done';

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
  }
};

export const Stage = forwardRef<HTMLElement, Props>(function Stage({ state, act }, ref) {
  const { t } = useI18n();
  const view = viewFor(state);
  const sector = t.sectors.find((s) => s.id === state.sectorId);
  const pain = t.pains.find((p) => p.id === state.painId);
  const caseSummary =
    sector && pain ? { sector: sector.label, pain: pain.label, people: state.people, hours: state.hours } : undefined;

  const path = {
    awake: 'boot',
    profile: 'perfil',
    sim: 'simulacao',
    caps: 'capacidades',
    booking: 'agendar',
    done: 'ok',
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
      <div className="stage__body" key={view}>
        {view === 'awake' && <Awake />}
        {view === 'profile' && <Profile state={state} />}
        {view === 'sim' && pain && <Simulation state={state} onDone={() => act({ type: 'simDone' })} />}
        {view === 'caps' && <Capabilities state={state} act={act} />}
        {view === 'booking' && (
          <BookingForm idPrefix="ag" caseSummary={caseSummary} onDone={(via) => act({ type: 'booked', via })} />
        )}
        {view === 'done' && <Done />}
      </div>
    </section>
  );
});
