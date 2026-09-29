/**
 * Dicionário PT-PT — fonte de verdade de toda a cópia do site.
 * Os outros idiomas implementam o tipo `Dict` (derivado daqui), por isso
 * uma chave em falta é erro de compilação.
 *
 * Marcadores {assim} são substituídos em runtime por `fill()`.
 * NÃO inventar preços, clientes, números ou testemunhos.
 */
export const pt = {
  meta: {
    title: 'DevloperEU — Agentes de IA e automação para empresas | Braga, Portugal',
    description:
      'Agentes de IA e hiperautomação para empresas em Portugal e na Europa. Converse com o nosso agente, veja uma simulação no seu caso e agende 30 minutos. Braga, desde 2024.',
    ogAlt: 'Logótipo DevloperEU — cabeça em rede neuronal dourada',
    ogLocale: 'pt_PT',
  },

  ui: {
    themeToDark: 'Mudar para tema escuro',
    themeToLight: 'Mudar para tema claro',
    skip: 'Saltar para o conteúdo',
    modeLabel: 'Modo de visualização',
    modeChat: 'Conversar',
    modeRead: 'Navegar',
    book: 'Agendar reunião',
    bookShort: 'Agendar',
    language: 'Idioma',
    status: 'agente online',
    location: 'Braga, PT',
    restart: 'Recomeçar',
    skipToBooking: 'Ir direto ao agendamento',
    toClassic: 'Modo clássico',
    toChat: 'Conversar com o agente',
    simulation: 'Simulação ilustrativa',
    typing: 'O agente está a escrever…',
    stageLabel: 'Palco do agente',
    chatLabel: 'Conversa com o agente',
    answersLabel: 'Respostas sugeridas',
    close: 'Fechar',
    you: 'Você',
    agent: 'Agente DevloperEU',
    home: 'Página inicial',
  },

  boot: [
    'a iniciar agente devloper.eu',
    'a carregar capacidades · {n}/{n}',
    'contexto · empresas em Portugal e na Europa',
    'pronto',
  ],

  chat: {
    intro: 'Olá. Sou o agente da DevloperEU.',
    introSub:
      'Em menos de um minuto mostro-lhe o que um agente de IA faria na sua empresa — com uma simulação no seu caso. Sem formulários.',
    introYes: 'Mostre-me na minha empresa',
    introNo: 'Prefiro navegar pelo site',
    askSector: 'Para começar: em que setor trabalha a sua empresa?',
    askPain: 'Entendido — {sector}. Onde é que a equipa perde mais tempo hoje?',
    askTeam: 'Última pergunta. Quantas pessoas tratam disto e quantas horas por semana gasta cada uma?',
    people: 'Pessoas envolvidas',
    hours: 'Horas por pessoa, por semana',
    confirmTeam: 'Montar o meu agente',
    teamAnswer: '{people} pessoas · {hours} h/semana cada',
    building: 'Perfeito. A montar um agente de {pain} para {sector}… veja no palco.',
    simDone:
      'Este é o agente a trabalhar no seu caso. No cenário em que assume metade das tarefas repetitivas, a equipa recupera cerca de {result} horas por semana.',
    simNote: 'É uma simulação ilustrativa com os números que me deu — na reunião medimos com os seus dados reais.',
    toCaps: 'Que capacidades usaria?',
    capsIntro:
      'Para o seu caso ativei {count} capacidades. As restantes também estão disponíveis — toque em qualquer uma para saber mais.',
    capsOpened: '{name}: {short}',
    capsFocus: 'Aqui está «{name}» no palco, com um fluxo de exemplo ilustrativo. Toque noutros módulos para comparar — ou conte-me o seu caso e adapto-o.',
    toBook: 'Quero ver isto com os meus dados',
    askBook:
      'Proponho 30 minutos por videochamada: percebemos o processo, mostramos o agente com os seus dados e dizemos-lhe o que é viável. Escolha dia e hora no palco.',
    bookedWhatsapp: 'Pedido preparado e aberto no WhatsApp. Assim que o enviar, confirmamos a hora.',
    bookedEmail: 'Pedido preparado no seu cliente de email. Assim que o enviar, confirmamos a hora.',
    bookedCalendar: 'Abri o nosso calendário numa nova janela para confirmar a hora.',
    afterBook: 'Enquanto espera, leve a checklist gratuita das {tasks} tarefas que um agente de IA pode assumir já.',
    magnetCta: 'Abrir a checklist',
    jumpBook: 'Vamos direto ao agendamento. Escolha dia e hora no palco — o resto é comigo.',
  },

  sectors: [
    { id: 'comercio', label: 'Comércio e e-commerce', who: 'clientes da loja' },
    { id: 'servicos', label: 'Serviços profissionais', who: 'clientes' },
    { id: 'industria', label: 'Indústria e logística', who: 'clientes e fornecedores' },
    { id: 'saude', label: 'Saúde e clínicas', who: 'pacientes' },
    { id: 'imobiliario', label: 'Imobiliário', who: 'interessados' },
    { id: 'turismo', label: 'Turismo e restauração', who: 'hóspedes e clientes' },
  ],

  pains: [
    {
      id: 'atendimento',
      label: 'Atendimento e mensagens',
      agentName: 'atendimento',
      flow: ['WhatsApp, email e site', 'Agente entende o pedido', 'Consulta os seus sistemas', 'Responde e regista'],
      log: [
        'Nova mensagem via WhatsApp — «Ainda têm disponibilidade esta semana?»',
        'Intenção detetada: disponibilidade · confiança 0,94',
        'Consulta à agenda interna → 3 vagas livres',
        'Resposta enviada com 3 opções de horário',
        'Escolha confirmada → registo criado no CRM',
        'Resumo do dia enviado à equipa',
      ],
      services: ['automacao', 'consultoria', 'desenvolvimento'],
    },
    {
      id: 'documentos',
      label: 'Faturas e documentos',
      agentName: 'documentos',
      flow: ['Email e digitalizações', 'Agente lê o documento', 'Valida e cruza dados', 'Lança no ERP'],
      log: [
        'Fatura recebida por email — PDF, 2 páginas',
        'Campos extraídos: NIF, data, total, IVA',
        'Validação: NIF do fornecedor confere',
        'Cruzamento com a encomenda → valores coincidem',
        'Lançamento preparado no ERP para aprovação',
        'Exceção sinalizada: 1 documento sem encomenda',
      ],
      services: ['automacao', 'machine_learning', 'desenvolvimento'],
    },
    {
      id: 'agenda',
      label: 'Marcações e agenda',
      agentName: 'marcações',
      flow: ['Pedidos de marcação', 'Agente propõe horários', 'Sincroniza a agenda', 'Confirma e lembra'],
      log: [
        'Pedido de marcação recebido pelo site',
        'Preferência detetada: final da tarde',
        'Agenda da equipa consultada → 2 opções',
        'Marcação confirmada e adicionada ao calendário',
        'Lembrete agendado para a véspera',
        'Desmarcação recebida → vaga reaberta automaticamente',
      ],
      services: ['automacao', 'desenvolvimento'],
    },
    {
      id: 'leads',
      label: 'Leads e vendas',
      agentName: 'vendas',
      flow: ['Formulários e anúncios', 'Agente qualifica', 'Atualiza o CRM', 'Segue o contacto'],
      log: [
        'Novo contacto via formulário do site',
        'Enriquecimento: setor e dimensão identificados',
        'Pontuação de qualificação: 82/100',
        'Oportunidade criada no CRM com resumo',
        'Primeira resposta personalizada enviada',
        'Seguimento agendado para daqui a 3 dias',
      ],
      services: ['automacao', 'analytics', 'machine_learning'],
    },
    {
      id: 'relatorios',
      label: 'Relatórios e dados',
      agentName: 'relatórios',
      flow: ['Folhas, ERP e CRM', 'Agente junta os dados', 'Calcula indicadores', 'Envia o relatório'],
      log: [
        'Recolha: 4 fontes de dados ligadas',
        'Limpeza: 37 linhas duplicadas removidas',
        'Indicadores semanais calculados',
        'Desvio detetado: vendas da zona norte −12%',
        'Relatório gerado em PDF e painel atualizado',
        'Alerta enviado à direção',
      ],
      services: ['analytics', 'big_data', 'automacao'],
    },
    {
      id: 'operacoes',
      label: 'Encomendas e stock',
      agentName: 'operações',
      flow: ['Encomendas e vendas', 'Agente prevê procura', 'Verifica o stock', 'Prepara reposição'],
      log: [
        'Encomenda recebida — 3 artigos',
        'Stock verificado em 2 armazéns',
        'Previsão: rutura do artigo A em 9 dias',
        'Proposta de reposição gerada',
        'Pedido ao fornecedor preparado para aprovação',
        'Cliente informado do prazo de entrega',
      ],
      services: ['machine_learning', 'big_data', 'automacao'],
    },
  ],

  profile: {
    title: 'Ficha da empresa',
    subtitle: 'gerada em direto pelo agente',
    sector: 'Setor',
    pain: 'Prioridade',
    team: 'Equipa',
    hours: 'Tempo gasto',
    pending: 'a aguardar…',
    peopleUnit: 'pessoas',
    hoursUnit: 'h/semana cada',
  },

  sim: {
    title: 'Agente de {pain}',
    running: 'em execução',
    events: 'Registo de eventos',
    tasks: 'Tarefas tratadas',
    response: 'Resposta',
    responseValue: '< 5 s',
    scenario: 'Cenário: horas libertadas por semana',
    formula: '{people} pessoas × {hours} h × {share}% = {result} h',
    disclaimer: 'Simulação ilustrativa. Os valores reais dependem do seu processo e são medidos na reunião.',
  },

  services: [
    {
      id: 'consultoria',
      name: 'IA Consultoria',
      short: 'Estratégia e diagnóstico: onde a IA dá retorno na sua empresa.',
      bullets: ['Mapa de processos e oportunidades', 'Plano por fases com prioridades', 'Escolha de ferramentas e riscos (RGPD, AI Act)'],
      why: 'Define por onde começar e o que não vale a pena automatizar.',
    },
    {
      id: 'automacao',
      name: 'Automação',
      short: 'Agentes de IA e hiperautomação que tratam tarefas repetitivas de ponta a ponta.',
      bullets: ['Agentes em WhatsApp, email e site', 'Integração com ERP, CRM e folhas', 'Humano no circuito quando é preciso'],
      why: 'É o motor do agente que viu na simulação.',
    },
    {
      id: 'machine_learning',
      name: 'Machine Learning',
      short: 'Modelos que classificam, extraem e preveem a partir dos seus dados.',
      bullets: ['Leitura de documentos', 'Previsão de procura e riscos', 'Classificação de pedidos'],
      why: 'Dá ao agente a capacidade de ler, classificar e prever.',
    },
    {
      id: 'big_data',
      name: 'Big Data',
      short: 'Recolha, limpeza e organização de dados dispersos por várias fontes.',
      bullets: ['Pipelines de dados', 'Qualidade e deduplicação', 'Arquitetura escalável'],
      why: 'Junta as fontes de dados de que o agente precisa.',
    },
    {
      id: 'desenvolvimento',
      name: 'Desenvolvimento',
      short: 'Software à medida: portais, integrações, APIs e aplicações.',
      bullets: ['Integrações e APIs', 'Portais e painéis internos', 'Aplicações web e mobile'],
      why: 'Liga o agente aos sistemas que já usa.',
    },
    {
      id: 'analytics',
      name: 'Analytics',
      short: 'Painéis e indicadores para decidir com base em dados.',
      bullets: ['Painéis em tempo real', 'Relatórios automáticos', 'Alertas de desvio'],
      why: 'Mostra-lhe o impacto do agente em números.',
    },
  ],

  caps: {
    title: 'Capacidades',
    unlocked: 'ativada para o seu caso',
    available: 'disponível',
    why: 'Porquê',
  },

  booking: {
    title: 'Agendar 30 minutos',
    duration: '30 min · videochamada · sem compromisso',
    day: 'Dia',
    time: 'Hora (Lisboa)',
    name: 'Nome',
    company: 'Empresa (opcional)',
    contact: 'Email ou telefone',
    contactHint: 'Só para confirmarmos a reunião.',
    notes: 'Algo que devamos saber? (opcional)',
    consent: 'Aceito que a DevloperEU use estes dados apenas para responder a este pedido, conforme a',
    consentLink: 'Política de Privacidade',
    whatsapp: 'Enviar pedido por WhatsApp',
    email: 'Enviar por email',
    calendar: 'Abrir calendário',
    preview: 'Mensagem que o agente preparou',
    errors: {
      day: 'Escolha um dia.',
      time: 'Escolha uma hora.',
      name: 'Indique o seu nome.',
      contact: 'Indique um email ou telefone válido.',
      consent: 'É necessário o seu consentimento para enviarmos o pedido.',
    },
    message: {
      greeting: 'Olá DevloperEU! Gostaria de agendar uma reunião de 30 min.',
      when: 'Quando: {day} às {time} (hora de Lisboa)',
      name: 'Nome: {name}',
      company: 'Empresa: {company}',
      contact: 'Contacto: {contact}',
      case: 'Caso: {sector} · {pain} · {people} pessoas × {hours} h/semana',
      notes: 'Notas: {notes}',
      subject: 'Pedido de reunião — {day} {time}',
    },
    done: 'Pedido preparado',
    doneBody: 'Se a janela não abriu, use os contactos abaixo.',
  },

  classic: {
    eyebrow: 'Agentes de IA · Hiperautomação · Braga, Portugal',
    h1: 'Agentes de IA que tratam o trabalho repetitivo da sua empresa',
    lead:
      'A DevloperEU desenha, integra e acompanha agentes de IA e automações à medida — ligados aos sistemas que já usa, com uma pessoa no circuito quando faz falta.',
    ctaPrimary: 'Agendar 30 minutos',
    ctaSecondary: 'Conversar com o agente',
    servicesTitle: 'O que fazemos',
    servicesLead: '{caps} capacidades de IA em {groups} áreas. Combinamos as que resolvem o seu problema — não o contrário.',
    processTitle: 'Como trabalhamos',
    process: [
      { t: 'Conversa de 30 min', d: 'Percebemos o processo, os sistemas e onde se perde tempo.' },
      { t: 'Diagnóstico', d: 'Mapeamos o fluxo e dizemos o que é viável, com riscos e prioridades.' },
      { t: 'Protótipo', d: 'Um primeiro agente a funcionar num caso real, para validar com a equipa.' },
      { t: 'Implementação e acompanhamento', d: 'Integração completa, formação e melhoria contínua.' },
    ],
    aboutTitle: 'Sobre a DevloperEU',
    about: [
      'Fundada em 2024 em Braga, Portugal, a DevloperEU cria agentes de IA e soluções de automação para empresas em Portugal e na Europa.',
      'Trabalhamos em {langs} idiomas e com foco no que se consegue medir: menos tarefas manuais, respostas mais rápidas e dados mais fiáveis — sempre em conformidade com o RGPD.',
    ],
    faqTitle: 'Perguntas frequentes',
    bookingTitle: 'Agendar uma reunião',
    bookingLead: 'Escolha dia e hora. O pedido segue por WhatsApp ou email, já preenchido.',
    contactTitle: 'Contactos',
    servicesCta: 'Ver o fluxo no agente',
    servicesMore: 'Não sabe por onde começar? Em 30 minutos dizemos-lhe quais fazem sentido para si.',
    processLead: 'Do primeiro contacto ao agente em produção, em {n} passos — sempre com a sua equipa no circuito.',
    tags: ['Capacidades', 'Método', 'Quem somos', 'Dúvidas', 'Agendar'],
    facts: { founded: 'Fundada', base: 'Base', languages: 'Idiomas', capabilities: 'Capacidades de IA', compliance: 'Dados', complianceValue: 'RGPD' },
    faqAsk: 'Não encontra a resposta?',
    faqAskCta: 'Pergunte ao agente',
  },

  faq: [
    {
      q: 'O que é um agente de IA?',
      a: 'É um programa que entende pedidos em linguagem natural, consulta os seus sistemas e executa tarefas — responder a clientes, ler documentos, atualizar o CRM — dentro de regras que definimos consigo.',
    },
    {
      q: 'Temos de mudar os sistemas que já usamos?',
      a: 'Normalmente não. Ligamos o agente ao que já existe (email, WhatsApp, ERP, CRM, folhas de cálculo) através de integrações e APIs.',
    },
    {
      q: 'Os dados ficam seguros e em conformidade com o RGPD?',
      a: 'Sim. Tratamos apenas os dados necessários, com acessos controlados e registo das ações do agente. Na reunião explicamos onde os dados ficam alojados em cada solução.',
    },
    {
      q: 'Quanto custa?',
      a: 'Depende do âmbito. Depois da conversa inicial e do diagnóstico, apresentamos uma proposta com fases e valores fechados.',
    },
    {
      q: 'Quanto tempo demora a ter um agente a funcionar?',
      a: 'Depende da complexidade e das integrações. Começamos por um protótipo num caso concreto para validar cedo; o prazo exato é definido no diagnóstico.',
    },
    {
      q: 'O agente substitui pessoas?',
      a: 'O objetivo é libertar a equipa do trabalho repetitivo. Decisões sensíveis ficam com uma pessoa, que o agente prepara e informa.',
    },
    {
      q: 'Trabalham apenas em Braga?',
      a: 'Estamos em Braga, mas trabalhamos remotamente com empresas de todo o país e da Europa.',
    },
    {
      q: 'A primeira reunião tem compromisso?',
      a: 'Não. São 30 minutos para perceber o seu caso e dizer-lhe, com franqueza, se e como a IA ajuda.',
    },
  ],

  magnet: {
    title: 'Checklist: {tasks} tarefas que um agente de IA pode assumir já',
    lead: 'Marque as que acontecem na sua empresa. Se marcou três ou mais, há um agente a ganhar tempo por si.',
    cta: 'Ver a checklist gratuita',
    print: 'Guardar em PDF / imprimir',
    back: 'Voltar ao agente',
    footer: 'Quer saber por qual começar? Agende 30 minutos connosco.',
    items: [
      'Responder a perguntas repetidas de clientes (horários, preços, disponibilidade)',
      'Triar e encaminhar emails para a pessoa certa',
      'Marcar, confirmar e lembrar reuniões ou consultas',
      'Extrair dados de faturas, recibos e contratos',
      'Lançar documentos no ERP ou na contabilidade',
      'Qualificar contactos que chegam pelo site ou anúncios',
      'Atualizar o CRM depois de cada conversa',
      'Enviar seguimentos a propostas sem resposta',
      'Juntar dados de várias folhas num relatório semanal',
      'Detetar desvios em vendas, custos ou stock',
      'Prever ruturas e preparar encomendas a fornecedores',
      'Responder a pedidos internos de informação (RH, procedimentos)',
    ],
  },

  ai: {
    placeholder: 'Escreva ao agente…',
    send: 'Enviar',
    mic: 'Falar com o agente',
    micStop: 'Parar e enviar',
    listening: 'A ouvir… fale à vontade',
    transcribing: 'A transcrever…',
    speaking: 'A falar…',
    mute: 'Silenciar voz',
    unmute: 'Ativar voz',
    thinking: 'A pensar…',
    consentTitle: 'Antes de conversarmos',
    consentText: 'Para lhe responder, as suas mensagens são processadas por um modelo de IA ({provider}). Não partilhe dados sensíveis. Detalhes na',
    consentLink: 'Política de Privacidade',
    consentAccept: 'Aceitar e continuar',
    consentDecline: 'Prefiro as opções guiadas',
    fallback: 'Para já sigo pelas opções guiadas — escolha uma abaixo.',
    micDenied: 'Não consegui aceder ao microfone. Pode escrever a sua mensagem.',
    caseLine: 'Caso: {summary}',
    live: 'IA em direto',
    company: 'Empresa',
    systems: 'Sistemas',
    peopleUnit: 'pessoas',
    closedTitle: 'Obrigado pela conversa',
    closedBody: 'Deixo-lhe a checklist gratuita das {tasks} tarefas que um agente de IA pode assumir — e os nossos contactos para quando fizer sentido.',
    limitNote: 'Para irmos mais longe, o melhor é falarmos 30 minutos com os seus dados — deixei o agendamento pronto no palco.',
    voiceInsecure: 'A voz precisa de uma ligação segura (https). Abra o site em https:// ou escreva a mensagem.',
    voiceDenied: 'O microfone está bloqueado. Autorize-o no ícone do cadeado, na barra de endereço, e tente de novo.',
    voiceNoDevice: 'Não encontrei nenhum microfone ligado.',
    voiceNoSpeech: 'Não ouvi nada. Fale um pouco mais perto do microfone.',
    voiceUnsupported: 'Este browser não permite voz aqui. Pode escrever a sua mensagem.',
    voiceSttFailed: 'Não consegui transcrever o áudio. Tente de novo ou escreva.',
    retry: 'Tentar de novo',
    playReply: 'Ouvir resposta',
  },

  hud: {
    kicker: 'Mega Brain · centro de comando',
    title: 'Capacidades de IA para {sector}',
    titleGeneric: 'Capacidades de IA para a sua empresa',
    online: 'núcleo online',
    active: 'módulos ativos',
    context: 'contexto',
    mode: 'modo',
    demo: 'demonstração',
    sound: 'Som',
    on: 'ligado',
    off: 'desligado',
    how: 'Como funciona',
    flowTitle: 'Exemplo de fluxo adaptado ao seu caso',
    illustrative: 'Exemplo ilustrativo — não é um caso real nem um resultado prometido.',
    steps: ['Entrada', 'Agente', 'Ferramentas', 'Resultado'],
    cta: 'Ver isto com os meus dados — marcar 30 min',
    hint: 'Toque num módulo para ver como funciona no seu caso.',
    core: 'Núcleo neuronal DevloperEU',
  },

  exit: {
    title: 'Antes de ir…',
    body: 'Leve a checklist gratuita das {tasks} tarefas que um agente de IA pode assumir já. Sem registo.',
    cta: 'Ver a checklist',
    alt: 'Agendar 30 minutos',
    close: 'Não, obrigado',
  },

  cookies: {
    text: 'Usamos armazenamento essencial para o site funcionar. Com a sua autorização, usamos também o Meta Pixel para medir campanhas. Pode mudar de ideias a qualquer momento.',
    accept: 'Aceitar',
    reject: 'Rejeitar',
    policy: 'Política de Cookies',
    manage: 'Preferências de cookies',
  },

  footer: {
    tagline: 'Agentes de IA e hiperautomação para empresas. Braga, Portugal — desde 2024.',
    contact: 'Contacto',
    follow: 'Redes',
    legal: 'Legal',
    languages: 'Idiomas',
    rights: 'Todos os direitos reservados.',
  },

  legal: {
    updated: 'Última atualização: 27 de setembro de 2026',
    privacy: {
      title: 'Política de Privacidade',
      sections: [
        {
          h: '1. Responsável pelo tratamento',
          p: ['DevloperEU (devloper.eu), Braga, Portugal. Contacto: devlopereu@gmail.com.'],
        },
        {
          h: '2. Que dados tratamos',
          items: [
            'Dados que nos envia ao pedir uma reunião: nome, empresa, email ou telefone, dia e hora preferidos e notas.',
            'Respostas que dá ao agente do site (setor, prioridade, dimensão da equipa) — ficam apenas no seu navegador, salvo se as incluir no pedido.',
            'Dados de medição de campanhas (Meta Pixel), apenas se aceitar cookies de marketing.',
            'Mensagens escritas ou ditas ao agente do site: depois do aviso no chat, são enviadas ao fornecedor de IA configurado (p. ex. Google Gemini) apenas para gerar a resposta; não as guardamos no servidor. A voz é transcrita no browser ou, se necessário, pelo mesmo fornecedor.',
          ],
        },
        {
          h: '3. Finalidades e base legal',
          items: [
            'Responder ao seu pedido e agendar a reunião — diligências pré-contratuais a seu pedido.',
            'Medição de campanhas — consentimento, que pode retirar a qualquer momento.',
            'Cumprimento de obrigações legais, quando aplicável.',
          ],
        },
        {
          h: '4. Conservação',
          p: ['Os pedidos de contacto são conservados pelo tempo necessário para lhes dar seguimento e, no máximo, 24 meses sem nova interação.'],
        },
        {
          h: '5. Partilha e transferências',
          p: [
            'Os pedidos seguem pelo canal que escolher (WhatsApp ou email), sujeitos às políticas desses serviços. Com o seu consentimento, a Meta Platforms recebe dados de navegação para medição; podem existir transferências para fora do EEE ao abrigo de cláusulas contratuais-tipo.',
          ],
        },
        {
          h: '6. Os seus direitos',
          items: [
            'Acesso, retificação e apagamento dos seus dados.',
            'Limitação e oposição ao tratamento e portabilidade.',
            'Retirar o consentimento a qualquer momento, sem afetar o tratamento anterior.',
            'Reclamação junto da CNPD (www.cnpd.pt).',
          ],
        },
      ],
    },
    cookies: {
      title: 'Política de Cookies',
      sections: [
        {
          h: '1. O que usamos',
          items: [
            'Essenciais (armazenamento local): guardam a sua escolha de cookies, o idioma e o modo de visualização. Não exigem consentimento.',
            'Marketing (Meta Pixel, id 998154455530660): só é carregado depois de clicar «Aceitar». Mede visitas e conversões de campanhas.',
          ],
        },
        {
          h: '2. Como gerir',
          p: [
            'Pode alterar a sua escolha a qualquer momento no link «Preferências de cookies» no rodapé, ou apagar os dados do site nas definições do navegador.',
          ],
        },
        {
          h: '3. Duração',
          items: ['A sua escolha é guardada até a alterar ou apagar os dados do navegador.', 'Os cookies da Meta seguem os prazos definidos pela Meta (até 90 dias).'],
        },
      ],
    },
    terms: {
      title: 'Termos de Utilização',
      sections: [
        {
          h: '1. Aceitação',
          p: ['Ao utilizar devloper.eu aceita estes termos. Se não concordar, não utilize o site.'],
        },
        {
          h: '2. O site',
          p: [
            'O agente e as simulações apresentadas são ilustrativos e não constituem proposta comercial. Os resultados reais dependem de cada caso e são avaliados em reunião.',
          ],
        },
        {
          h: '3. Propriedade intelectual',
          p: ['A marca, o logótipo, os textos e o código do site pertencem à DevloperEU e não podem ser reutilizados sem autorização.'],
        },
        {
          h: '4. Responsabilidade',
          p: ['Esforçamo-nos por manter a informação correta e atualizada, mas não garantimos a ausência de erros ou interrupções.'],
        },
        {
          h: '5. Lei aplicável',
          p: ['Estes termos regem-se pela lei portuguesa. É competente o foro da comarca de Braga, sem prejuízo das normas imperativas de proteção do consumidor.'],
        },
      ],
    },
  },
};

type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? Widen<U>[]
    : T extends object
      ? { [K in keyof T]: Widen<T[K]> }
      : T;

export type Dict = Widen<typeof pt>;
