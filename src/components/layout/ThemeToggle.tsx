import { useEffect } from 'react';
import { useI18n } from '../../i18n/context';
import { useTheme } from '../../lib/theme';
import './ThemeToggle.css';

/**
 * Alternador sol/lua do tema da superfície de leitura. Os dois ícones vêm no HTML e o CSS mostra o certo
 * a partir de html[data-theme] — correto desde a 1.ª pintura, antes de hidratar.
 * `paper` = a superfície visível é de leitura (senão é o palco do agente, sempre escuro).
 */
export function ThemeToggle({ paper }: { paper: boolean }) {
  const { t } = useI18n();
  const { theme, toggle } = useTheme();

  // superfície visível (header/fundo seguem o tema só na de leitura) + theme-color da barra do browser.
  useEffect(() => {
    document.documentElement.setAttribute('data-surface', paper ? 'paper' : 'agent');
    const color = paper ? getComputedStyle(document.documentElement).getPropertyValue('--paper').trim() : '#070605';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color || '#070605');
  }, [paper, theme]);

  if (!paper) return null;
  const label = theme === 'dark' ? t.ui.themeToLight : t.ui.themeToDark;
  return (
    <button type="button" className="theme-toggle" onClick={toggle} aria-label={label} title={label}>
      <svg className="theme-toggle__moon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
      <svg className="theme-toggle__sun" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
        </g>
      </svg>
    </button>
  );
}
