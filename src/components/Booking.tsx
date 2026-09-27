import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Mail, MessageCircle, Sparkles } from 'lucide-react';
import { Eyebrow, Reveal, SectionTitle } from './ui';
import { CALENDAR_URL, MEETING_SLOTS, WHATSAPP_DISPLAY } from '../config';
import { buildMessage, isoDay, mailUrl, nextBusinessDays, useDiagnostic, whatsappUrl } from '../lib/booking';

export const TOPIC_EVENT = 'devloper:topic';

const inputCls =
  'w-full rounded-lg bg-primary border border-white/25 px-4 py-3 min-h-[48px] text-white placeholder:text-gray-light/60 focus:outline focus:outline-2 focus:outline-gold';

const Booking: React.FC = () => {
  const { t, i18n } = useTranslation();
  const diag = useDiagnostic();
  const days = useMemo(() => nextBusinessDays(), []);
  const fmt = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { weekday: 'short', day: 'numeric', month: 'short' }),
    [i18n.language],
  );
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [day, setDay] = useState('');
  const [time, setTime] = useState('');
  const [f, setF] = useState({ name: '', email: '', phone: '', company: '', topic: '' });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const headRef = useRef<HTMLHeadingElement>(null);
  const prevStep = useRef<number>(1);

  useEffect(() => {
    const h = (e: Event) => setF((c) => ({ ...c, topic: (e as CustomEvent<string>).detail }));
    window.addEventListener(TOPIC_EVENT, h);
    return () => window.removeEventListener(TOPIC_EVENT, h);
  }, []);
  useEffect(() => {
    if (prevStep.current === step) return;
    prevStep.current = step;
    headRef.current?.focus({ preventScroll: true });
  }, [step]);

  const dayLabel = day ? fmt.format(days.find((d) => isoDay(d) === day)!) : '';

  const goStep2 = () => {
    if (!day || !time) return setErrors({ when: t('v2.book.errDay') });
    setErrors({});
    setStep(2);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = t('v2.book.errName');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) er.email = t('v2.book.errEmail');
    if (!consent) er.consent = t('v2.book.errConsent');
    setErrors(er);
    if (Object.keys(er).length) return;
    const text = buildMessage({ ...f, dayLabel: `${dayLabel} (${day})`, time }, diag);
    setMsg(text);
    setStep(3);
    window.open(whatsappUrl(text), '_blank', 'noopener,noreferrer');
  };

  const field = (k: keyof typeof f, label: string, type = 'text', auto?: string) => (
    <div>
      <label htmlFor={`bk-${k}`} className="block font-bold mb-1.5">{label}</label>
      <input
        id={`bk-${k}`}
        type={type}
        autoComplete={auto}
        value={f[k]}
        onChange={(e) => setF({ ...f, [k]: e.target.value })}
        aria-invalid={!!errors[k]}
        aria-describedby={errors[k] ? `bk-${k}-e` : undefined}
        className={inputCls}
      />
      {errors[k] && <p id={`bk-${k}-e`} role="alert" className="mt-1 text-sm text-red-300">{errors[k]}</p>}
    </div>
  );

  return (
    <section id="agendar" aria-labelledby="h-book" className="section relative">
      <div className="max-w-7xl mx-auto grid gap-10 lg:grid-cols-[0.9fr_1.1fr] items-start">
        <Reveal>
          <Eyebrow>{t('v2.eyebrow.book')}</Eyebrow>
          <SectionTitle id="h-book">{t('v2.book.title')}</SectionTitle>
          <p className="mt-5 text-lg text-gray-light max-w-md">{t('v2.book.intro')}</p>
          <p className="mt-8 font-bold">{t('v2.book.direct')}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-gold/60 px-5 py-3 min-h-[48px] text-gold hover:bg-gold/10">
              <MessageCircle size={18} aria-hidden="true" /> {WHATSAPP_DISPLAY}
            </a>
            {CALENDAR_URL && (
              <a href={CALENDAR_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 min-h-[48px] font-bold text-primary">
                <CalendarDays size={18} aria-hidden="true" /> {t('v2.book.calendar')}
              </a>
            )}
          </div>
          {diag && (
            <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold/10 border border-gold/30 px-4 py-2 text-sm text-gold">
              <Sparkles size={16} aria-hidden="true" /> {t('v2.book.diagIncluded')} · {diag.tier}
            </p>
          )}
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-3xl border border-gold/25 bg-black/60 backdrop-blur p-5 sm:p-8">
            {step === 1 && (
              <div>
                <h3 ref={headRef} tabIndex={-1} className="font-anton text-2xl sm:text-3xl outline-none">{t('v2.book.s1')}</h3>
                <fieldset className="mt-5">
                  <legend className="font-bold mb-2">{t('v2.book.day')}</legend>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {days.map((d) => {
                      const v = isoDay(d);
                      return (
                        <label key={v} className={`cursor-pointer rounded-lg border px-3 py-3 min-h-[48px] text-center capitalize text-sm transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-gold ${day === v ? 'border-gold bg-gold text-primary font-bold' : 'border-white/20 hover:border-gold/60'}`}>
                          <input type="radio" name="day" value={v} checked={day === v} onChange={() => setDay(v)} className="sr-only" />
                          {fmt.format(d)}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <fieldset className="mt-5">
                  <legend className="font-bold mb-2">{t('v2.book.time')}</legend>
                  <div className="flex flex-wrap gap-2">
                    {MEETING_SLOTS.map((s) => (
                      <label key={s} className={`cursor-pointer rounded-lg border px-4 py-3 min-h-[48px] text-sm transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-gold ${time === s ? 'border-gold bg-gold text-primary font-bold' : 'border-white/20 hover:border-gold/60'}`}>
                        <input type="radio" name="time" value={s} checked={time === s} onChange={() => setTime(s)} className="sr-only" />
                        {s}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <p className="mt-3 text-sm text-gray-light/80">{t('v2.book.slotsNote')}</p>
                <p role="alert" className="mt-2 min-h-[1.5rem] text-red-300">{errors.when}</p>
                <button type="button" onClick={goStep2} className="mt-2 rounded-full bg-gold px-7 py-3 min-h-[48px] font-bold text-primary">{t('v2.book.next')}</button>
              </div>
            )}

            {step === 2 && (
              <form onSubmit={submit} noValidate className="space-y-4">
                <h3 ref={headRef} tabIndex={-1} className="font-anton text-2xl sm:text-3xl outline-none">{t('v2.book.s2')}</h3>
                <p className="text-gray-light">{dayLabel} · {time}</p>
                {field('name', t('v2.book.name'), 'text', 'name')}
                {field('email', t('v2.book.email'), 'email', 'email')}
                {field('phone', t('v2.book.phone'), 'tel', 'tel')}
                {field('company', t('v2.book.company'), 'text', 'organization')}
                <div>
                  <label htmlFor="bk-topic" className="block font-bold mb-1.5">{t('v2.book.topic')}</label>
                  <textarea id="bk-topic" rows={3} value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="flex gap-3 items-start cursor-pointer text-sm text-gray-light">
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} aria-invalid={!!errors.consent} aria-describedby={errors.consent ? 'bk-consent-e' : undefined} className="mt-1 h-5 w-5 accent-[#D4AF37]" />
                    <span>{t('v2.book.consent')} <Link to="/privacy-policy" className="text-gold underline">{t('v2.book.privacy')}</Link></span>
                  </label>
                  {errors.consent && <p id="bk-consent-e" role="alert" className="mt-1 text-sm text-red-300">{errors.consent}</p>}
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button type="button" onClick={() => setStep(1)} className="rounded-full border border-white/20 px-5 py-3 min-h-[48px] hover:border-gold">{t('v2.book.back')}</button>
                  <button type="submit" className="rounded-full bg-gold px-7 py-3 min-h-[48px] font-bold text-primary">{t('v2.book.send')}</button>
                </div>
              </form>
            )}

            {step === 3 && (
              <div role="status">
                <h3 ref={headRef} tabIndex={-1} className="font-anton text-2xl sm:text-3xl outline-none">{t('v2.book.doneTitle')}</h3>
                <p className="mt-3 text-gray-light">{t('v2.book.doneText')}</p>
                <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-primary border border-white/15 p-4 text-sm text-gray-light">{msg}</pre>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a href={whatsappUrl(msg)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 min-h-[48px] font-bold text-primary">
                    <MessageCircle size={18} aria-hidden="true" /> {t('v2.book.wa')}
                  </a>
                  <a href={mailUrl('Pedido de reunião — DevloperEU', msg)} className="inline-flex items-center gap-2 rounded-full border border-gold/60 px-6 py-3 min-h-[48px] text-gold hover:bg-gold/10">
                    <Mail size={18} aria-hidden="true" /> {t('v2.book.mail')}
                  </a>
                  <button type="button" onClick={() => { setStep(1); setDay(''); setTime(''); setConsent(false); }} className="rounded-full border border-white/20 px-5 py-3 min-h-[48px] hover:border-gold">{t('v2.book.again')}</button>
                </div>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default Booking;
