import { CONTACT } from '../../../config';
import { useI18n } from '../../../i18n/context';
import { pathFor } from '../../../routes';
import { Logo } from '../../brand/Logo';

export function Done() {
  const { t, lang } = useI18n();
  return (
    <div className="done">
      <Logo variant="mark" sizes="96px" alt="" className="done__mark" />
      <h2>{t.booking.done} ✓</h2>
      <p>{t.chat.afterBook}</p>
      <a className="btn btn--gold" href={pathFor(lang, 'checklist')}>
        {t.chat.magnetCta}
      </a>
      <p className="done__alt mono">
        <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noopener">
          WhatsApp {CONTACT.phoneDisplay}
        </a>
        <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
      </p>
    </div>
  );
}
