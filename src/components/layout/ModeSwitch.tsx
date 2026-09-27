import { useI18n } from '../../i18n/context';
import { useAppState, type Mode } from '../../lib/app-state';
import './ModeSwitch.css';

/** Interruptor «Conversar | Navegar» (experiência do agente vs. modo clássico). */
export function ModeSwitch({ className = '' }: { className?: string }) {
  const { t } = useI18n();
  const { mode, setMode } = useAppState();
  const opt = (m: Mode, label: string) => (
    <button type="button" aria-pressed={mode === m} onClick={() => setMode(m)}>
      {label}
    </button>
  );
  return (
    <div className={`mode ${className}`} role="group" aria-label={t.ui.modeLabel}>
      {opt('chat', t.ui.modeChat)}
      {opt('read', t.ui.modeRead)}
    </div>
  );
}
