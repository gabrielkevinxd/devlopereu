# DevloperEU v2 — «O site é o agente»

## Ideia central

O site deixa de *falar sobre* agentes de IA e passa a **ser um**. Quem entra não encontra
uma landing page com secções empilhadas: encontra o **Agente DevloperEU** a acordar — o
próprio logótipo (a cabeça em rede neuronal dourada) ganha vida — e uma área de trabalho
com duas superfícies:

- **Conversa** (à esquerda / em baixo no telemóvel): o agente faz 3 perguntas curtas
  (setor, onde a equipa perde tempo, dimensão) com respostas em botões — sem escrever,
  sem LLM, 100% guiado e previsível.
- **Palco** (à direita / em cima no telemóvel): o que o agente está a fazer *por si*, ao
  vivo — primeiro a ficha da sua empresa a preencher-se, depois a **simulação do agente a
  trabalhar no seu caso** (fluxo a montar-se, pacotes a circular, registo de eventos em
  tempo real), depois as **capacidades** (os 6 serviços) a desbloquear-se, e por fim o
  **agendamento**.

Tudo converge para uma única ação: marcar 30 minutos para ver isto com os dados reais.

## Jornada

1. **Arranque (0–2 s)** — ecrã negro, linhas de *boot* em monoespaçada, o logótipo real
   acende-se: um feixe de luz percorre só as linhas da rede neuronal (máscara com o PNG
   real). Estado: «● agente online · Braga, PT».
2. **Apresentação** — o agente apresenta-se (é o H1 da página) e oferece dois caminhos:
   «Mostre-me o que faria na minha empresa» ou «Prefiro navegar» (modo clássico).
3. **Diagnóstico em 3 toques** — setor → dor principal → pessoas e horas/semana (o
   visitante é que indica as horas; nada é inventado). No palco, a *ficha da empresa*
   escreve-se sozinha à medida que responde.
4. **Simulação ao vivo** — o agente «monta» o fluxo específico da dor escolhida
   (ex.: WhatsApp → agente classifica → consulta agenda → responde → cria tarefa), com
   registo de eventos a correr e um cenário de horas libertadas calculado com a fórmula
   visível (pessoas × horas × 50%) e rotulado como ilustrativo.
5. **Capacidades** — os 6 serviços aparecem como módulos; os relevantes para o caso
   ficam «desbloqueados» (dourados) com a razão; os outros podem ser explorados.
6. **Agendamento** — o agente propõe 30 min; o visitante escolhe dia e hora, deixa o
   contacto, dá consentimento RGPD, e **o agente redige o pedido** (com o resumo do caso)
   que abre no WhatsApp já preenchido — ou por email. Se `CALENDAR_URL` existir, abre o
   calendário.
7. **Fecho** — confirmação, checklist gratuita (lead magnet) e redes sociais.

A qualquer momento: CTA persistente «Agendar reunião» (topo) salta direto para o passo 6;
«Recomeçar» e «Modo clássico» estão sempre à mão.

## Modo clássico (acessível e para SEO)

Um interruptor «Conversar | Navegar» troca a área de trabalho por um **documento** claro
(papel marfim, tinta preta, dourado como acento): H1, serviços, como trabalhamos, sobre,
FAQ, agendamento e contactos. Ambos os modos são **pré-renderizados em HTML estático**
(SSG próprio com `renderToString`) por idioma, pelo que o conteúdo é indexável e funciona
sem JavaScript (sem JS mostra-se o modo clássico).

## Momentos «uau»

1. **O logótipo acorda** — o PNG real serve de máscara a um feixe de luz dourada que
   percorre a rede neuronal; o mesmo efeito é o indicador «a pensar» do agente.
2. **A ficha escreve-se sozinha** — cada resposta aparece no palco como especificação
   técnica em direto.
3. **O agente a trabalhar no *seu* caso** — fluxo montado nó a nó, pacotes em trânsito,
   *log* com carimbo de hora, contadores a subir.
4. **Capacidades desbloqueadas** — os serviços deixam de ser uma grelha de cartões e
   passam a ser módulos que o agente liga para o caso concreto.
5. **O agente escreve o seu pedido de reunião** — a mensagem de WhatsApp é redigida à
   frente do visitante, com dia, hora e resumo do caso.

## Porque é diferente do antigo

| Antigo (main / redesign-2026) | v2 |
|---|---|
| Landing de secções empilhadas (hero → serviços → vantagens → FAQ → contacto) | Área de trabalho de um agente: conversa + palco, um único ecrã que muda de estado |
| Hero com canvas de rede neuronal genérica e título em Anton | O **logótipo real** é o herói e o avatar do agente |
| Serviços como grelha de cartões | Serviços como **capacidades** que se desbloqueiam para o caso do visitante |
| Formulário/CTA genérico | O agente **redige o pedido** com o diagnóstico e abre o WhatsApp |
| SPA sem conteúdo no HTML | HTML pré-renderizado por idioma (6), JSON-LD, sitemap com hreflang |
| Meta Pixel carregado sem consentimento | Pixel só após «Aceitar»; escolha guardada; reabrível no rodapé |

## Paleta e tipo

Preto quente (`#070605`) + ouro do logótipo (`#E2B842`, realces `#F5DE8C`, sombra
`#9C7A1C`); no modo clássico inverte para marfim (`#F6F1E6`) com tinta quase-preta.
Tipografia: **Sora** (geométrica e arredondada, conversa com o wordmark) +
**JetBrains Mono** (voz de sistema: logs, estado, carimbos). Ambas auto-alojadas.

## Regras de honestidade

Sem preços, clientes, números de projetos ou testemunhos inventados. A simulação é
rotulada «simulação ilustrativa»; o cenário de horas usa os números do próprio visitante
e mostra a fórmula. Espaço para casos reais existe em `src/config.ts` (`CASE_STUDIES`,
vazio → não renderiza).
