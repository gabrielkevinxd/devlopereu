import { useI18n } from '../../i18n/context';
import { pathFor } from '../../routes';
import { useConsent } from './ConsentProvider';
import './CookieBanner.css';

/** Banner de cookies: duas opções com o mesmo peso visual (sem dark patterns). */
export function CookieBanner() {
  const { t, lang } = useI18n();
  const { bannerOpen, decide } = useConsent();
  if (!bannerOpen) return null;
  return (
    <aside className="cookie" aria-label={t.cookies.manage}>
      <p>
        {t.cookies.text} <a href={pathFor(lang, 'cookies')}>{t.cookies.policy}</a>
      </p>
      <div className="cookie__actions">
        <button type="button" className="btn" onClick={() => decide('denied')}>
          {t.cookies.reject}
        </button>
        <button type="button" className="btn" onClick={() => decide('granted')}>
          {t.cookies.accept}
        </button>
      </div>
    </aside>
  );
}
