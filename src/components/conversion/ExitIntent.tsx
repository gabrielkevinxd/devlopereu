import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/context';
import { useAppState } from '../../lib/app-state';
import { readStore, writeStore } from '../../lib/storage';
import { pathFor } from '../../routes';
import './ExitIntent.css';

const KEY = 'dev-exit-shown';
const ARM_AFTER_MS = 8000;

/**
 * Exit-intent educado: só desktop (rato), no máximo 1 vez por navegador, fecha com Esc,
 * clique fora ou botão. Nunca aparece a quem já pediu reunião.
 */
export function ExitIntent() {
  const { t, lang } = useI18n();
  const { booked, requestBook } = useAppState();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (booked || readStore(KEY, false)) return;
    if (!window.matchMedia('(pointer: fine) and (min-width: 1024px)').matches) return;
    let armed = false;
    const arm = window.setTimeout(() => (armed = true), ARM_AFTER_MS);
    const onLeave = (e: MouseEvent) => {
      if (!armed || e.relatedTarget || e.clientY > 0) return;
      writeStore(KEY, true);
      setOpen(true);
      document.removeEventListener('mouseout', onLeave);
    };
    document.addEventListener('mouseout', onLeave);
    return () => {
      window.clearTimeout(arm);
      document.removeEventListener('mouseout', onLeave);
    };
  }, [booked]);

  useEffect(() => {
    const d = dialogRef.current;
    if (open && d && !d.open) d.showModal();
  }, [open]);

  if (!open) return null;
  const close = () => {
    dialogRef.current?.close();
    setOpen(false);
  };

  return (
    <dialog
      ref={dialogRef}
      className="exit"
      aria-labelledby="exit-title"
      onClose={() => setOpen(false)}
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="exit__box">
        <button type="button" className="exit__x" onClick={close} aria-label={t.ui.close}>
          ×
        </button>
        <h2 id="exit-title">{t.exit.title}</h2>
        <p>{t.exit.body}</p>
        <div className="exit__actions">
          <a className="btn btn--gold" href={pathFor(lang, 'checklist')}>
            {t.exit.cta}
          </a>
          <button
            type="button"
            className="btn"
            onClick={() => {
              close();
              requestBook();
            }}
          >
            {t.exit.alt}
          </button>
          <button type="button" className="exit__no" onClick={close}>
            {t.exit.close}
          </button>
        </div>
      </div>
    </dialog>
  );
}
