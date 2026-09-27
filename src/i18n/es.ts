import type { Dict } from './pt';

export const es: Dict = {
  meta: {
    title: 'DevloperEU — Agentes de IA y automatización para empresas | Braga, Portugal',
    description:
      'Agentes de IA e hiperautomatización para empresas en Portugal y Europa. Hable con nuestro agente, vea una simulación de su caso y reserve 30 minutos. Braga, desde 2024.',
    ogAlt: 'Logotipo de DevloperEU — cabeza con red neuronal dorada',
    ogLocale: 'es_ES',
  },

  ui: {
    skip: 'Saltar al contenido',
    modeLabel: 'Modo de visualización',
    modeChat: 'Conversar',
    modeRead: 'Navegar',
    book: 'Reservar reunión',
    bookShort: 'Reservar',
    language: 'Idioma',
    status: 'agente en línea',
    location: 'Braga, PT',
    restart: 'Empezar de nuevo',
    skipToBooking: 'Ir directamente a la reserva',
    toClassic: 'Modo clásico',
    toChat: 'Hablar con el agente',
    simulation: 'Simulación ilustrativa',
    typing: 'El agente está escribiendo…',
    stageLabel: 'Escenario del agente',
    chatLabel: 'Conversación con el agente',
    answersLabel: 'Respuestas sugeridas',
    close: 'Cerrar',
    you: 'Usted',
    agent: 'Agente DevloperEU',
    home: 'Página de inicio',
  },

  boot: ['iniciando agente devloper.eu', 'cargando capacidades · 6/6', 'contexto · empresas en Portugal y Europa', 'listo'],

  chat: {
    intro: 'Hola. Soy el agente de DevloperEU.',
    introSub:
      'En menos de un minuto le muestro lo que haría un agente de IA en su empresa, con una simulación de su caso. Sin formularios.',
    introYes: 'Muéstreme en mi empresa',
    introNo: 'Prefiero navegar por el sitio',
    askSector: 'Para empezar: ¿en qué sector trabaja su empresa?',
    askPain: 'Entendido: {sector}. ¿Dónde pierde hoy más tiempo su equipo?',
    askTeam: 'Última pregunta. ¿Cuántas personas se ocupan de esto y cuántas horas a la semana dedica cada una?',
    people: 'Personas implicadas',
    hours: 'Horas por persona, por semana',
    confirmTeam: 'Montar mi agente',
    teamAnswer: '{people} personas · {hours} h/semana cada una',
    building: 'Perfecto. Montando un agente de {pain} para {sector}… mire el escenario.',
    simDone:
      'Este es el agente trabajando en su caso. Si asume la mitad de las tareas repetitivas, su equipo recupera unas {result} horas por semana.',
    simNote: 'Es una simulación ilustrativa con los números que me ha dado; en la reunión lo medimos con sus datos reales.',
    toCaps: '¿Qué capacidades usaría?',
    capsIntro:
      'Para su caso he activado {count} capacidades. Las demás también están disponibles: toque cualquiera para saber más.',
    capsOpened: '{name}: {short}',
    toBook: 'Quiero verlo con mis datos',
    askBook:
      'Le propongo 30 minutos por videollamada: entendemos el proceso, le mostramos el agente con sus datos y le decimos qué es viable. Elija día y hora en el escenario.',
    bookedWhatsapp: 'Solicitud preparada y abierta en WhatsApp. En cuanto la envíe, confirmamos la hora.',
    bookedEmail: 'Solicitud preparada en su cliente de correo. En cuanto la envíe, confirmamos la hora.',
    bookedCalendar: 'He abierto nuestro calendario en una nueva ventana para confirmar la hora.',
    afterBook: 'Mientras espera, llévese la checklist gratuita de 12 tareas que un agente de IA puede asumir ya.',
    magnetCta: 'Abrir la checklist',
    jumpBook: 'Vamos directamente a la reserva. Elija día y hora en el escenario; del resto me encargo yo.',
  },

  sectors: [
    { id: 'comercio', label: 'Comercio y e-commerce', who: 'clientes de la tienda' },
    { id: 'servicos', label: 'Servicios profesionales', who: 'clientes' },
    { id: 'industria', label: 'Industria y logística', who: 'clientes y proveedores' },
    { id: 'saude', label: 'Salud y clínicas', who: 'pacientes' },
    { id: 'imobiliario', label: 'Inmobiliaria', who: 'interesados' },
    { id: 'turismo', label: 'Turismo y restauración', who: 'huéspedes y clientes' },
  ],

  pains: [
    {
      id: 'atendimento',
      label: 'Atención al cliente y mensajes',
      agentName: 'atención al cliente',
      flow: ['WhatsApp, email y web', 'El agente entiende la solicitud', 'Consulta sus sistemas', 'Responde y registra'],
      log: [
        'Nuevo mensaje por WhatsApp — «¿Aún tienen disponibilidad esta semana?»',
        'Intención detectada: disponibilidad · confianza 0,94',
        'Consulta a la agenda interna → 3 huecos libres',
        'Respuesta enviada con 3 opciones de horario',
        'Elección confirmada → registro creado en el CRM',
        'Resumen del día enviado al equipo',
      ],
      services: ['automacao', 'consultoria', 'desenvolvimento'],
    },
    {
      id: 'documentos',
      label: 'Facturas y documentos',
      agentName: 'documentos',
      flow: ['Email y escaneos', 'El agente lee el documento', 'Valida y cruza datos', 'Lo registra en el ERP'],
      log: [
        'Factura recibida por email — PDF, 2 páginas',
        'Campos extraídos: NIF, fecha, total, IVA',
        'Validación: el NIF del proveedor coincide',
        'Cruce con el pedido → los importes coinciden',
        'Asiento preparado en el ERP para aprobación',
        'Excepción señalada: 1 documento sin pedido',
      ],
      services: ['automacao', 'machine_learning', 'desenvolvimento'],
    },
    {
      id: 'agenda',
      label: 'Citas y agenda',
      agentName: 'citas',
      flow: ['Solicitudes de cita', 'El agente propone horarios', 'Sincroniza la agenda', 'Confirma y recuerda'],
      log: [
        'Solicitud de cita recibida por la web',
        'Preferencia detectada: última hora de la tarde',
        'Agenda del equipo consultada → 2 opciones',
        'Cita confirmada y añadida al calendario',
        'Recordatorio programado para el día anterior',
        'Cancelación recibida → hueco reabierto automáticamente',
      ],
      services: ['automacao', 'desenvolvimento'],
    },
    {
      id: 'leads',
      label: 'Leads y ventas',
      agentName: 'ventas',
      flow: ['Formularios y anuncios', 'El agente cualifica', 'Actualiza el CRM', 'Hace el seguimiento'],
      log: [
        'Nuevo contacto por el formulario web',
        'Enriquecimiento: sector y tamaño identificados',
        'Puntuación de cualificación: 82/100',
        'Oportunidad creada en el CRM con resumen',
        'Primera respuesta personalizada enviada',
        'Seguimiento programado dentro de 3 días',
      ],
      services: ['automacao', 'analytics', 'machine_learning'],
    },
    {
      id: 'relatorios',
      label: 'Informes y datos',
      agentName: 'informes',
      flow: ['Hojas, ERP y CRM', 'El agente reúne los datos', 'Calcula indicadores', 'Envía el informe'],
      log: [
        'Recogida: 4 fuentes de datos conectadas',
        'Limpieza: 37 filas duplicadas eliminadas',
        'Indicadores semanales calculados',
        'Desviación detectada: ventas zona norte −12 %',
        'Informe PDF generado y panel actualizado',
        'Alerta enviada a la dirección',
      ],
      services: ['analytics', 'big_data', 'automacao'],
    },
    {
      id: 'operacoes',
      label: 'Pedidos y stock',
      agentName: 'operaciones',
      flow: ['Pedidos y ventas', 'El agente prevé la demanda', 'Comprueba el stock', 'Prepara la reposición'],
      log: [
        'Pedido recibido — 3 artículos',
        'Stock comprobado en 2 almacenes',
        'Previsión: rotura del artículo A en 9 días',
        'Propuesta de reposición generada',
        'Pedido al proveedor preparado para aprobación',
        'Cliente informado del plazo de entrega',
      ],
      services: ['machine_learning', 'big_data', 'automacao'],
    },
  ],

  profile: {
    title: 'Ficha de la empresa',
    subtitle: 'generada en directo por el agente',
    sector: 'Sector',
    pain: 'Prioridad',
    team: 'Equipo',
    hours: 'Tiempo dedicado',
    pending: 'esperando…',
    peopleUnit: 'personas',
    hoursUnit: 'h/semana cada una',
  },

  sim: {
    title: 'Agente de {pain}',
    running: 'en ejecución',
    events: 'Registro de eventos',
    tasks: 'Tareas gestionadas',
    response: 'Respuesta',
    responseValue: '< 5 s',
    scenario: 'Escenario: horas liberadas por semana',
    formula: '{people} personas × {hours} h × {share}% = {result} h',
    disclaimer: 'Simulación ilustrativa. Los valores reales dependen de su proceso y se miden en la reunión.',
  },

  services: [
    {
      id: 'consultoria',
      name: 'Consultoría IA',
      short: 'Estrategia y diagnóstico: dónde la IA da retorno en su empresa.',
      bullets: ['Mapa de procesos y oportunidades', 'Plan por fases con prioridades', 'Elección de herramientas y riesgos (RGPD, AI Act)'],
      why: 'Define por dónde empezar y qué no merece la pena automatizar.',
    },
    {
      id: 'automacao',
      name: 'Automatización',
      short: 'Agentes de IA e hiperautomatización que gestionan tareas repetitivas de principio a fin.',
      bullets: ['Agentes en WhatsApp, email y web', 'Integración con ERP, CRM y hojas de cálculo', 'Una persona en el circuito cuando hace falta'],
      why: 'Es el motor del agente que ha visto en la simulación.',
    },
    {
      id: 'machine_learning',
      name: 'Machine Learning',
      short: 'Modelos que clasifican, extraen y predicen a partir de sus datos.',
      bullets: ['Lectura de documentos', 'Previsión de demanda y riesgos', 'Clasificación de solicitudes'],
      why: 'Da al agente la capacidad de leer, clasificar y predecir.',
    },
    {
      id: 'big_data',
      name: 'Big Data',
      short: 'Recogida, limpieza y organización de datos dispersos en varias fuentes.',
      bullets: ['Pipelines de datos', 'Calidad y deduplicación', 'Arquitectura escalable'],
      why: 'Reúne las fuentes de datos que necesita el agente.',
    },
    {
      id: 'desenvolvimento',
      name: 'Desarrollo',
      short: 'Software a medida: portales, integraciones, API y aplicaciones.',
      bullets: ['Integraciones y API', 'Portales y paneles internos', 'Aplicaciones web y móviles'],
      why: 'Conecta el agente con los sistemas que ya usa.',
    },
    {
      id: 'analytics',
      name: 'Analytics',
      short: 'Paneles e indicadores para decidir con datos.',
      bullets: ['Paneles en tiempo real', 'Informes automáticos', 'Alertas de desviación'],
      why: 'Le muestra el impacto del agente en cifras.',
    },
  ],

  caps: {
    title: 'Capacidades',
    unlocked: 'activada para su caso',
    available: 'disponible',
    why: 'Por qué',
  },

  booking: {
    title: 'Reservar 30 minutos',
    duration: '30 min · videollamada · sin compromiso',
    day: 'Día',
    time: 'Hora (Lisboa)',
    name: 'Nombre',
    company: 'Empresa (opcional)',
    contact: 'Email o teléfono',
    contactHint: 'Solo para confirmar la reunión.',
    notes: '¿Algo que debamos saber? (opcional)',
    consent: 'Acepto que DevloperEU use estos datos únicamente para responder a esta solicitud, conforme a la',
    consentLink: 'Política de Privacidad',
    whatsapp: 'Enviar solicitud por WhatsApp',
    email: 'Enviar por email',
    calendar: 'Abrir calendario',
    preview: 'Mensaje que ha preparado el agente',
    errors: {
      day: 'Elija un día.',
      time: 'Elija una hora.',
      name: 'Indique su nombre.',
      contact: 'Indique un email o teléfono válido.',
      consent: 'Necesitamos su consentimiento para enviar la solicitud.',
    },
    message: {
      greeting: '¡Hola, DevloperEU! Me gustaría reservar una reunión de 30 min.',
      when: 'Cuándo: {day} a las {time} (hora de Lisboa)',
      name: 'Nombre: {name}',
      company: 'Empresa: {company}',
      contact: 'Contacto: {contact}',
      case: 'Caso: {sector} · {pain} · {people} personas × {hours} h/semana',
      notes: 'Notas: {notes}',
      subject: 'Solicitud de reunión — {day} {time}',
    },
    done: 'Solicitud preparada',
    doneBody: 'Si la ventana no se ha abierto, use los contactos de abajo.',
  },

  classic: {
    eyebrow: 'Agentes de IA · Hiperautomatización · Braga, Portugal',
    h1: 'Agentes de IA que se encargan del trabajo repetitivo de su empresa',
    lead:
      'DevloperEU diseña, integra y acompaña agentes de IA y automatizaciones a medida, conectados a los sistemas que ya usa y con una persona en el circuito cuando hace falta.',
    ctaPrimary: 'Reservar 30 minutos',
    ctaSecondary: 'Hablar con el agente',
    servicesTitle: 'Qué hacemos',
    servicesLead: 'Seis capacidades que combinamos según el problema, y no al revés.',
    processTitle: 'Cómo trabajamos',
    process: [
      { t: 'Conversación de 30 min', d: 'Entendemos el proceso, los sistemas y dónde se pierde tiempo.' },
      { t: 'Diagnóstico', d: 'Mapeamos el flujo y le decimos qué es viable, con riesgos y prioridades.' },
      { t: 'Prototipo', d: 'Un primer agente funcionando en un caso real, para validarlo con el equipo.' },
      { t: 'Implantación y seguimiento', d: 'Integración completa, formación y mejora continua.' },
    ],
    aboutTitle: 'Sobre DevloperEU',
    about: [
      'Fundada en 2024 en Braga, Portugal, DevloperEU crea agentes de IA y soluciones de automatización para empresas en Portugal y Europa.',
      'Trabajamos en seis idiomas y nos centramos en lo que se puede medir: menos tareas manuales, respuestas más rápidas y datos más fiables, siempre cumpliendo el RGPD.',
    ],
    faqTitle: 'Preguntas frecuentes',
    bookingTitle: 'Reservar una reunión',
    bookingLead: 'Elija día y hora. La solicitud sale por WhatsApp o email, ya rellenada.',
    contactTitle: 'Contacto',
  },

  faq: [
    {
      q: '¿Qué es un agente de IA?',
      a: 'Es un programa que entiende solicitudes en lenguaje natural, consulta sus sistemas y ejecuta tareas —responder a clientes, leer documentos, actualizar el CRM— dentro de reglas que definimos con usted.',
    },
    {
      q: '¿Tenemos que cambiar los sistemas que ya usamos?',
      a: 'Normalmente no. Conectamos el agente con lo que ya existe (email, WhatsApp, ERP, CRM, hojas de cálculo) mediante integraciones y API.',
    },
    {
      q: '¿Los datos están seguros y cumplen el RGPD?',
      a: 'Sí. Tratamos solo los datos necesarios, con accesos controlados y registro de las acciones del agente. En la reunión le explicamos dónde se alojan los datos en cada solución.',
    },
    {
      q: '¿Cuánto cuesta?',
      a: 'Depende del alcance. Tras la conversación inicial y el diagnóstico, presentamos una propuesta con fases y precios cerrados.',
    },
    {
      q: '¿Cuánto se tarda en tener un agente funcionando?',
      a: 'Depende de la complejidad y de las integraciones. Empezamos con un prototipo en un caso concreto para validar pronto; el plazo exacto se fija en el diagnóstico.',
    },
    {
      q: '¿El agente sustituye a personas?',
      a: 'El objetivo es liberar al equipo del trabajo repetitivo. Las decisiones delicadas quedan en manos de una persona, a la que el agente prepara e informa.',
    },
    {
      q: '¿Trabajan solo en Braga?',
      a: 'Estamos en Braga, pero trabajamos en remoto con empresas de todo Portugal y de Europa.',
    },
    {
      q: '¿La primera reunión implica algún compromiso?',
      a: 'No. Son 30 minutos para entender su caso y decirle con franqueza si la IA puede ayudar y cómo.',
    },
  ],

  magnet: {
    title: 'Checklist: 12 tareas que un agente de IA puede asumir ya',
    lead: 'Marque las que ocurren en su empresa. Si ha marcado tres o más, hay un agente que puede ahorrarle tiempo.',
    cta: 'Ver la checklist gratuita',
    print: 'Guardar en PDF / imprimir',
    back: 'Volver al agente',
    footer: '¿Quiere saber por cuál empezar? Reserve 30 minutos con nosotros.',
    items: [
      'Responder preguntas repetidas de clientes (horarios, precios, disponibilidad)',
      'Clasificar y reenviar emails a la persona adecuada',
      'Reservar, confirmar y recordar reuniones o citas',
      'Extraer datos de facturas, recibos y contratos',
      'Registrar documentos en el ERP o en la contabilidad',
      'Cualificar contactos que llegan por la web o los anuncios',
      'Actualizar el CRM después de cada conversación',
      'Hacer seguimiento de propuestas sin respuesta',
      'Reunir datos de varias hojas en un informe semanal',
      'Detectar desviaciones en ventas, costes o stock',
      'Prever roturas de stock y preparar pedidos a proveedores',
      'Responder solicitudes internas de información (RR. HH., procedimientos)',
    ],
  },

  ai: {
    placeholder: 'Escriba al agente…',
    send: 'Enviar',
    mic: 'Hablar con el agente',
    micStop: 'Parar y enviar',
    listening: 'Le escucho…',
    transcribing: 'Transcribiendo…',
    speaking: 'Hablando…',
    mute: 'Silenciar voz',
    unmute: 'Activar voz',
    thinking: 'Pensando…',
    consentTitle: 'Antes de hablar',
    consentText: 'Para responderle, sus mensajes los procesa un modelo de IA ({provider}). No comparta datos sensibles. Detalles en la',
    consentLink: 'Política de Privacidad',
    consentAccept: 'Aceptar y continuar',
    consentDecline: 'Prefiero las opciones guiadas',
    fallback: 'Por ahora sigo con las opciones guiadas: elija una abajo.',
    micDenied: 'No he podido acceder al micrófono. Puede escribir su mensaje.',
    caseLine: 'Caso: {summary}',
    live: 'IA en directo',
    company: 'Empresa',
    systems: 'Sistemas',
    peopleUnit: 'personas',
    closedTitle: 'Gracias por la conversación',
    closedBody: 'Le dejo la checklist gratuita de 12 tareas que un agente de IA puede asumir, y nuestros contactos para cuando tenga sentido.',
    limitNote: 'Para ir más allá, lo mejor es hablar 30 minutos con sus datos: he dejado la reserva lista en el escenario.',
  },

  exit: {
    title: 'Antes de irse…',
    body: 'Llévese la checklist gratuita de 12 tareas que un agente de IA puede asumir ya. Sin registro.',
    cta: 'Ver la checklist',
    alt: 'Reservar 30 minutos',
    close: 'No, gracias',
  },

  cookies: {
    text: 'Usamos almacenamiento esencial para que el sitio funcione. Con su autorización, también usamos el Meta Pixel para medir campañas. Puede cambiar de opinión en cualquier momento.',
    accept: 'Aceptar',
    reject: 'Rechazar',
    policy: 'Política de Cookies',
    manage: 'Preferencias de cookies',
  },

  footer: {
    tagline: 'Agentes de IA e hiperautomatización para empresas. Braga, Portugal — desde 2024.',
    contact: 'Contacto',
    follow: 'Redes',
    legal: 'Legal',
    languages: 'Idiomas',
    rights: 'Todos los derechos reservados.',
  },

  legal: {
    updated: 'Última actualización: 27 de septiembre de 2026',
    privacy: {
      title: 'Política de Privacidad',
      sections: [
        {
          h: '1. Responsable del tratamiento',
          p: ['DevloperEU (devloper.eu), Braga, Portugal. Contacto: contato@devlopereu.com.'],
        },
        {
          h: '2. Qué datos tratamos',
          items: [
            'Los datos que nos envía al solicitar una reunión: nombre, empresa, email o teléfono, día y hora preferidos y notas.',
            'Las respuestas que da al agente del sitio (sector, prioridad, tamaño del equipo): se quedan solo en su navegador, salvo que las incluya en la solicitud.',
            'Datos de medición de campañas (Meta Pixel), solo si acepta las cookies de marketing.',
            'Mensajes escritos o dictados al agente del sitio: tras el aviso en el chat, se envían al proveedor de IA configurado (p. ej. Google Gemini) solo para generar la respuesta; no los guardamos en el servidor. La voz se transcribe en el navegador o, si es necesario, por el mismo proveedor.',
          ],
        },
        {
          h: '3. Finalidades y base jurídica',
          items: [
            'Responder a su solicitud y programar la reunión — medidas precontractuales a petición suya.',
            'Medición de campañas — consentimiento, que puede retirar en cualquier momento.',
            'Cumplimiento de obligaciones legales, cuando proceda.',
          ],
        },
        {
          h: '4. Conservación',
          p: ['Las solicitudes de contacto se conservan el tiempo necesario para darles seguimiento y, como máximo, 24 meses sin nueva interacción.'],
        },
        {
          h: '5. Cesión y transferencias',
          p: [
            'Las solicitudes viajan por el canal que elija (WhatsApp o email), sujetas a las políticas de esos servicios. Con su consentimiento, Meta Platforms recibe datos de navegación para medición; puede haber transferencias fuera del EEE al amparo de cláusulas contractuales tipo.',
          ],
        },
        {
          h: '6. Sus derechos',
          items: [
            'Acceso, rectificación y supresión de sus datos.',
            'Limitación y oposición al tratamiento, y portabilidad.',
            'Retirar el consentimiento en cualquier momento, sin afectar al tratamiento anterior.',
            'Presentar una reclamación ante la CNPD (www.cnpd.pt).',
          ],
        },
      ],
    },
    cookies: {
      title: 'Política de Cookies',
      sections: [
        {
          h: '1. Qué usamos',
          items: [
            'Esenciales (almacenamiento local): guardan su elección de cookies, el idioma y el modo de visualización. No requieren consentimiento.',
            'Marketing (Meta Pixel, id 998154455530660): solo se carga después de pulsar «Aceptar». Mide visitas y conversiones de campañas.',
          ],
        },
        {
          h: '2. Cómo gestionarlas',
          p: [
            'Puede cambiar su elección en cualquier momento en el enlace «Preferencias de cookies» del pie de página, o borrar los datos del sitio en los ajustes del navegador.',
          ],
        },
        {
          h: '3. Duración',
          items: ['Su elección se guarda hasta que la cambie o borre los datos del navegador.', 'Las cookies de Meta siguen los plazos definidos por Meta (hasta 90 días).'],
        },
      ],
    },
    terms: {
      title: 'Términos de Uso',
      sections: [
        {
          h: '1. Aceptación',
          p: ['Al utilizar devloper.eu acepta estos términos. Si no está de acuerdo, no utilice el sitio.'],
        },
        {
          h: '2. El sitio',
          p: [
            'El agente y las simulaciones mostradas son ilustrativos y no constituyen una oferta comercial. Los resultados reales dependen de cada caso y se evalúan en una reunión.',
          ],
        },
        {
          h: '3. Propiedad intelectual',
          p: ['La marca, el logotipo, los textos y el código del sitio pertenecen a DevloperEU y no pueden reutilizarse sin autorización.'],
        },
        {
          h: '4. Responsabilidad',
          p: ['Nos esforzamos por mantener la información correcta y actualizada, pero no garantizamos la ausencia de errores o interrupciones.'],
        },
        {
          h: '5. Ley aplicable',
          p: ['Estos términos se rigen por la ley portuguesa. Son competentes los tribunales de la comarca de Braga, sin perjuicio de las normas imperativas de protección del consumidor.'],
        },
      ],
    },
  },
};
