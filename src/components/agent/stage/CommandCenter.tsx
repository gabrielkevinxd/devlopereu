import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { CAPABILITIES, CAP_BY_ID, GROUPS, PAIN_CAPS, adaptFlow, resolveCaps, type CapId, type IconId } from '../../../data/capabilities';
import { fill } from '../../../i18n';
import { useI18n } from '../../../i18n/context';
import { prefersReducedMotion, readStore, writeStore } from '../../../lib/storage';
import { Logo, maskUrl } from '../../brand/Logo';
import type { Action, AgentState } from '../useAgent';
import { layoutTags, shortName } from './labelLayout';
import './CommandCenter.css';

/**
 * MEGA BRAIN — centro de comando das capacidades de IA (carregado em lazy, só na fase «capacidades»).
 * Núcleo = logótipo neuronal real; à volta, os módulos do catálogo (src/data/capabilities.ts);
 * os ativados para o caso ligam-se ao núcleo por linhas de dados; o painel mostra o fluxo adaptado.
 */
const DEFAULT_ACTIVE: CapId[] = ['estrategia', 'agentes-autonomos', 'integracoes-mcp'];
const SOUND_KEY = 'dev-hud-sound';

const ICONS: Record<IconId, string> = {
  agent: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 2v3M12 19v3M2 12h3M19 12h3M10 12h4',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12zM8 12h.01M12 12h.01M16 12h.01',
  network: 'M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM5 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM19 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM11 6.5L6 16M13 6.5l5 9.5M7 18h10',
  docs: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h4',
  scan: 'M3 7V4h3M21 7V4h-3M3 17v3h3M21 17v3h-3M7 12h10M7 9h6M7 15h8',
  copilot: 'M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8zM5 21c1.5-3 4-4 7-4s5.5 1 7 4',
  plug: 'M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-10 0zM12 16v5',
  gears: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1',
  database: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  gauge: 'M4 18a8 8 0 1 1 16 0M12 18l4-6M8 18h8',
  pen: 'M4 20l4-1 11-11-3-3L5 16zM14 6l3 3',
  target: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  compass: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15.5 8.5l-2 5-5 2 2-5z',
};

export function Icon({ id, size = 20 }: { id: IconId; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[id]} />
    </svg>
  );
}

/** Pequeno «bip» sintetizado (sem ficheiros de áudio) — só com o som ligado pelo visitante. */
function blip() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ac = new Ctx();
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(1320, ac.currentTime + 0.06);
    g.gain.setValueAtTime(0.0001, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.04, ac.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.14);
    o.connect(g).connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + 0.15);
    o.onended = () => void ac.close();
  } catch {
    /* sem áudio: ignora */
  }
}

export default function CommandCenter({ state, act }: { state: AgentState; act: (a: Action) => void }) {
  const { t, lang } = useI18n();
  const h = t.hud;

  // Contexto do caso recolhido na conversa (LLM ou fluxo guiado).
  const ctx = useMemo(() => {
    const sectorItem = t.sectors.find((s) => s.id === state.sectorId);
    return {
      sector: state.profileX?.sector ?? sectorItem?.label,
      pain: state.profileX?.pain ?? t.pains.find((p) => p.id === state.painId)?.label,
      who: sectorItem?.who,
    };
  }, [state.profileX, state.sectorId, state.painId, t]);

  const active = useMemo(() => {
    const ids = resolveCaps(state.capsX?.ids ?? PAIN_CAPS[state.painId ?? ''] ?? []);
    return ids.length ? ids : DEFAULT_ACTIVE;
  }, [state.capsX, state.painId]);

  const [sel, setSel] = useState<CapId>(active[0]);
  const [picked, setPicked] = useState(false);
  const [step, setStep] = useState(0);
  const [clock, setClock] = useState('');
  const [sound, setSound] = useState(false);
  const [reduced, setReduced] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const reactorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReduced(prefersReducedMotion());
    setSound(readStore<boolean>(SOUND_KEY, false));
    const tick = () => setClock(new Intl.DateTimeFormat('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Lisbon' }).format(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!active.includes(sel) && !picked) setSel(active[0]);
  }, [active, sel, picked]);

  // Fluxo animado passo a passo (entrada → agente → ferramentas → resultado).
  useEffect(() => {
    if (reduced) return setStep(4);
    setStep(0);
    const id = window.setInterval(() => setStep((s) => (s >= 5 ? 0 : s + 1)), 1100);
    return () => window.clearInterval(id);
  }, [sel, reduced]);

  // Demonstração automática pelos módulos ativos até o visitante escolher um.
  useEffect(() => {
    if (picked || reduced || active.length < 2) return;
    const id = window.setInterval(() => setSel((s) => active[(active.indexOf(s) + 1) % active.length]), 7700);
    return () => window.clearInterval(id);
  }, [picked, reduced, active]);

  const choose = (id: CapId) => {
    setPicked(true);
    setSel(id);
    if (sound) blip();
    if (window.matchMedia('(max-width: 759px)').matches) panelRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
  };

  const cap = CAP_BY_ID.get(sel) ?? CAPABILITIES[0];
  const text = cap.text[lang];
  const on = active.includes(cap.id);
  const flow = state.capsX?.flows?.[cap.id] ?? adaptFlow(cap, lang, ctx);
  const reason = state.capsX?.reasons?.[cap.id];
  const n = CAPABILITIES.length;
  const pos = (i: number) => {
    const a = (-90 + (i * 360) / n) * (Math.PI / 180);
    return { x: 50 + 41 * Math.cos(a), y: 50 + 41 * Math.sin(a) };
  };
  // Etiquetas da órbita (módulos ativos + selecionado), colocadas sem colisões depois de medidas.
  const tagged = CAPABILITIES.map((c, i) => ({ c, i })).filter(({ c }) => active.includes(c.id) || c.id === sel);
  const tagKey = `${lang}|${tagged.map(({ c }) => c.id).join()}`;
  useLayoutEffect(() => {
    const root = reactorRef.current;
    if (!root) return;
    const run = () => layoutTags(root);
    run();
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(run) : null;
    ro?.observe(root);
    void document.fonts?.ready.then(run);
    return () => ro?.disconnect();
  }, [tagKey]);

  const lower = (s: string) => (lang === 'de' ? s : s.charAt(0).toLowerCase() + s.slice(1));
  const title = ctx.sector ? fill(h.title, { sector: lower(ctx.sector) }) : h.titleGeneric;

  return (
    <div className="mb">
      <header className="mb__head">
        <p className="mb__kicker mono">{h.kicker}</p>
        <h2>{title}</h2>
      </header>

      <ul className="mb__telemetry mono" aria-label={h.kicker}>
        <li>
          <span className="pulse" /> {h.online}
        </li>
        <li>
          {h.active} <b>{String(active.length).padStart(2, '0')}/{n}</b>
        </li>
        {(ctx.sector || ctx.pain) && (
          <li className="mb__ctx">
            {h.context} · <b>{[ctx.sector, ctx.pain].filter(Boolean).join(' · ')}</b>
          </li>
        )}
        <li>
          {h.mode} · <b>{h.demo}</b>
        </li>
        <li aria-hidden="true" className="mb__clock">
          {clock}
        </li>
        <li>
          <button
            type="button"
            className="mb__sound"
            aria-pressed={sound}
            onClick={() => {
              const v = !sound;
              setSound(v);
              writeStore(SOUND_KEY, v);
              if (v) blip();
            }}
          >
            {h.sound}: {sound ? h.on : h.off}
          </button>
        </li>
      </ul>

      <div className="mb__grid">
        <div className="mb__reactor" ref={reactorRef}>
          <svg className="mb__svg" viewBox="0 0 100 100" aria-hidden="true">
            <circle className="mb-ring mb-ring--ticks" cx="50" cy="50" r="48" />
            <circle className="mb-ring mb-ring--orbit" cx="50" cy="50" r="41" />
            <circle className="mb-ring mb-ring--dash" cx="50" cy="50" r="31" />
            <circle className="mb-ring mb-ring--inner" cx="50" cy="50" r="22" />
            {CAPABILITIES.map((c, i) => {
              if (!active.includes(c.id)) return null;
              const p = pos(i);
              return (
                <g key={c.id} className={`mb-link${c.id === sel ? ' is-sel' : ''}`}>
                  <line x1="50" y1="50" x2={p.x} y2={p.y} />
                  {!reduced && (
                    <circle r="0.9" className="mb-packet">
                      <animateMotion dur={`${1.6 + (i % 3) * 0.4}s`} repeatCount="indefinite" path={`M50,50 L${p.x},${p.y}`} />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          <div className="mb__core shimmer" style={{ '--mask': `url(${maskUrl('mark')})` } as CSSProperties} role="img" aria-label={h.core}>
            <Logo variant="mark" sizes="160px" alt="" />
          </div>

          {CAPABILITIES.map((c, i) => {
            const p = pos(i);
            const isOn = active.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                className={`mb-node${isOn ? ' is-on' : ''}${c.id === sel ? ' is-sel' : ''}`}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                aria-pressed={c.id === sel}
                aria-label={`${c.text[lang].name} — ${isOn ? t.caps.unlocked : t.caps.available}`}
                onClick={() => choose(c.id)}
              >
                <span className="mb-node__dot">
                  <Icon id={c.icon} />
                </span>
                <span className="mb-node__label">{c.text[lang].name}</span>
              </button>
            );
          })}

          {tagged.map(({ c, i }) => (
            <span key={c.id} className={`mb-tag mono${c.id === sel ? ' is-sel' : ''}`} data-i={i} data-name={c.text[lang].name} aria-hidden="true">
              <span className="mb-tag__full">{c.text[lang].name}</span>
              <span className="mb-tag__short">{shortName(c.text[lang].name)}</span>
            </span>
          ))}
        </div>

        <section className="mb-panel" ref={panelRef} aria-live="polite" key={cap.id}>
          <div className="mb-panel__head">
            <span className={`mb-panel__icon${on ? ' is-on' : ''}`}>
              <Icon id={cap.icon} size={24} />
            </span>
            <div>
              <p className="mb-panel__meta mono">
                {GROUPS[cap.group][lang]} · <span className={on ? 'is-on' : ''}>{on ? `◆ ${t.caps.unlocked}` : `◇ ${t.caps.available}`}</span>
              </p>
              <h3>{text.name}</h3>
            </div>
          </div>
          <p className="mb-panel__tagline">{text.tagline}</p>
          {reason && (
            <p className="mb-panel__why">
              <strong>{t.caps.why}:</strong> {reason}
            </p>
          )}
          <p className="mb-panel__how">
            <strong>{h.how}:</strong> {text.how}
          </p>

          <p className="mb-panel__flowtitle mono">{h.flowTitle}</p>
          <ol className="mb-flow" data-step={step}>
            {flow.map((s, i) => (
              <li key={`${cap.id}-${i}`} className={`mb-flow__step${step === i ? ' is-active' : ''}${step > i ? ' is-done' : ''}`}>
                <span className="mb-flow__label mono">
                  {String(i + 1).padStart(2, '0')} · {h.steps[i]}
                </span>
                <span className="mb-flow__text">{s}</span>
              </li>
            ))}
          </ol>
          <p className="mb-panel__note">{h.illustrative}</p>
          <button type="button" className="btn btn--gold btn--block" onClick={() => act({ type: 'book' })}>
            {h.cta}
          </button>
          <p className="mb-panel__hint">{h.hint}</p>
        </section>
      </div>
    </div>
  );
}
