import { LANGS, LANG_NAMES, type Lang } from '../../i18n';
import { useI18n } from '../../i18n/context';
import { pathFor, type Page } from '../../routes';
import './LangSwitch.css';

/** Seletor nativo (acessível, compacto). Cada idioma é uma página pré-renderizada própria. */
export function LangSwitch({ page }: { page: Page }) {
  const { t, lang } = useI18n();
  return (
    <label className="lang">
      <span className="sr-only">{t.ui.language}</span>
      <span className="lang__code" aria-hidden="true">
        {lang.toUpperCase()}
      </span>
      <select
        value={lang}
        onChange={(e) => {
          const next = e.target.value as Lang;
          window.location.href = pathFor(next, page) + window.location.hash;
        }}
      >
        {LANGS.map((l) => (
          <option key={l} value={l} lang={l}>
            {l.toUpperCase()} · {LANG_NAMES[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
