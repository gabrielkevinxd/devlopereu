import React, { useId } from 'react';
import { useReducedMotion } from 'framer-motion';

type Props = { modules: string[]; core: string; label: string; compact?: boolean };

/** Mapa de nós: o núcleo (Devloper.eu) ligado a cada módulo. Ecoa o motivo de rede neuronal do logótipo. */
const AutomationMap: React.FC<Props> = ({ modules, core, label, compact }) => {
  const reduce = useReducedMotion();
  const gid = 'mapCore' + useId().replace(/:/g, '');
  const cx = 280;
  const cy = 210;
  const rx = 190;
  const ry = 138;
  const n = Math.max(modules.length, 1);
  const nodes = modules.map((m, i) => {
    const a = (n <= 2 ? 0 : -Math.PI / 2) + (i * 2 * Math.PI) / n;
    return { m, x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a), a };
  });

  return (
    <svg viewBox="0 0 560 420" role="img" aria-label={label} className="w-full h-auto">
      <defs>
        <radialGradient id={gid} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F3D77A" />
          <stop offset="100%" stopColor="#D4AF37" />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="#D4AF37" strokeOpacity="0.12" strokeDasharray="3 7" />
      {nodes.map((p, i) => (
        <g key={p.m}>
          <line
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="#D4AF37"
            strokeOpacity="0.55"
            strokeWidth="1.5"
            strokeDasharray="5 6"
          >
            {!reduce && <animate attributeName="stroke-dashoffset" from="22" to="0" dur="1.6s" repeatCount="indefinite" />}
          </line>
          <circle cx={p.x} cy={p.y} r="15" fill="#0D0D0D" stroke="#D4AF37" strokeWidth="2" />
          <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="#D4AF37" fontFamily="Montserrat, sans-serif">
            {i + 1}
          </text>
          {!compact && (
            <text
              x={p.x + (Math.cos(p.a) >= 0.3 ? 24 : Math.cos(p.a) <= -0.3 ? -24 : 0)}
              y={p.y + (Math.abs(Math.cos(p.a)) < 0.3 ? (Math.sin(p.a) < 0 ? -26 : 34) : 5)}
              textAnchor={Math.cos(p.a) >= 0.3 ? 'start' : Math.cos(p.a) <= -0.3 ? 'end' : 'middle'}
              fontSize="13"
              fill="#F2F2F2"
              fontFamily="Montserrat, sans-serif"
            >
              {p.m.length > 26 ? p.m.slice(0, 25) + '…' : p.m}
            </text>
          )}
        </g>
      ))}
      <circle cx={cx} cy={cy} r="46" fill="#0D0D0D" stroke="#D4AF37" strokeOpacity="0.35" strokeWidth="10" />
      <circle cx={cx} cy={cy} r="38" fill={`url(#${gid})`}>
        {!reduce && <animate attributeName="r" values="38;41;38" dur="3s" repeatCount="indefinite" />}
      </circle>
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={core.length > 9 ? 8.5 : 11.5} fontWeight="800" fill="#0D0D0D" fontFamily="Montserrat, sans-serif">
        {core}
      </text>
    </svg>
  );
};

export default AutomationMap;
