import type { CSSProperties } from 'react';
import { LANGS } from '../../../i18n';
import { useI18n } from '../../../i18n/context';
import { Logo, maskUrl } from '../../brand/Logo';

/** Momento «uau» 1: o logótipo real acorda (feixe de luz mascarado pelo próprio PNG). */
export function Awake() {
  const { t } = useI18n();
  return (
    <div className="awake">
      <div className="awake__glow" aria-hidden="true" />
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
            <span>{i === t.boot.length - 1 ? '✓' : '›'}</span> {line}
          </li>
        ))}
      </ol>
      <p className="awake__facts mono">
        {t.ui.location} · 2024 · {LANGS.map((l) => l.toUpperCase()).join(' ')}
      </p>
    </div>
  );
}
