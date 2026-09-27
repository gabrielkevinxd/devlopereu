import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { readStore, writeStore } from './storage';

export type Mode = 'chat' | 'read';

interface AppState {
  mode: Mode;
  setMode: (m: Mode) => void;
  /** Incrementa sempre que alguém pede para agendar (CTA persistente). */
  bookNonce: number;
  requestBook: () => void;
  booked: boolean;
  markBooked: () => void;
}

const Ctx = createContext<AppState | null>(null);
const MODE_KEY = 'dev-mode';
const READ_HASH = '#navegar';

export function AppStateProvider({ children }: { children: ReactNode }) {
  // SSR e 1.º render do cliente começam em 'chat' (hidratação estável); a preferência aplica-se depois.
  const [mode, setModeState] = useState<Mode>('chat');
  const [bookNonce, setBookNonce] = useState(0);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    const fromHash = window.location.hash === READ_HASH ? 'read' : null;
    const initial = fromHash ?? readStore<Mode>(MODE_KEY, 'chat');
    if (initial !== 'chat') setModeState(initial);
    if (window.location.hash === '#agendar') setBookNonce((n) => n + 1);
  }, []);

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    writeStore(MODE_KEY, m);
    const hash = m === 'read' ? READ_HASH : '';
    window.history.replaceState(null, '', window.location.pathname + window.location.search + hash);
    window.scrollTo({ top: 0 });
  }, []);

  const requestBook = useCallback(() => setBookNonce((n) => n + 1), []);
  const markBooked = useCallback(() => setBooked(true), []);

  const value = useMemo(
    () => ({ mode, setMode, bookNonce, requestBook, booked, markBooked }),
    [mode, setMode, bookNonce, requestBook, booked, markBooked],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppState fora de AppStateProvider');
  return v;
}
