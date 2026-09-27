import { useId } from 'react';
import { useI18n } from '../../i18n/context';
import type { Action } from './useAgent';

interface Props {
  people: number;
  hours: number;
  act: (a: Action) => void;
}

/** Os números vêm do visitante — o agente não inventa volumes. */
export function TeamInput({ people, hours, act }: Props) {
  const { t } = useI18n();
  const id = useId();
  return (
    <div className="team">
      <div className="range">
        <label htmlFor={`${id}-p`}>
          {t.chat.people} <output className="mono">{people}</output>
        </label>
        <input
          id={`${id}-p`}
          type="range"
          min={1}
          max={50}
          value={people}
          onChange={(e) => act({ type: 'people', value: Number(e.target.value) })}
        />
      </div>
      <div className="range">
        <label htmlFor={`${id}-h`}>
          {t.chat.hours} <output className="mono">{hours} h</output>
        </label>
        <input
          id={`${id}-h`}
          type="range"
          min={1}
          max={40}
          value={hours}
          onChange={(e) => act({ type: 'hours', value: Number(e.target.value) })}
        />
      </div>
      <button type="button" className="btn btn--gold" onClick={() => act({ type: 'team' })}>
        {t.chat.confirmTeam}
      </button>
    </div>
  );
}
