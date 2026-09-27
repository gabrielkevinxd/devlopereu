import { CONTACT, SOCIAL } from '../../config';
import { LANGS, LANG_NAMES } from '../../i18n';
import { useI18n } from '../../i18n/context';
import { pathFor, type Page } from '../../routes';
import { Logo } from '../brand/Logo';
import { useConsent } from '../consent/ConsentProvider';
import './Footer.css';

export function Footer({ page }: { page: Page }) {
  const { t, lang } = useI18n();
  const { reopen } = useConsent();
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <Logo variant="light" sizes="(min-width: 900px) 260px, 200px" alt="DevloperEU" />
          <p>{t.footer.tagline}</p>
        </div>

        <nav className="footer__col" aria-label={t.footer.contact}>
          <h2>{t.footer.contact}</h2>
          <a href={`https://wa.me/${CONTACT.whatsapp}`} rel="noopener" target="_blank">
            WhatsApp
          </a>
          <a href={`tel:${CONTACT.phoneE164}`}>{CONTACT.phoneDisplay}</a>
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          <span>Braga, Portugal</span>
        </nav>

        <nav className="footer__col" aria-label={t.footer.follow}>
          <h2>{t.footer.follow}</h2>
          <a href={SOCIAL.instagram} rel="noopener me" target="_blank">
            Instagram
          </a>
          <a href={SOCIAL.x} rel="noopener me" target="_blank">
            X
          </a>
          <a href={SOCIAL.facebook} rel="noopener me" target="_blank">
            Facebook
          </a>
          <a href={SOCIAL.github} rel="noopener me" target="_blank">
            GitHub
          </a>
        </nav>

        <nav className="footer__col" aria-label={t.footer.legal}>
          <h2>{t.footer.legal}</h2>
          <a href={pathFor(lang, 'privacy')}>{t.legal.privacy.title}</a>
          <a href={pathFor(lang, 'cookies')}>{t.legal.cookies.title}</a>
          <a href={pathFor(lang, 'terms')}>{t.legal.terms.title}</a>
          <a href={pathFor(lang, 'checklist')}>{t.magnet.cta}</a>
          <button type="button" className="footer__link" onClick={reopen}>
            {t.cookies.manage}
          </button>
        </nav>

        <nav className="footer__col" aria-label={t.footer.languages}>
          <h2>{t.footer.languages}</h2>
          {LANGS.map((l) => (
            <a key={l} href={pathFor(l, page)} lang={l} hrefLang={l} aria-current={l === lang ? 'page' : undefined}>
              {LANG_NAMES[l]}
            </a>
          ))}
        </nav>
      </div>
      <p className="footer__legal mono">
        © {CONTACT.foundingYear}–2026 DevloperEU · Braga, Portugal · {t.footer.rights}
      </p>
    </footer>
  );
}
