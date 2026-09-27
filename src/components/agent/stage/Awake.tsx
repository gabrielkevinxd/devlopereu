import type { CSSProperties } from 'react';
import { CAP_COUNT } from '../../../data/capIds';
import { LANGS, fill } from '../../../i18n';
import { useI18n } from '../../../i18n/context';
import { Logo, maskUrl } from '../../brand/Logo';

/** Momento «uau» 1: o logótipo real acorda (feixe de luz mascarado pelo próprio PNG). */
export function Awake() {
  const { t } = useI18n();
  return (
    <div className="awake">
      <div className="awake__glow" aria-hidden="true" />
      <svg className="awake__rings" viewBox="0 0 100 100" aria-hidden="true">
        <circle className="hud-ring hud-ring--ticks" cx="50" cy="50" r="48" />
        <circle className="hud-ring hud-ring--dash" cx="50" cy="50" r="42" />
      </svg>
      <div className="awake__logo shimmer" style={{ '--mask': `url(${maskUrl('stacked')})` } as CSSProperties}>
        <Logo
          variant="stacked"
          sizes="(min-width: 1400px) 380px, (min-width: 900px) 300px, 150px"
          alt={t.meta.ogAlt}
          priority
        />
      </div>
      <ol className="awake__boot mono" aria-hidden="true">
        {t.boot.map((line, i) => (
          <li key={line} style={{ '--i': i } as CSSProperties}>
            <span>{i === t.boot.length - 1 ? '✓' : '›'}</span> {fill(line, { n: CAP_COUNT })}
          </li>
        ))}
      </ol>
      <p className="awake__facts mono">
        {t.ui.location} · 2024 · {LANGS.map((l) => l.toUpperCase()).join(' ')}
      </p>
    </div>
  );
}
