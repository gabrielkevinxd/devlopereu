import { Logo } from '../components/brand/Logo';
import { useI18n } from '../i18n/context';
import { pathFor } from '../routes';
import './Pages.css';

/** Lead magnet: checklist imprimível, sem registo. */
export function ChecklistPage() {
  const { t, lang } = useI18n();
  const m = t.magnet;
  return (
    <article className="paper doc checklist">
      <div className="doc__inner">
        <div className="checklist__brand">
          <Logo variant="horizontal" sizes="220px" alt="DevloperEU" />
        </div>
        <h1>{m.title}</h1>
        <p className="doc__lead">{m.lead}</p>
        <ol className="checklist__items">
          {m.items.map((item, i) => (
            <li key={item}>
              <label>
                <input type="checkbox" />
                <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                <span>{item}</span>
              </label>
            </li>
          ))}
        </ol>
        <p className="doc__lead">{m.footer}</p>
        <div className="checklist__actions no-print">
          <a className="btn btn--gold" href={`${pathFor(lang, 'home')}#agendar`}>
            {t.ui.book}
          </a>
          <button type="button" className="btn" onClick={() => window.print()}>
            {m.print}
          </button>
          <a className="btn" href={pathFor(lang, 'home')}>
            {m.back}
          </a>
        </div>
        <p className="checklist__print-footer mono">devloper.eu · contato@devlopereu.com · +351 929 070 650</p>
      </div>
    </article>
  );
}
