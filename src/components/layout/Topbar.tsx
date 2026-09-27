import { useI18n } from '../../i18n/context';
import { useAppState } from '../../lib/app-state';
import { pathFor, type Page } from '../../routes';
import { Logo } from '../brand/Logo';
import { LangSwitch } from './LangSwitch';
import { ModeSwitch } from './ModeSwitch';
import { ThemeToggle } from './ThemeToggle';
import './Topbar.css';

export function Topbar({ page }: { page: Page }) {
  const { t, lang } = useI18n();
  const { requestBook, mode } = useAppState();
  const home = pathFor(lang, 'home');
  const isHome = page === 'home';
  const agent = isHome && mode === 'chat'; // palco do agente visível (sempre escuro)

  return (
    <header className="topbar">
      <a className="skip" href="#main">
        {t.ui.skip}
      </a>
      <a className="topbar__brand" href={home} aria-label={`DevloperEU — ${t.ui.home}`}>
        <Logo variant="horizontal" sizes="(min-width: 900px) 200px, 150px" alt="DevloperEU" priority className="topbar__logo-dark" />
        <Logo variant="deep" sizes="(min-width: 900px) 200px, 150px" alt="DevloperEU" className="topbar__logo-light" />
      </a>
      {agent && (
        <p className="topbar__status mono" aria-hidden="true">
          <span className="pulse" /> {t.ui.status} · {t.ui.location}
        </p>
      )}
      <div className="topbar__actions">
        {isHome && <ModeSwitch className="topbar__mode" />}
        <ThemeToggle paper={!agent} />
        <LangSwitch page={page} />
        {isHome ? (
          <button type="button" className="btn btn--gold topbar__cta" onClick={requestBook}>
            <span className="topbar__cta-long">{t.ui.book}</span>
            <span className="topbar__cta-short">{t.ui.bookShort}</span>
          </button>
        ) : (
          <a className="btn btn--gold topbar__cta" href={`${home}#agendar`}>
            <span className="topbar__cta-long">{t.ui.book}</span>
            <span className="topbar__cta-short">{t.ui.bookShort}</span>
          </a>
        )}
      </div>
    </header>
  );
}
