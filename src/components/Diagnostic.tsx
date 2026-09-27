import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import AutomationMap from './AutomationMap';
import { BookButton, Eyebrow, Reveal, SectionTitle } from './ui';
import { diagnosticStore } from '../lib/booking';

const AREAS = ['support', 'sales', 'ops', 'data', 'software'] as const;
const SYSTEMS = ['few', 'several', 'legacy'] as const;
const URGENCY = ['now', 'plan', 'explore'] as const;

type Tier = 'pilot' | 'integrated' | 'program';

export function computeTier(areas: number, systems: (typeof SYSTEMS)[number]): Tier {
  const score = areas + SYSTEMS.indexOf(systems) + 1;
  if (score <= 3) return 'pilot';
  if (score <= 5) return 'integrated';
  return 'program';
}

const Diagnostic: React.FC = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0); // 0..2 perguntas, 3 resultado
  const [areas, setAreas] = useState<string[]>([]);
  const [systems, setSystems] = useState<(typeof SYSTEMS)[number] | ''>('');
  const [urgency, setUrgency] = useState<(typeof URGENCY)[number] | ''>('');
  const [error, setError] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const prevStep = useRef(0);

  useEffect(() => {
    if (prevStep.current === step) return; // ignora a montagem (e o duplo efeito do StrictMode)
    prevStep.current = step;
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const modules = areas.map((a) => t(`v2.diag.areas.${a}.module`));
  const tier: Tier = computeTier(areas.length, (systems || 'few') as (typeof SYSTEMS)[number]);

  const next = () => {
    if (step === 0 && areas.length === 0) return setError(t('v2.diag.needOne'));
    setError('');
    if (step === 2) {
      diagnosticStore.set({
        areas: modules,
        systems: t(`v2.diag.systems.${systems || 'few'}`),
        urgency: t(`v2.diag.urgency.${urgency || 'explore'}`),
        tier: t(`v2.diag.tiers.${tier}.name`),
      });
    }
    setStep((s) => s + 1);
  };
  const restart = () => {
    diagnosticStore.set(null);
    setAreas([]);
    setSystems('');
    setUrgency('');
    setStep(0);
  };

  const radio = (name: string, opts: readonly string[], value: string, set: (v: never) => void, tk: string) => (
    <div className="grid gap-3 sm:grid-cols-3">
      {opts.map((o) => (
        <label
          key={o}
          className={`cursor-pointer rounded-xl border p-4 min-h-[64px] flex items-center transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-gold ${
            value === o ? 'border-gold bg-gold/10 text-white' : 'border-white/15 text-gray-light hover:border-gold/50'
          }`}
        >
          <input
            type="radio"
            name={name}
            value={o}
            checked={value === o}
            onChange={() => set(o as never)}
            className="sr-only"
          />
          {t(`${tk}.${o}`)}
        </label>
      ))}
    </div>
  );

  return (
    <section id="diagnostico" aria-labelledby="h-diag" className="section relative">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <Eyebrow>{t('v2.eyebrow.diagnostic')}</Eyebrow>
          <SectionTitle id="h-diag">{t('v2.diag.title')}</SectionTitle>
          <p className="mt-5 max-w-2xl text-lg text-gray-light">{t('v2.diag.intro')}</p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-10 rounded-3xl border border-gold/25 bg-black/50 backdrop-blur p-5 sm:p-10 shadow-[0_0_80px_-30px_rgba(212,175,55,0.35)]">
            {step < 3 ? (
              <form onSubmit={(e) => { e.preventDefault(); next(); }} noValidate>
                <div className="flex items-center gap-3 mb-6" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-gold' : 'bg-white/15'}`} />
                  ))}
                </div>
                <p className="text-sm font-bold uppercase tracking-widest text-gold">{t('v2.diag.step', { n: step + 1 })}</p>
                <h3 ref={headingRef} tabIndex={-1} className="mt-2 mb-6 font-anton text-2xl sm:text-4xl outline-none">
                  {t(`v2.diag.q${step + 1}`)}
                </h3>

                {step === 0 && (
                  <fieldset>
                    <legend className="sr-only">{t('v2.diag.q1')}</legend>
                    <p className="text-gray-light mb-4">{t('v2.diag.q1hint')}</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {AREAS.map((a) => {
                        const on = areas.includes(a);
                        return (
                          <label
                            key={a}
                            className={`cursor-pointer rounded-xl border p-4 min-h-[64px] flex items-center gap-3 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-gold ${
                              on ? 'border-gold bg-gold/10 text-white' : 'border-white/15 text-gray-light hover:border-gold/50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => setAreas((c) => (on ? c.filter((x) => x !== a) : [...c, a]))}
                              className="sr-only"
                            />
                            <span aria-hidden="true" className={`grid place-items-center h-5 w-5 rounded border ${on ? 'bg-gold border-gold text-primary' : 'border-white/40'}`}>
                              {on && '✓'}
                            </span>
                            {t(`v2.diag.areas.${a}.label`)}
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                )}
                {step === 1 && (
                  <fieldset>
                    <legend className="sr-only">{t('v2.diag.q2')}</legend>
                    {radio('systems', SYSTEMS, systems, setSystems as (v: never) => void, 'v2.diag.systems')}
                  </fieldset>
                )}
                {step === 2 && (
                  <fieldset>
                    <legend className="sr-only">{t('v2.diag.q3')}</legend>
                    {radio('urgency', URGENCY, urgency, setUrgency as (v: never) => void, 'v2.diag.urgency')}
                  </fieldset>
                )}

                <p role="alert" className="mt-4 min-h-[1.5rem] text-red-300">{error}</p>
                <div className="mt-4 flex flex-wrap gap-3 justify-between">
                  {step > 0 ? (
                    <button type="button" onClick={() => setStep(step - 1)} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 min-h-[48px] text-white hover:border-gold">
                      <ArrowLeft size={18} aria-hidden="true" /> {t('v2.diag.back')}
                    </button>
                  ) : <span />}
                  <button
                    type="submit"
                    disabled={(step === 1 && !systems) || (step === 2 && !urgency)}
                    className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 min-h-[48px] font-bold text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {t('v2.diag.next')} <ArrowRight size={18} aria-hidden="true" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] items-center">
                <AutomationMap
                  modules={modules}
                  core={t('v2.diag.core')}
                  compact
                  label={t('v2.diag.graphLabel', { count: modules.length })}
                />
                <div>
                  <h3 ref={headingRef} tabIndex={-1} className="font-anton text-2xl sm:text-4xl outline-none">{t('v2.diag.result')}</h3>
                  <ol className="mt-4 space-y-2">
                    {modules.map((m, i) => (
                      <li key={m} className="flex gap-3 text-gray-light">
                        <span className="grid place-items-center h-6 w-6 shrink-0 rounded-full border border-gold text-gold text-sm font-bold" aria-hidden="true">{i + 1}</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-6 rounded-xl border border-gold/30 bg-gold/5 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-gold">{t('v2.diag.scope')}</p>
                    <p className="font-anton text-2xl mt-1">{t(`v2.diag.tiers.${tier}.name`)}</p>
                    <p className="text-gray-light mt-1">{t(`v2.diag.tiers.${tier}.desc`)}</p>
                  </div>
                  <p className="mt-4 text-gray-light">{t('v2.diag.investment')}</p>
                  <p className="mt-1 text-sm text-gray-light/80">{t('v2.diag.disclaimer')}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <BookButton label={t('v2.diag.book')} />
                    <button type="button" onClick={restart} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 min-h-[48px] hover:border-gold">
                      <RotateCcw size={16} aria-hidden="true" /> {t('v2.diag.restart')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default Diagnostic;
