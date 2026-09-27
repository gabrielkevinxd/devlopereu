import { useI18n } from '../../../i18n/context';
import type { AgentState } from '../useAgent';

/** Momento «uau» 2: a ficha da empresa escreve-se à medida que o visitante responde. */
export function Profile({ state }: { state: AgentState }) {
  const { t } = useI18n();
  const p = t.profile;
  const sector = t.sectors.find((s) => s.id === state.sectorId)?.label;
  const pain = t.pains.find((x) => x.id === state.painId)?.label;
  const teamKnown = state.phase === 'team';
  const rows: Array<[string, string | undefined]> = [
    [p.sector, sector],
    [p.pain, pain],
    [p.team, teamKnown ? `${state.people} ${p.peopleUnit}` : undefined],
    [p.hours, teamKnown ? `${state.hours} ${p.hoursUnit}` : undefined],
  ];
  return (
    <div className="profile">
      <header className="stage__head">
        <h2>{p.title}</h2>
        <p className="mono">{p.subtitle}</p>
      </header>
      <dl className="profile__rows">
        {rows.map(([k, v]) => (
          <div key={k} className={`profile__row${v ? ' is-set' : ''}`}>
            <dt className="mono">{k}</dt>
            <dd key={v ?? 'pending'}>{v ?? <span className="profile__pending mono">{p.pending}</span>}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
