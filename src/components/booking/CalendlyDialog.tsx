import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/context';

interface Props {
  /** URL do evento no Calendly; já com o pré-preenchimento (nome, email, data) */
  url: string;
  title: string;
  onClose: () => void;
}

/** Calendário do Calendly dentro do nosso site (iframe num diálogo responsivo, sem script de terceiros). */
export function CalendlyDialog({ url, title, onClose }: Props) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      className="cal"
      aria-label={title}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
    >
      <div className="cal__bar">
        <span className="cal__title">{title}</span>
        <button type="button" className="cal__x" onClick={() => ref.current?.close()} aria-label={t.ui.close}>
          ×
        </button>
      </div>
      <div className="cal__body">
        {!loaded && <p className="cal__loading mono">…</p>}
        <iframe className="cal__frame" src={url} title={title} onLoad={() => setLoaded(true)} loading="eager" />
      </div>
      <a className="cal__fallback" href={url} target="_blank" rel="noopener noreferrer">
        {title} ↗
      </a>
    </dialog>
  );
}
