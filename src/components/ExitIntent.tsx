import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { BookButton } from './ui';
import { useChecklist } from './LeadMagnet';

const KEY = 'devloper:exit-shown';
const MIN_TIME_MS = 15000;

/**
 * Exit-intent educado: um único modal por sessão, só em desktop (ponteiro sai pelo topo da janela),
 * depois de 15 s no site, fechável com Esc / botão / clique fora, sem bloquear a saída.
 */
const ExitIntent: React.FC = () => {
  const { t } = useTranslation();
  const download = useChecklist();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(KEY) === '1'; } catch { /* modo privado */ }
    if (seen || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const start = Date.now();
    const onLeave = (e: MouseEvent) => {
      if (e.clientY > 0 || e.relatedTarget || Date.now() - start < MIN_TIME_MS) return;
      if (document.getElementById('agendar')?.matches(':focus-within')) return; // a preencher o pedido
      opener.current = document.activeElement;
      try { sessionStorage.setItem(KEY, '1'); } catch { /* ignore */ }
      setOpen(true);
      document.removeEventListener('mouseout', onLeave);
    };
    document.addEventListener('mouseout', onLeave);
    return () => document.removeEventListener('mouseout', onLeave);
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const close = () => {
    setOpen(false);
    (opener.current as HTMLElement | null)?.focus?.();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4 bg-black/70" onClick={close}>
      <div role="dialog" aria-modal="true" aria-labelledby="exit-t" className="relative w-full max-w-md rounded-3xl border border-gold/40 bg-primary p-8 shadow-[0_0_80px_-20px_rgba(212,175,55,0.5)]" onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} type="button" onClick={close} aria-label={t('v2.exit.close')} className="absolute right-3 top-3 grid place-items-center h-12 w-12 text-white hover:text-gold">
          <X size={24} />
        </button>
        <h2 id="exit-t" className="font-anton text-3xl uppercase pr-10">{t('v2.exit.title')}</h2>
        <p className="mt-3 text-gray-light">{t('v2.exit.text')}</p>
        <div className="mt-6 flex flex-col gap-3">
          <BookButton label={t('v2.exit.book')} onBefore={close} />
          <button type="button" onClick={() => { download(); close(); }} className="rounded-full border border-white/25 px-6 py-3 min-h-[48px] font-bold hover:border-gold hover:text-gold">
            {t('v2.exit.checklist')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExitIntent;
