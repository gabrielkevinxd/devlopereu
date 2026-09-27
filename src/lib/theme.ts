import { useCallback, useEffect, useState } from 'react';
import { readStore, writeStore } from './storage';

/**
 * Tema da superfície de leitura (modo clássico, páginas legais, checklist).
 * O atributo html[data-theme] é posto por um script inline no <head> ANTES da 1.ª pintura (index.html):
 * escolha guardada em localStorage → senão, prefers-color-scheme. Aqui só se lê e alterna.
 * O modo agente/Mega Brain é sempre escuro (decisão de design — ver .verify/v7/AUDIT.md).
 */
export type Theme = 'light' | 'dark';
export const THEME_KEY = 'dev-theme';

const current = (): Theme => (document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

export function useTheme() {
  // SSR e 1.º render do cliente: 'light' (hidratação estável); o valor real chega no efeito.
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    setThemeState(current());
    // Sem escolha guardada, acompanha o sistema em tempo real.
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (readStore<Theme | null>(THEME_KEY, null)) return;
      const t: Theme = mq.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', t);
      setThemeState(t);
    };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const toggle = useCallback(() => {
    const t: Theme = current() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', t);
    writeStore(THEME_KEY, t);
    setThemeState(t);
  }, []);

  return { theme, toggle };
}
