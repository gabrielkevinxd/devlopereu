import { createContext, useContext, type ReactNode } from 'react';
import type { Dict, Lang } from './index';

interface I18n {
  lang: Lang;
  t: Dict;
}

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ lang, dict, children }: { lang: Lang; dict: Dict; children: ReactNode }) {
  return <Ctx.Provider value={{ lang, t: dict }}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n fora de I18nProvider');
  return v;
}
