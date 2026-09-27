import { useEffect, useRef } from 'react';
import { useI18n } from '../../i18n/context';
import { useAppState } from '../../lib/app-state';
import { Chat } from './Chat';
import { Stage } from './Stage';
import { useAgent } from './useAgent';
import './Workspace.css';

/**
 * A experiência principal: o site É o agente.
 * Conversa (guiada, scriptada) + Palco (o que o agente faz pelo visitante, ao vivo).
 */
export function Workspace({ hidden }: { hidden: boolean }) {
  const { t } = useI18n();
  const { bookNonce, mode } = useAppState();
  const { state, typing, act } = useAgent(t);
  const stageRef = useRef<HTMLElement>(null);

  // CTA persistente «Agendar reunião» → salta para o agendamento dentro da conversa.
  useEffect(() => {
    if (bookNonce === 0 || mode !== 'chat') return;
    act({ type: 'book', fromCta: true });
  }, [bookNonce, mode, act]);

  // Em ecrãs estreitos, depois de o agente falar, trazer o formulário (ou a confirmação) à vista.
  const settled = state.queue.length === 0;
  useEffect(() => {
    if ((state.phase === 'booking' || state.phase === 'done' || state.phase === 'closed') && settled && window.matchMedia('(max-width: 899px)').matches) {
      stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [state.phase, settled]);

  return (
    <div className="ws" data-phase={state.phase} hidden={hidden}>
      <Chat state={state} typing={typing} act={act} />
      <Stage ref={stageRef} state={state} act={act} />
    </div>
  );
}
