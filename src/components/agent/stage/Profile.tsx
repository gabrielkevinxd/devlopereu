import { useI18n } from '../../../i18n/context';
import type { AgentState } from '../useAgent';

/** Momento «uau» 2: a ficha da empresa escreve-se à medida que o visitante responde. */
export function Profile({ state }: { state: AgentState }) {
  const { t } = useI18n();
  const p = t.profile;
  const x = state.profileX ?? {};
  const sector = x.sector ?? t.sectors.find((s) => s.id === state.sectorId)?.label;
  const pain = x.pain ?? t.pains.find((y) => y.id === state.painId)?.label;
  // No fluxo guiado os valores vêm dos sliders; na conversa livre, do LLM (update_profile).
  const sliders = state.phase === 'team' && !state.ai;
  const team = x.team ?? (sliders ? state.people : undefined);
  const hours = x.hours ?? (sliders ? state.hours : undefined);
  const rows: Array<[string, string | undefined]> = [
    ...(x.company ? ([[t.ai.company, x.company]] as Array<[string, string]>) : []),
    [p.sector, sector],
    [p.pain, pain],
    ...(x.systems ? ([[t.ai.systems, x.systems]] as Array<[string, string]>) : []),
    [p.team, team !== undefined ? `${team} ${p.peopleUnit}` : undefined],
    [p.hours, hours !== undefined ? `${hours} ${p.hoursUnit}` : undefined],
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
