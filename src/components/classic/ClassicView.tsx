import { useEffect } from 'react';
import { CASE_STUDIES, CONTACT, SOCIAL } from '../../config';
import { useI18n } from '../../i18n/context';
import { useAppState } from '../../lib/app-state';
import { pathFor } from '../../routes';
import { Logo } from '../brand/Logo';
import { BookingForm } from '../booking/BookingForm';
import './ClassicView.css';

/**
 * Modo clássico: o mesmo conteúdo como documento legível (e indexável).
 * Sempre pré-renderizado; visível sem JavaScript ou quando o visitante escolhe «Navegar».
 */
export function ClassicView({ hidden }: { hidden: boolean }) {
  const { t, lang } = useI18n();
  const { setMode, bookNonce, mode } = useAppState();
  const c = t.classic;

  useEffect(() => {
    if (bookNonce > 0 && mode === 'read') document.getElementById('agendar')?.scrollIntoView({ behavior: 'smooth' });
  }, [bookNonce, mode]);

  return (
    <article className="classic" hidden={hidden}>
      <header className="classic__hero">
        <div className="classic__hero-text">
          <p className="classic__eyebrow mono">{c.eyebrow}</p>
          <h1>{c.h1}</h1>
          <p className="classic__lead">{c.lead}</p>
          <div className="classic__ctas">
            <a className="btn btn--gold" href="#agendar">
              {c.ctaPrimary}
            </a>
            <button type="button" className="btn" onClick={() => setMode('chat')}>
              {c.ctaSecondary}
            </button>
          </div>
        </div>
        <Logo variant="stacked" sizes="(min-width: 900px) 340px, 60vw" alt={t.meta.ogAlt} className="classic__logo" />
      </header>

      <section className="classic__section" aria-labelledby="c-services">
        <h2 id="c-services">{c.servicesTitle}</h2>
        <p className="classic__sub">{c.servicesLead}</p>
        <ul className="classic__services">
          {t.services.map((s, i) => (
            <li key={s.id}>
              <span className="mono classic__num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{s.name}</h3>
              <p>{s.short}</p>
              <ul>
                {s.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section className="classic__section" aria-labelledby="c-process">
        <h2 id="c-process">{c.processTitle}</h2>
        <ol className="classic__process">
          {c.process.map((p, i) => (
            <li key={p.t}>
              <span className="mono classic__num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{p.t}</h3>
              <p>{p.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {CASE_STUDIES.length > 0 && (
        <section className="classic__section">
          {/* TODO(dono): casos reais aprovados pelo cliente — ver src/config.ts */}
          <ul>
            {CASE_STUDIES.map((cs) => (
              <li key={cs.client}>
                {cs.client}: {cs.result}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="classic__section classic__about" aria-labelledby="c-about">
        <h2 id="c-about">{c.aboutTitle}</h2>
        {c.about.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </section>

      <section className="classic__section" aria-labelledby="c-faq">
        <h2 id="c-faq">{c.faqTitle}</h2>
        <div className="classic__faq">
          {t.faq.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="classic__section classic__book" id="agendar" aria-labelledby="c-book">
        <div className="classic__book-intro">
          <h2 id="c-book">{c.bookingTitle}</h2>
          <p>{c.bookingLead}</p>
          <div className="classic__magnet">
            <p>
              <strong>{t.magnet.title}</strong>
            </p>
            <a href={pathFor(lang, 'checklist')}>{t.magnet.cta} →</a>
          </div>
          <address className="classic__contact">
            <strong>{c.contactTitle}</strong>
            <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noopener">
              WhatsApp · {CONTACT.phoneDisplay}
            </a>
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            <a href={SOCIAL.instagram} target="_blank" rel="noopener">
              Instagram @devlopereu
            </a>
          </address>
        </div>
        <div className="classic__book-form">
          <BookingForm idPrefix="cl" />
        </div>
      </section>
    </article>
  );
}
