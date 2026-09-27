import { useI18n } from '../i18n/context';
import { pathFor } from '../routes';
import './Pages.css';

export type LegalKind = 'privacy' | 'cookies' | 'terms';

export function LegalPage({ kind }: { kind: LegalKind }) {
  const { t, lang } = useI18n();
  const doc = t.legal[kind];
  return (
    <article className="paper doc">
      <div className="doc__inner">
        <a className="doc__back" href={pathFor(lang, 'home')}>
          ← DevloperEU
        </a>
        <h1>{doc.title}</h1>
        <p className="doc__updated mono">{t.legal.updated}</p>
        {doc.sections.map((s) => (
          <section key={s.h}>
            <h2>{s.h}</h2>
            {'p' in s && s.p?.map((p) => <p key={p}>{p}</p>)}
            {'items' in s && s.items && (
              <ul>
                {s.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}
