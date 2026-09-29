import { useEffect, useMemo, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { CASE_STUDIES, CONTACT, SOCIAL } from '../../config';
import type { Capability, GroupId } from '../../data/capabilities';
import { catalog } from '../../data/catalog';
import { LANGS, fill } from '../../i18n';
import { useI18n } from '../../i18n/context';
import { useAppState } from '../../lib/app-state';
import { pathFor } from '../../routes';
import { Icon } from '../brand/CapIcon';
import { Logo } from '../brand/Logo';
import { BookingForm } from '../booking/BookingForm';
import './ClassicView.css';

/** Grupos pela ordem do catálogo, cada um com as suas capacidades (nada escrito à mão). */
const byGroup = (caps: Capability[]) =>
  caps.reduce<{ id: GroupId; caps: Capability[] }[]>((acc, c) => {
    const g = acc.find((x) => x.id === c.group);
    if (g) g.caps.push(c);
    else acc.push({ id: c.group, caps: [c] });
    return acc;
  }, []);

function SectionHead({ id, n, tag, title, lead, children }: { id: string; n: number; tag: string; title: string; lead?: string; children?: ReactNode }) {
  return (
    <div className="shead">
      <div>
        <p className="shead__tag mono">
          {String(n).padStart(2, '0')} · {tag}
        </p>
        <h2 id={id}>{title}</h2>
      </div>
      {(lead || children) && (
        <div className="shead__lead">
          {lead && <p>{lead}</p>}
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Modo clássico: o mesmo conteúdo como documento legível (e indexável).
 * Sempre pré-renderizado; visível sem JavaScript ou quando o visitante escolhe «Navegar».
 */
export function ClassicView({ hidden }: { hidden: boolean }) {
  const { t, lang } = useI18n();
  const { setMode, bookNonce, mode, showCap } = useAppState();
  const c = t.classic;
  const home = pathFor(lang, 'home');
  const { CAPABILITIES, GROUPS } = catalog();
  const BY_GROUP = useMemo(() => byGroup(CAPABILITIES), [CAPABILITIES]);

  useEffect(() => {
    if (bookNonce > 0 && mode === 'read') document.getElementById('agendar')?.scrollIntoView({ behavior: 'smooth' });
  }, [bookNonce, mode]);

  const toAgent = (e?: MouseEvent) => {
    e?.preventDefault();
    setMode('chat');
  };
  const facts: [string, string][] = [
    [c.facts.founded, String(CONTACT.foundingYear)],
    [c.facts.base, 'Braga, Portugal'],
    [c.facts.languages, `${LANGS.length} · ${LANGS.map((l) => l.toUpperCase()).join(' ')}`],
    [c.facts.capabilities, String(CAPABILITIES.length)],
    [c.facts.compliance, c.facts.complianceValue],
  ];

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
            <a className="btn" href="#c-services">
              {c.servicesTitle} ↓
            </a>
          </div>
        </div>

        {/* Ponte para o modo agente: a abertura REAL do agente, no mesmo material do palco. */}
        <aside className="preview" aria-labelledby="c-preview">
          <div className="preview__bar mono" aria-hidden="true">
            <i />
            <i />
            <i />
            <span>devlopereu.com/agente</span>
          </div>
          <div className="preview__body">
            <div className="preview__who">
              <Logo variant="mark" sizes="44px" alt="" className="preview__mark" />
              <p>
                <strong id="c-preview">{t.ui.agent}</strong>
                <span className="mono">
                  <span className="pulse" /> {t.ui.status}
                </span>
              </p>
            </div>
            <p className="preview__msg preview__msg--title">{t.chat.intro}</p>
            <p className="preview__msg">{t.chat.introSub}</p>
            <a className="btn btn--gold btn--block" href={home} onClick={toAgent}>
              {c.ctaSecondary} →
            </a>
          </div>
        </aside>
      </header>

      <section className="classic__section" id="c-services" aria-labelledby="c-services-t">
        <SectionHead id="c-services-t" n={1} tag={c.tags[0]} title={c.servicesTitle} lead={fill(c.servicesLead, { groups: BY_GROUP.length })} />
        <div className="caps">
          {BY_GROUP.map((g) => (
            <section key={g.id} className="caps__group" aria-labelledby={`c-g-${g.id}`}>
              <h3 id={`c-g-${g.id}`} className="caps__title">
                {GROUPS[g.id][lang]} <span className="mono">{String(g.caps.length).padStart(2, '0')}</span>
              </h3>
              <ul className="caps__list" data-count={g.caps.length}>
                {g.caps.map((cap) => (
                  <li key={cap.id} className="cap">
                    <span className="cap__icon">
                      <Icon id={cap.icon} size={22} />
                    </span>
                    <h4>{cap.text[lang].name}</h4>
                    <p>{cap.text[lang].tagline}</p>
                    <a
                      className="cap__cta"
                      href={`${home}?cap=${cap.id}`}
                      aria-label={`${c.servicesCta} — ${cap.text[lang].name}`}
                      onClick={(e) => {
                        e.preventDefault();
                        showCap(cap.id);
                      }}
                    >
                      {c.servicesCta}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className="caps__more">
          <p>{c.servicesMore}</p>
          <a className="btn btn--gold" href="#agendar">
            {c.ctaPrimary}
          </a>
        </div>
      </section>

      <section className="classic__section classic__band" aria-labelledby="c-process">
        <SectionHead id="c-process" n={2} tag={c.tags[1]} title={c.processTitle} lead={fill(c.processLead, { n: c.process.length })} />
        <ol className="steps" style={{ '--n': c.process.length } as CSSProperties}>
          {c.process.map((p, i) => (
            <li key={p.t}>
              <span className="steps__n mono">{String(i + 1).padStart(2, '0')}</span>
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

      <section className="classic__section about" aria-labelledby="c-about">
        <div className="about__text">
          <p className="shead__tag mono">03 · {c.tags[2]}</p>
          <h2 id="c-about">{c.aboutTitle}</h2>
          {c.about.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <dl className="facts">
          {facts.map(([k, v]) => (
            <div key={k}>
              <dt className="mono">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="classic__section faq" aria-labelledby="c-faq">
        <div className="faq__side">
          <p className="shead__tag mono">04 · {c.tags[3]}</p>
          <h2 id="c-faq">{c.faqTitle}</h2>
          <p className="faq__ask">{c.faqAsk}</p>
          <a className="btn" href={home} onClick={toAgent}>
            {c.faqAskCta} →
          </a>
        </div>
        <div className="faq__list">
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
          <p className="shead__tag mono">05 · {c.tags[4]}</p>
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
