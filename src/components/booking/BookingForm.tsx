import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { CALENDAR_URL } from '../../config';
import { fill } from '../../i18n';
import { useI18n } from '../../i18n/context';
import type { AiBooking } from '../agent/useAgent';
import { useAppState } from '../../lib/app-state';
import { pathFor } from '../../routes';
import { track } from '../consent/pixel';
import {
  TIMES,
  composeMessage,
  dayKey,
  formatDay,
  isValidContact,
  mailtoUrl,
  nextWorkdays,
  whatsappUrl,
  type CaseSummary,
} from './booking';
import './BookingForm.css';

export type BookVia = 'whatsapp' | 'email' | 'calendar';

interface Props {
  idPrefix: string;
  caseSummary?: CaseSummary;
  caseText?: string;
  /** pré-preenchimento vindo do agente (open_booking) — o visitante confirma sempre */
  prefill?: AiBooking;
  onDone?: (via: BookVia) => void;
}

type Field = 'day' | 'time' | 'name' | 'contact' | 'consent';

export function BookingForm({ idPrefix, caseSummary, caseText, prefill, onDone }: Props) {
  const { t, lang } = useI18n();
  const { markBooked } = useAppState();
  const b = t.booking;
  // Datas só no cliente: o HTML pré-renderizado não pode fixar «amanhã».
  const [days, setDays] = useState<Date[] | null>(null);
  const [day, setDay] = useState('');
  const [time, setTime] = useState(prefill?.time && (TIMES as readonly string[]).includes(prefill.time) ? prefill.time : '');
  const [name, setName] = useState(prefill?.name ?? '');
  const [company, setCompany] = useState(prefill?.company ?? '');
  const [contact, setContact] = useState(prefill?.contact ?? '');
  const [notes, setNotes] = useState(prefill?.notes ?? '');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Field[]>([]);
  const [sent, setSent] = useState<BookVia | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const list = nextWorkdays(10);
    setDays(list);
    if (prefill?.day && list.some((d) => dayKey(d) === prefill.day)) setDay(prefill.day);
  }, [prefill?.day]);

  const dayLabel = useMemo(() => {
    const d = days?.find((x) => dayKey(x) === day);
    return d ? formatDay(d, lang) : '';
  }, [days, day, lang]);

  const message = composeMessage(t, {
    day: dayLabel || '—',
    time: time || '—',
    name: name || '—',
    company,
    contact: contact || '—',
    notes,
    caseSummary,
    caseText,
  });

  const validate = (): Field[] => {
    const e: Field[] = [];
    if (!day) e.push('day');
    if (!time) e.push('time');
    if (!name.trim()) e.push('name');
    if (!isValidContact(contact)) e.push('contact');
    if (!consent) e.push('consent');
    return e;
  };

  const submit = (via: BookVia) => (ev?: FormEvent) => {
    ev?.preventDefault();
    const e = validate();
    setErrors(e);
    if (e.length) {
      formRef.current?.querySelector<HTMLElement>(`[data-field="${e[0]}"]`)?.focus();
      return;
    }
    if (via === 'whatsapp') window.open(whatsappUrl(message), '_blank', 'noopener');
    if (via === 'email') window.location.href = mailtoUrl(fill(b.message.subject, { day: dayLabel, time }), message);
    if (via === 'calendar') window.open(CALENDAR_URL, '_blank', 'noopener');
    track(via === 'calendar' ? 'Schedule' : 'Lead', { method: via });
    setSent(via);
    markBooked();
    onDone?.(via);
  };

  const err = (f: Field) => errors.includes(f);
  const id = (s: string) => `${idPrefix}-${s}`;

  return (
    <form ref={formRef} className="book" onSubmit={submit('whatsapp')} noValidate aria-labelledby={id('title')}>
      <header className="book__head">
        <h2 id={id('title')} className="book__title">
          {b.title}
        </h2>
        <p className="book__meta mono">{b.duration}</p>
      </header>

      <fieldset className="book__set">
        <legend>{b.day}</legend>
        <div className="book__chips book__chips--days">
          {days == null
            ? Array.from({ length: 10 }, (_, i) => <span key={i} className="chip chip--ghost" aria-hidden="true" />)
            : days.map((d, i) => {
                const k = dayKey(d);
                return (
                  <label key={k} className="chip">
                    <input
                      type="radio"
                      name={id('day')}
                      value={k}
                      checked={day === k}
                      onChange={() => setDay(k)}
                      data-field={i === 0 ? 'day' : undefined}
                    />
                    <span>{formatDay(d, lang, 'short')}</span>
                  </label>
                );
              })}
        </div>
        {err('day') && <p className="book__err">{b.errors.day}</p>}
      </fieldset>

      <fieldset className="book__set">
        <legend>{b.time}</legend>
        <div className="book__chips">
          {TIMES.map((tm, i) => (
            <label key={tm} className="chip chip--time">
              <input
                type="radio"
                name={id('time')}
                value={tm}
                checked={time === tm}
                onChange={() => setTime(tm)}
                data-field={i === 0 ? 'time' : undefined}
              />
              <span className="mono">{tm}</span>
            </label>
          ))}
        </div>
        {err('time') && <p className="book__err">{b.errors.time}</p>}
      </fieldset>

      <div className="book__fields">
        <div className="field">
          <label htmlFor={id('name')}>{b.name}</label>
          <input
            id={id('name')}
            data-field="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={err('name')}
            required
          />
          {err('name') && <p className="book__err">{b.errors.name}</p>}
        </div>
        <div className="field">
          <label htmlFor={id('company')}>{b.company}</label>
          <input id={id('company')} autoComplete="organization" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor={id('contact')}>{b.contact}</label>
          <input
            id={id('contact')}
            data-field="contact"
            autoComplete="email"
            inputMode="email"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            aria-invalid={err('contact')}
            aria-describedby={id('contact-hint')}
            required
          />
          <p id={id('contact-hint')} className="field__hint">
            {b.contactHint}
          </p>
          {err('contact') && <p className="book__err">{b.errors.contact}</p>}
        </div>
        <div className="field">
          <label htmlFor={id('notes')}>{b.notes}</label>
          <input id={id('notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      <div className="book__preview" aria-live="polite">
        <p className="book__preview-title mono">{b.preview}</p>
        <pre className="mono">{message}</pre>
      </div>

      <label className="consent">
        <input
          type="checkbox"
          data-field="consent"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          aria-invalid={err('consent')}
        />
        <span>
          {b.consent} <a href={pathFor(lang, 'privacy')}>{b.consentLink}</a>.
        </span>
      </label>
      {err('consent') && <p className="book__err">{b.errors.consent}</p>}

      <div className="book__actions">
        <button type="submit" className="btn btn--gold">
          {b.whatsapp}
        </button>
        <button type="button" className="btn" onClick={submit('email')}>
          {b.email}
        </button>
        {CALENDAR_URL && (
          <button type="button" className="btn" onClick={submit('calendar')}>
            {b.calendar}
          </button>
        )}
      </div>

      {sent && (
        <p className="book__done" role="status">
          <strong>{b.done}.</strong> {b.doneBody}
        </p>
      )}
    </form>
  );
}
