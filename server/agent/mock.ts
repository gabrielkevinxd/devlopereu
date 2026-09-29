/**
 * Provider «mock» (AGENT_PROVIDER=mock): respostas e tool calls realistas, determinísticas e grátis,
 * para testar o palco controlado por ferramentas sem chave de LLM. Espelha a lógica de api/agent.php.
 */
import { workdaySlots } from './brain';
import type { Usage } from './budget';
import type { ChatMsg } from './guard';

/** Usage sintético (≈ 4 caracteres por token), faturado como gemini-2.5-flash. */
export const mockUsage = (promptChars: number, outChars: number): Usage => ({
  inText: Math.ceil(promptChars / 4),
  inAudio: 0,
  outText: Math.ceil(outChars / 4) + 10,
  outAudio: 0,
});

interface MockOut {
  text: string;
  tools: { name: string; args: Record<string, unknown> }[];
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export function mockReply(history: ChatMsg[], system = ''): MockOut {
  const raw = history[history.length - 1]?.text ?? '';
  const u = norm(raw);
  const all = norm(history.filter((m) => m.role === 'user').map((m) => m.text).join(' '));

  // CHECK MATCH: o servidor avisou que a conversa está perto do limite → resumo + decisão de qualificação.
  if (system.includes('CHECK MATCH')) {
    const company = /(clinica|loja|empresa|escritorio|restaurante|fabrica|hotel|imobiliaria|contabilidade)/.test(all);
    const pain = /(marcac|fatura|mensag|email|stock|encomend|document|agenda|telefone|relatorio)/.test(all);
    const automatable = pain;
    const decision = /(sou (o |a )?(dono|dona|socio|socia|gerente|diretor|diretora|responsavel)|decido|este mes|este trimestre|ate ao fim do ano|urgente)/.test(all);
    const slot = /day (\d{4}-\d{2}-\d{2}) and time (\d{2}:\d{2})/.exec(system);
    const criteria = { company, pain, automatable, decision };
    if (company && pain && automatable && decision) {
      const summary = 'Clínica com marcações manuais por telefone e WhatsApp, equipa de receção sobrecarregada';
      return {
        text: `Resumindo: ${summary.toLowerCase()} — um caso claro para um agente. Faz sentido marcarmos 30 minutos? Deixei ${slot?.[1] ?? ''} às ${slot?.[2] ?? ''} pré-preenchido no palco; é só confirmar.`,
        tools: [
          { name: 'qualify_lead', args: { qualified: true, ...criteria, reason: 'Todos os critérios cumpridos' } },
          { name: 'open_booking', args: { day: slot?.[1], time: slot?.[2], notes: summary } },
        ],
      };
    }
    return {
      text: 'Obrigado pela conversa! Pelo que me contou, uma reunião ainda não é o melhor próximo passo. Deixo-lhe a checklist gratuita das 12 tarefas e os nossos contactos — WhatsApp +351 929 070 650 ou devlopereu@gmail.com — para quando fizer sentido.',
      tools: [{ name: 'qualify_lead', args: { qualified: false, ...criteria, reason: 'Sem empresa nem processo concreto' } }],
    };
  }
  const num = (re: RegExp, s = u) => {
    const m = s.match(re);
    return m ? Number(m[1]) : undefined;
  };
  const people = num(/(\d+)\s*(pessoas|people|colaborador|funcionari|pessoa)/);
  const hours = num(/(\d+)\s*(h\b|horas|hours)/);
  const suggest = (options: string[]) => ({ name: 'suggest_replies', args: { options } });

  if (/teste-qualify-fora-de-hora/.test(u)) {
    // imita o que se viu num teste real: o modelo chama qualify_lead fora do CHECK MATCH
    return { text: 'Percebo. Em que processo a equipa perde mais tempo?', tools: [{ name: 'qualify_lead', args: { qualified: false, company: false, pain: false, automatable: false, decision: false } }] };
  }
  if (/(audio|voz|fala comigo|responde a falar|speak|voice)/.test(u)) {
    return {
      text: 'Claro, passo a responder também por voz. Em que processo a sua equipa perde mais tempo?',
      tools: [{ name: 'reply_with_voice', args: {} }, suggest(['Marcações por WhatsApp', 'Faturas e documentos'])],
    };
  }

  if (/(reuniao|marcar|agendar|meeting|book)/.test(u)) {
    const day = workdaySlots()[3].slice(0, 10);
    const name = /chamo[- ]me ([a-zà-ÿ]+(?: [a-zà-ÿ]+)?)/i.exec(raw)?.[1];
    const contact = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i.exec(raw)?.[0];
    return {
      text: 'Ótimo. Deixei o pedido preparado no palco com o que me disse — confirme o dia e a hora, marque o consentimento e envie.',
      tools: [
        {
          name: 'open_booking',
          args: { day, time: '15:00', ...(name ? { name } : {}), ...(contact ? { contact } : {}), notes: 'Agente de marcações para clínica' },
        },
        suggest(['Prefiro de manhã', 'Posso enviar por email?']),
      ],
    };
  }

  if (/(servic|capacidad|capabilit|usariam|would you use|tecnolog)/.test(u)) {
    return {
      text: 'Para o seu caso usaria três capacidades — destaquei-as no palco com o porquê de cada uma. Quer ver isto com os seus dados numa conversa de 30 minutos?',
      tools: [
        {
          name: 'unlock_capabilities',
          args: {
            ids: ['agente-voz', 'whatsapp', 'integracoes-mcp'],
            reasons: [
              'Atende e marca por telefone, 24/7, sem sobrecarregar a receção.',
              'Responde e confirma marcações no WhatsApp.',
              'Liga o agente ao software de agenda que já usam.',
            ],
            flows: [
              { id: 'agente-voz', steps: ['Paciente liga para marcar consulta', 'Agente de voz percebe o pedido', 'Consulta a agenda da clínica', 'Consulta marcada e confirmação enviada'] },
            ],
          },
        },
        suggest(['Sim, quero marcar', 'Quanto custa?']),
      ],
    };
  }

  if (/(quanto custa|preco|price|orcamento)/.test(u)) {
    return {
      text: 'Depende do âmbito: depois de uma conversa de 30 minutos e do diagnóstico, a DevloperEU apresenta uma proposta fechada. Quer que prepare o pedido de reunião?',
      tools: [suggest(['Sim, vamos marcar', 'Ainda não'])],
    };
  }

  if (people !== undefined || hours !== undefined) {
    const p = people ?? num(/(\d+)\s*(pessoas|people)/, all) ?? 3;
    const h = hours ?? num(/(\d+)\s*(h\b|horas|hours)/, all) ?? 8;
    return {
      text: `Com ${p} pessoas a ${h} h por semana, montei no palco um agente de marcações para o seu caso. É uma simulação ilustrativa — quer ver que capacidades usaria?`,
      tools: [
        { name: 'update_profile', args: { team_size: p, hours_per_week: h } },
        {
          name: 'show_simulation',
          args: {
            title: 'Agente de marcações da clínica',
            flow: ['WhatsApp e chamadas', 'Entende o pedido', 'Consulta a agenda', 'Confirma e lembra'],
            events: [
              'Mensagem no WhatsApp — «Tem vaga para destartarização?»',
              'Pedido classificado: marcação · higiene oral',
              'Agenda consultada → 3 vagas esta semana',
              'Paciente escolheu quinta 10:30 → marcação criada',
              'Lembrete agendado para a véspera',
            ],
            people: p,
            hours: h,
            share: 0.5,
          },
        },
        suggest(['Que serviços usariam?', 'Quero marcar reunião']),
      ],
    };
  }

  if (/(marcac|agenda|whatsapp|telefone|email|fatura|document|stock|encomend|clinica|loja|restaurante)/.test(u)) {
    const sector = /clinica/.test(all) ? 'Clínica dentária' : /loja/.test(all) ? 'Loja online' : /restaurante/.test(all) ? 'Restauração' : 'Serviços';
    const pain = /marcac|agenda/.test(u) ? 'Marcações por telefone e WhatsApp' : /fatura|document/.test(u) ? 'Faturas e documentos' : 'Mensagens de clientes';
    return {
      text: 'Percebo — é dos processos em que um agente mais ajuda. Quantas pessoas tratam disto e quantas horas por semana gasta cada uma?',
      tools: [
        { name: 'update_profile', args: { sector, pain, systems: /whatsapp/.test(u) ? 'WhatsApp, telefone' : undefined } },
        suggest(['2 pessoas, 10 horas cada', '4 pessoas, 6 horas cada']),
      ],
    };
  }

  return {
    text: 'Obrigado! Para lhe mostrar um agente à medida: em que setor está a sua empresa e onde é que a equipa perde mais tempo?',
    tools: [suggest(['Clínica — marcações', 'Loja online — mensagens', 'Escritório — faturas'])],
  };
}
