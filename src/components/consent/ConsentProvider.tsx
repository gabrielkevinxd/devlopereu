import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { readStore, writeStore } from '../../lib/storage';
import { loadPixel } from './pixel';

export type Choice = 'granted' | 'denied' | null;

interface Consent {
  choice: Choice;
  bannerOpen: boolean;
  decide: (c: Exclude<Choice, null>) => void;
  reopen: () => void;
}

const Ctx = createContext<Consent | null>(null);
const KEY = 'dev-consent-v1';

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<Choice>(null);
  const [bannerOpen, setBannerOpen] = useState(false);

  useEffect(() => {
    const saved = readStore<{ marketing: boolean } | null>(KEY, null);
    if (saved == null) setBannerOpen(true);
    else setChoice(saved.marketing ? 'granted' : 'denied');
  }, []);

  useEffect(() => {
    if (choice === 'granted') loadPixel();
  }, [choice]);

  const decide = useCallback((c: Exclude<Choice, null>) => {
    writeStore(KEY, { marketing: c === 'granted', at: new Date().toISOString() });
    setChoice(c);
    setBannerOpen(false);
    // Retirar o consentimento com o Pixel já carregado: recarregar garante que deixa de correr.
    if (c === 'denied' && window.fbq) window.location.reload();
  }, []);

  const reopen = useCallback(() => setBannerOpen(true), []);
  const value = useMemo(() => ({ choice, bannerOpen, decide, reopen }), [choice, bannerOpen, decide, reopen]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useConsent(): Consent {
  const v = useContext(Ctx);
  if (!v) throw new Error('useConsent fora de ConsentProvider');
  return v;
}
