/**
 * CATÁLOGO DE CAPACIDADES DE IA — ficheiro de dados para o dono editar.
 *
 * Cada capacidade tem, em 6 idiomas: nome, frase curta, «como funciona» (simples) e um FLUXO DE
 * EXEMPLO em 4 passos (entrada → agente → ferramentas → resultado). No fluxo podem usar-se:
 *   {who}    → quem contacta a empresa (ex.: «pacientes»), vindo da conversa
 *   {pain}   → o processo onde se perde tempo (ex.: «marcações»), vindo da conversa
 *   {sector} → o setor/empresa (ex.: «clínica dentária»), vindo da conversa
 * Os fluxos são SEMPRE exemplos ilustrativos — não citar clientes, números ou resultados reais.
 *
 * Se mudar os ids, atualize também src/data/capIds.ts (ids na ordem da órbita; dá o «N/N» do arranque)
 * e a lista `enum` da ferramenta unlock_capabilities em
 * public/api/agent-brain.json (o teste .verify/v5/catalog-check.cjs confirma que batem certo).
 */
import type { Lang } from '../i18n';
import type { CapId } from './capIds';

export type { CapId };

export type GroupId = 'agentes' | 'conhecimento' | 'integracao' | 'crescimento' | 'estrategia';
export type IconId =
  | 'agent'
  | 'phone'
  | 'chat'
  | 'network'
  | 'docs'
  | 'scan'
  | 'copilot'
  | 'plug'
  | 'gears'
  | 'database'
  | 'trend'
  | 'gauge'
  | 'pen'
  | 'target'
  | 'compass';

export interface CapText {
  name: string;
  tagline: string;
  how: string;
  /** 4 passos: entrada → agente → ferramentas → resultado */
  flow: [string, string, string, string];
}

export interface Capability {
  id: CapId;
  group: GroupId;
  icon: IconId;
  text: Record<Lang, CapText>;
}

export const GROUPS: Record<GroupId, Record<Lang, string>> = {
  agentes: { pt: 'Agentes', en: 'Agents', fr: 'Agents', es: 'Agentes', de: 'Agenten', sv: 'Agenter' },
  conhecimento: { pt: 'Conhecimento', en: 'Knowledge', fr: 'Connaissance', es: 'Conocimiento', de: 'Wissen', sv: 'Kunskap' },
  integracao: { pt: 'Integração', en: 'Integration', fr: 'Intégration', es: 'Integración', de: 'Integration', sv: 'Integration' },
  crescimento: { pt: 'Dados e crescimento', en: 'Data & growth', fr: 'Données et croissance', es: 'Datos y crecimiento', de: 'Daten & Wachstum', sv: 'Data & tillväxt' },
  estrategia: { pt: 'Estratégia', en: 'Strategy', fr: 'Stratégie', es: 'Estrategia', de: 'Strategie', sv: 'Strategi' },
};

/** Valores usados quando a conversa ainda não revelou o caso. */
export const GENERIC: Record<Lang, { who: string; pain: string; sector: string }> = {
  pt: { who: 'clientes', pain: 'o processo', sector: 'a empresa' },
  en: { who: 'customers', pain: 'the process', sector: 'the business' },
  fr: { who: 'clients', pain: 'le processus', sector: 'l’entreprise' },
  es: { who: 'clientes', pain: 'el proceso', sector: 'la empresa' },
  de: { who: 'Kunden', pain: 'den Prozess', sector: 'das Unternehmen' },
  sv: { who: 'kunder', pain: 'processen', sector: 'företaget' },
};

/** Capacidades recomendadas no fluxo guiado, por dor escolhida. */
export const PAIN_CAPS: Record<string, CapId[]> = {
  atendimento: ['whatsapp', 'agente-voz', 'rag-documentos', 'integracoes-mcp'],
  documentos: ['visao-ocr', 'processos-rpa', 'integracoes-mcp'],
  agenda: ['agente-voz', 'whatsapp', 'agentes-autonomos'],
  leads: ['leads', 'conteudo', 'dashboards'],
  relatorios: ['dashboards', 'dados-pipelines', 'copiloto-interno'],
  operacoes: ['previsao-ml', 'integracoes-mcp', 'dashboards'],
};

/** Ids antigos (6 serviços) → capacidade nova equivalente (compatibilidade com conversas antigas). */
export const LEGACY: Record<string, CapId> = {
  consultoria: 'estrategia',
  automacao: 'agentes-autonomos',
  machine_learning: 'previsao-ml',
  big_data: 'dados-pipelines',
  desenvolvimento: 'integracoes-mcp',
  analytics: 'dashboards',
};

export const CAPABILITIES: Capability[] = [
  {
    id: 'agentes-autonomos',
    group: 'agentes',
    icon: 'agent',
    text: {
      pt: { name: 'Agentes autónomos', tagline: 'Executam tarefas de várias etapas do início ao fim.', how: 'Recebe um objetivo, divide-o em passos, usa as ferramentas da empresa e só chama uma pessoa quando é preciso.', flow: ['Pedido de {who} sobre {pain}', 'O agente planeia os passos', 'Consulta sistemas e executa ações', 'Tarefa concluída e registada'] },
      en: { name: 'Autonomous agents', tagline: 'Carry out multi-step tasks from start to finish.', how: 'It takes a goal, breaks it into steps, uses your company’s tools and only calls a person when needed.', flow: ['{who} request about {pain}', 'The agent plans the steps', 'Checks systems and takes actions', 'Task done and logged'] },
      fr: { name: 'Agents autonomes', tagline: 'Réalisent des tâches en plusieurs étapes, de bout en bout.', how: 'Il reçoit un objectif, le découpe en étapes, utilise les outils de l’entreprise et ne sollicite une personne que si nécessaire.', flow: ['Demande de {who} sur {pain}', 'L’agent planifie les étapes', 'Consulte les systèmes et agit', 'Tâche terminée et enregistrée'] },
      es: { name: 'Agentes autónomos', tagline: 'Ejecutan tareas de varias etapas de principio a fin.', how: 'Recibe un objetivo, lo divide en pasos, usa las herramientas de la empresa y solo llama a una persona cuando hace falta.', flow: ['Solicitud de {who} sobre {pain}', 'El agente planifica los pasos', 'Consulta sistemas y ejecuta acciones', 'Tarea terminada y registrada'] },
      de: { name: 'Autonome Agenten', tagline: 'Erledigen mehrstufige Aufgaben von Anfang bis Ende.', how: 'Er erhält ein Ziel, zerlegt es in Schritte, nutzt Ihre Tools und holt nur bei Bedarf einen Menschen dazu.', flow: ['Anfrage von {who} zu {pain}', 'Der Agent plant die Schritte', 'Prüft Systeme und handelt', 'Aufgabe erledigt und protokolliert'] },
      sv: { name: 'Autonoma agenter', tagline: 'Utför uppgifter i flera steg från början till slut.', how: 'Den får ett mål, delar upp det i steg, använder företagets verktyg och kallar bara in en människa vid behov.', flow: ['Förfrågan från {who} om {pain}', 'Agenten planerar stegen', 'Kollar system och agerar', 'Uppgiften klar och loggad'] },
    },
  },
  {
    id: 'agente-voz',
    group: 'agentes',
    icon: 'phone',
    text: {
      pt: { name: 'Agente de voz e telefone', tagline: 'Atende chamadas 24/7 com voz natural.', how: 'Atende o telefone, percebe o que a pessoa precisa, responde ou marca — e passa a chamada à equipa quando faz sentido.', flow: ['Chamada de {who}', 'O agente de voz percebe o pedido', 'Consulta a agenda e as regras', 'Resposta falada e marcação feita'] },
      en: { name: 'Voice & phone agent', tagline: 'Answers calls 24/7 with a natural voice.', how: 'It picks up the phone, understands what the caller needs, answers or books — and hands over to your team when it makes sense.', flow: ['Call from {who}', 'The voice agent understands the request', 'Checks the calendar and rules', 'Spoken answer and booking made'] },
      fr: { name: 'Agent vocal et téléphonique', tagline: 'Répond aux appels 24h/24 avec une voix naturelle.', how: 'Il décroche, comprend le besoin, répond ou prend rendez-vous — et transfère à l’équipe quand c’est pertinent.', flow: ['Appel de {who}', 'L’agent vocal comprend la demande', 'Consulte l’agenda et les règles', 'Réponse orale et rendez-vous pris'] },
      es: { name: 'Agente de voz y teléfono', tagline: 'Atiende llamadas 24/7 con voz natural.', how: 'Contesta el teléfono, entiende lo que necesita la persona, responde o agenda y pasa la llamada al equipo cuando conviene.', flow: ['Llamada de {who}', 'El agente de voz entiende la solicitud', 'Consulta la agenda y las reglas', 'Respuesta hablada y cita reservada'] },
      de: { name: 'Sprach- und Telefonagent', tagline: 'Nimmt rund um die Uhr Anrufe mit natürlicher Stimme an.', how: 'Er nimmt ab, versteht das Anliegen, antwortet oder bucht – und übergibt an Ihr Team, wenn es sinnvoll ist.', flow: ['Anruf von {who}', 'Der Sprachagent versteht das Anliegen', 'Prüft Kalender und Regeln', 'Gesprochene Antwort und Termin gebucht'] },
      sv: { name: 'Röst- och telefonagent', tagline: 'Svarar i telefon dygnet runt med naturlig röst.', how: 'Den svarar, förstår vad personen behöver, svarar eller bokar – och kopplar till teamet när det behövs.', flow: ['Samtal från {who}', 'Röstagenten förstår ärendet', 'Kollar kalender och regler', 'Talat svar och bokning klar'] },
    },
  },
  {
    id: 'whatsapp',
    group: 'agentes',
    icon: 'chat',
    text: {
      pt: { name: 'Automação de WhatsApp', tagline: 'Respostas imediatas no canal que os clientes já usam.', how: 'Liga o WhatsApp Business ao agente: responde a dúvidas, confirma, lembra e regista tudo no sistema.', flow: ['Mensagem de {who} no WhatsApp', 'O agente identifica a intenção', 'Verifica dados e disponibilidade', 'Resposta enviada e registo criado'] },
      en: { name: 'WhatsApp automation', tagline: 'Instant replies on the channel customers already use.', how: 'It connects WhatsApp Business to the agent: answers questions, confirms, reminds and logs everything in your system.', flow: ['WhatsApp message from {who}', 'The agent detects the intent', 'Checks data and availability', 'Reply sent and record created'] },
      fr: { name: 'Automatisation WhatsApp', tagline: 'Des réponses immédiates sur le canal que vos clients utilisent.', how: 'Il relie WhatsApp Business à l’agent : répond aux questions, confirme, rappelle et enregistre tout dans le système.', flow: ['Message WhatsApp de {who}', 'L’agent identifie l’intention', 'Vérifie données et disponibilités', 'Réponse envoyée et fiche créée'] },
      es: { name: 'Automatización de WhatsApp', tagline: 'Respuestas inmediatas en el canal que ya usan sus clientes.', how: 'Conecta WhatsApp Business con el agente: responde dudas, confirma, recuerda y lo registra todo en el sistema.', flow: ['Mensaje de {who} por WhatsApp', 'El agente identifica la intención', 'Comprueba datos y disponibilidad', 'Respuesta enviada y registro creado'] },
      de: { name: 'WhatsApp-Automatisierung', tagline: 'Sofortige Antworten im Kanal, den Kunden schon nutzen.', how: 'Verbindet WhatsApp Business mit dem Agenten: beantwortet Fragen, bestätigt, erinnert und protokolliert alles im System.', flow: ['WhatsApp-Nachricht von {who}', 'Der Agent erkennt die Absicht', 'Prüft Daten und Verfügbarkeit', 'Antwort gesendet, Eintrag erstellt'] },
      sv: { name: 'WhatsApp-automation', tagline: 'Direkta svar i kanalen kunderna redan använder.', how: 'Kopplar WhatsApp Business till agenten: svarar på frågor, bekräftar, påminner och loggar allt i systemet.', flow: ['WhatsApp-meddelande från {who}', 'Agenten förstår avsikten', 'Kollar data och tillgänglighet', 'Svar skickat och post skapad'] },
    },
  },
  {
    id: 'multi-agente',
    group: 'agentes',
    icon: 'network',
    text: {
      pt: { name: 'Orquestração multi-agente', tagline: 'Vários agentes especialistas a trabalhar em equipa.', how: 'Um agente coordenador distribui o trabalho por especialistas (atendimento, documentos, dados) e uma pessoa aprova o que é sensível.', flow: ['Pedido complexo sobre {pain}', 'O coordenador divide o trabalho', 'Agentes especialistas executam', 'Resultado revisto e entregue'] },
      en: { name: 'Multi-agent orchestration', tagline: 'Several specialist agents working as a team.', how: 'A coordinator agent splits the work between specialists (service, documents, data) and a person approves anything sensitive.', flow: ['Complex request about {pain}', 'The coordinator splits the work', 'Specialist agents execute', 'Result reviewed and delivered'] },
      fr: { name: 'Orchestration multi-agents', tagline: 'Plusieurs agents spécialisés qui travaillent en équipe.', how: 'Un agent coordinateur répartit le travail entre spécialistes (service, documents, données) et une personne valide ce qui est sensible.', flow: ['Demande complexe sur {pain}', 'Le coordinateur répartit le travail', 'Les agents spécialisés exécutent', 'Résultat vérifié et livré'] },
      es: { name: 'Orquestación multiagente', tagline: 'Varios agentes especialistas trabajando en equipo.', how: 'Un agente coordinador reparte el trabajo entre especialistas (atención, documentos, datos) y una persona aprueba lo sensible.', flow: ['Solicitud compleja sobre {pain}', 'El coordinador reparte el trabajo', 'Los agentes especialistas ejecutan', 'Resultado revisado y entregado'] },
      de: { name: 'Multi-Agenten-Orchestrierung', tagline: 'Mehrere spezialisierte Agenten arbeiten im Team.', how: 'Ein Koordinator verteilt die Arbeit auf Spezialisten (Service, Dokumente, Daten); ein Mensch gibt Sensibles frei.', flow: ['Komplexe Anfrage zu {pain}', 'Der Koordinator verteilt die Arbeit', 'Spezialisierte Agenten führen aus', 'Ergebnis geprüft und geliefert'] },
      sv: { name: 'Orkestrering av flera agenter', tagline: 'Flera specialistagenter som arbetar i team.', how: 'En koordinerande agent fördelar arbetet mellan specialister (service, dokument, data) och en människa godkänner det känsliga.', flow: ['Komplex förfrågan om {pain}', 'Koordinatorn fördelar arbetet', 'Specialistagenter utför', 'Resultat granskat och levererat'] },
    },
  },
  {
    id: 'rag-documentos',
    group: 'conhecimento',
    icon: 'docs',
    text: {
      pt: { name: 'IA sobre os seus documentos (RAG)', tagline: 'Respostas certas a partir de manuais, contratos e procedimentos.', how: 'Antes de responder, o agente pesquisa nos documentos da empresa e indica a fonte — sem inventar.', flow: ['Pergunta sobre {pain}', 'O agente pesquisa nos documentos', 'Encontra o excerto e a fonte', 'Resposta com citação do documento'] },
      en: { name: 'AI on your documents (RAG)', tagline: 'Accurate answers from manuals, contracts and procedures.', how: 'Before answering, the agent searches your company documents and cites the source — no guessing.', flow: ['Question about {pain}', 'The agent searches the documents', 'Finds the passage and source', 'Answer citing the document'] },
      fr: { name: 'IA sur vos documents (RAG)', tagline: 'Des réponses justes à partir de manuels, contrats et procédures.', how: 'Avant de répondre, l’agent cherche dans les documents de l’entreprise et cite la source — sans inventer.', flow: ['Question sur {pain}', 'L’agent cherche dans les documents', 'Trouve l’extrait et la source', 'Réponse citant le document'] },
      es: { name: 'IA sobre sus documentos (RAG)', tagline: 'Respuestas correctas a partir de manuales, contratos y procedimientos.', how: 'Antes de responder, el agente busca en los documentos de la empresa e indica la fuente, sin inventar.', flow: ['Pregunta sobre {pain}', 'El agente busca en los documentos', 'Encuentra el fragmento y la fuente', 'Respuesta citando el documento'] },
      de: { name: 'KI auf Ihren Dokumenten (RAG)', tagline: 'Richtige Antworten aus Handbüchern, Verträgen und Abläufen.', how: 'Vor der Antwort durchsucht der Agent Ihre Unternehmensdokumente und nennt die Quelle – ohne zu raten.', flow: ['Frage zu {pain}', 'Der Agent durchsucht die Dokumente', 'Findet Passage und Quelle', 'Antwort mit Quellenangabe'] },
      sv: { name: 'AI på era dokument (RAG)', tagline: 'Rätt svar från manualer, avtal och rutiner.', how: 'Innan den svarar söker agenten i företagets dokument och anger källan – utan att gissa.', flow: ['Fråga om {pain}', 'Agenten söker i dokumenten', 'Hittar avsnitt och källa', 'Svar med källhänvisning'] },
    },
  },
  {
    id: 'visao-ocr',
    group: 'conhecimento',
    icon: 'scan',
    text: {
      pt: { name: 'Visão computacional e OCR', tagline: 'Lê faturas, recibos, fotos e formulários.', how: 'Extrai os campos importantes de documentos digitalizados ou fotografados, valida-os e prepara o lançamento.', flow: ['Fatura ou documento recebido', 'O agente lê e extrai os campos', 'Valida com o ERP e as regras', 'Lançamento pronto a aprovar'] },
      en: { name: 'Computer vision & OCR', tagline: 'Reads invoices, receipts, photos and forms.', how: 'It extracts the key fields from scanned or photographed documents, validates them and prepares the entry.', flow: ['Invoice or document received', 'The agent reads and extracts fields', 'Validates against ERP and rules', 'Entry ready for approval'] },
      fr: { name: 'Vision par ordinateur et OCR', tagline: 'Lit factures, reçus, photos et formulaires.', how: 'Il extrait les champs clés des documents scannés ou photographiés, les valide et prépare la saisie.', flow: ['Facture ou document reçu', 'L’agent lit et extrait les champs', 'Valide avec l’ERP et les règles', 'Écriture prête à valider'] },
      es: { name: 'Visión artificial y OCR', tagline: 'Lee facturas, recibos, fotos y formularios.', how: 'Extrae los campos importantes de documentos escaneados o fotografiados, los valida y prepara el registro.', flow: ['Factura o documento recibido', 'El agente lee y extrae los campos', 'Valida con el ERP y las reglas', 'Asiento listo para aprobar'] },
      de: { name: 'Computer Vision & OCR', tagline: 'Liest Rechnungen, Belege, Fotos und Formulare.', how: 'Er extrahiert die wichtigen Felder aus gescannten oder fotografierten Dokumenten, prüft sie und bereitet die Buchung vor.', flow: ['Rechnung oder Dokument erhalten', 'Der Agent liest und extrahiert Felder', 'Prüft gegen ERP und Regeln', 'Buchung zur Freigabe bereit'] },
      sv: { name: 'Datorseende och OCR', tagline: 'Läser fakturor, kvitton, foton och formulär.', how: 'Den tar ut viktiga fält ur skannade eller fotograferade dokument, validerar dem och förbereder bokföringen.', flow: ['Faktura eller dokument inkommer', 'Agenten läser och tar ut fält', 'Validerar mot ERP och regler', 'Verifikation redo att godkänna'] },
    },
  },
  {
    id: 'copiloto-interno',
    group: 'conhecimento',
    icon: 'copilot',
    text: {
      pt: { name: 'Copiloto interno', tagline: 'Um assistente para a equipa, dentro das ferramentas de trabalho.', how: 'Responde a perguntas internas, resume, redige e encontra informação — a equipa ganha tempo sem mudar de ferramenta.', flow: ['A equipa pede ajuda com {pain}', 'O copiloto percebe o contexto', 'Procura em emails, documentos e sistemas', 'Resumo e rascunho prontos'] },
      en: { name: 'Internal copilot', tagline: 'An assistant for your team, inside the tools they use.', how: 'It answers internal questions, summarises, drafts and finds information — the team saves time without switching tools.', flow: ['The team asks for help with {pain}', 'The copilot grasps the context', 'Searches email, documents and systems', 'Summary and draft ready'] },
      fr: { name: 'Copilote interne', tagline: 'Un assistant pour l’équipe, dans ses outils de travail.', how: 'Il répond aux questions internes, résume, rédige et retrouve l’information — l’équipe gagne du temps sans changer d’outil.', flow: ['L’équipe demande de l’aide sur {pain}', 'Le copilote comprend le contexte', 'Cherche dans e-mails, documents et systèmes', 'Résumé et brouillon prêts'] },
      es: { name: 'Copiloto interno', tagline: 'Un asistente para el equipo, dentro de sus herramientas.', how: 'Responde preguntas internas, resume, redacta y encuentra información: el equipo gana tiempo sin cambiar de herramienta.', flow: ['El equipo pide ayuda con {pain}', 'El copiloto entiende el contexto', 'Busca en emails, documentos y sistemas', 'Resumen y borrador listos'] },
      de: { name: 'Interner Copilot', tagline: 'Ein Assistent für Ihr Team, direkt in den Arbeitstools.', how: 'Er beantwortet interne Fragen, fasst zusammen, entwirft Texte und findet Informationen – ohne Toolwechsel.', flow: ['Das Team braucht Hilfe bei {pain}', 'Der Copilot erfasst den Kontext', 'Sucht in E-Mails, Dokumenten, Systemen', 'Zusammenfassung und Entwurf bereit'] },
      sv: { name: 'Intern copilot', tagline: 'En assistent för teamet, i verktygen de redan använder.', how: 'Den svarar på interna frågor, sammanfattar, skriver utkast och hittar information – utan att byta verktyg.', flow: ['Teamet ber om hjälp med {pain}', 'Copiloten förstår sammanhanget', 'Söker i mejl, dokument och system', 'Sammanfattning och utkast klara'] },
    },
  },
  {
    id: 'integracoes-mcp',
    group: 'integracao',
    icon: 'plug',
    text: {
      pt: { name: 'Integrações MCP e API', tagline: 'Liga o agente ao ERP, CRM e software de gestão.', how: 'Com MCP e APIs, o agente lê e atualiza os sistemas que já usa, de forma segura e com permissões controladas.', flow: ['Novo evento em {sector}', 'O agente decide a ação', 'Chama ERP/CRM via MCP ou API', 'Sistemas atualizados sem copiar e colar'] },
      en: { name: 'MCP & API integrations', tagline: 'Connects the agent to your ERP, CRM and management software.', how: 'With MCP and APIs, the agent reads and updates the systems you already use, securely and with controlled permissions.', flow: ['New event at {sector}', 'The agent decides the action', 'Calls ERP/CRM via MCP or API', 'Systems updated, no copy-paste'] },
      fr: { name: 'Intégrations MCP et API', tagline: 'Relie l’agent à l’ERP, au CRM et aux logiciels de gestion.', how: 'Grâce au MCP et aux API, l’agent lit et met à jour vos systèmes existants, en toute sécurité et avec des droits maîtrisés.', flow: ['Nouvel événement chez {sector}', 'L’agent décide de l’action', 'Appelle l’ERP/CRM via MCP ou API', 'Systèmes à jour, sans copier-coller'] },
      es: { name: 'Integraciones MCP y API', tagline: 'Conecta el agente con el ERP, el CRM y el software de gestión.', how: 'Con MCP y API, el agente lee y actualiza los sistemas que ya usa, de forma segura y con permisos controlados.', flow: ['Nuevo evento en {sector}', 'El agente decide la acción', 'Llama al ERP/CRM vía MCP o API', 'Sistemas actualizados sin copiar y pegar'] },
      de: { name: 'MCP- und API-Integrationen', tagline: 'Verbindet den Agenten mit ERP, CRM und Verwaltungssoftware.', how: 'Über MCP und APIs liest und aktualisiert der Agent Ihre bestehenden Systeme – sicher und mit kontrollierten Rechten.', flow: ['Neues Ereignis bei {sector}', 'Der Agent entscheidet die Aktion', 'Ruft ERP/CRM via MCP oder API auf', 'Systeme aktualisiert, ohne Kopieren'] },
      sv: { name: 'MCP- och API-integrationer', tagline: 'Kopplar agenten till ERP, CRM och affärssystem.', how: 'Med MCP och API:er läser och uppdaterar agenten de system ni redan har – säkert och med styrda behörigheter.', flow: ['Ny händelse hos {sector}', 'Agenten väljer åtgärd', 'Anropar ERP/CRM via MCP eller API', 'System uppdaterade utan kopiering'] },
    },
  },
  {
    id: 'processos-rpa',
    group: 'integracao',
    icon: 'gears',
    text: {
      pt: { name: 'Hiperautomação de processos', tagline: 'Liga passos manuais entre sistemas, mesmo sem API.', how: 'Automatiza tarefas repetitivas entre aplicações — copiar, validar, preencher — e combina-as com decisões do agente.', flow: ['Tarefa manual de {pain}', 'O agente segue as regras da empresa', 'Robô preenche e valida os sistemas', 'Processo concluído com registo'] },
      en: { name: 'Process hyperautomation', tagline: 'Joins manual steps between systems, even without an API.', how: 'It automates repetitive work between applications — copying, validating, filling in — combined with the agent’s decisions.', flow: ['Manual task in {pain}', 'The agent follows company rules', 'A bot fills in and checks systems', 'Process done and logged'] },
      fr: { name: 'Hyperautomatisation des processus', tagline: 'Relie des étapes manuelles entre systèmes, même sans API.', how: 'Il automatise le travail répétitif entre applications — copier, vérifier, remplir — combiné aux décisions de l’agent.', flow: ['Tâche manuelle de {pain}', 'L’agent suit les règles de l’entreprise', 'Un robot remplit et vérifie les systèmes', 'Processus terminé et tracé'] },
      es: { name: 'Hiperautomatización de procesos', tagline: 'Une pasos manuales entre sistemas, incluso sin API.', how: 'Automatiza tareas repetitivas entre aplicaciones (copiar, validar, rellenar) combinadas con las decisiones del agente.', flow: ['Tarea manual de {pain}', 'El agente sigue las reglas de la empresa', 'Un robot rellena y valida los sistemas', 'Proceso terminado y registrado'] },
      de: { name: 'Prozess-Hyperautomatisierung', tagline: 'Verbindet manuelle Schritte zwischen Systemen, auch ohne API.', how: 'Automatisiert Routinearbeit zwischen Anwendungen – kopieren, prüfen, ausfüllen – kombiniert mit Entscheidungen des Agenten.', flow: ['Manuelle Aufgabe bei {pain}', 'Der Agent befolgt die Firmenregeln', 'Ein Bot füllt und prüft Systeme', 'Prozess erledigt und protokolliert'] },
      sv: { name: 'Hyperautomation av processer', tagline: 'Kopplar ihop manuella steg mellan system, även utan API.', how: 'Automatiserar repetitivt arbete mellan program – kopiera, kontrollera, fylla i – kombinerat med agentens beslut.', flow: ['Manuell uppgift i {pain}', 'Agenten följer företagets regler', 'En robot fyller i och kontrollerar', 'Processen klar och loggad'] },
    },
  },
  {
    id: 'dados-pipelines',
    group: 'integracao',
    icon: 'database',
    text: {
      pt: { name: 'Dados e pipelines (Big Data)', tagline: 'Dados limpos e unificados para a IA trabalhar bem.', how: 'Recolhe, limpa e organiza dados dispersos num só lugar — a base de agentes, previsões e dashboards fiáveis.', flow: ['Dados dispersos de {sector}', 'Recolha automática', 'Limpeza e unificação', 'Base pronta para a IA'] },
      en: { name: 'Data & pipelines (Big Data)', tagline: 'Clean, unified data so AI works well.', how: 'It collects, cleans and organises scattered data in one place — the foundation for reliable agents, forecasts and dashboards.', flow: ['Scattered data at {sector}', 'Automatic collection', 'Cleaning and unification', 'Foundation ready for AI'] },
      fr: { name: 'Données et pipelines (Big Data)', tagline: 'Des données propres et unifiées pour une IA efficace.', how: 'Il collecte, nettoie et organise des données dispersées en un seul endroit — la base d’agents, prévisions et tableaux fiables.', flow: ['Données dispersées de {sector}', 'Collecte automatique', 'Nettoyage et unification', 'Base prête pour l’IA'] },
      es: { name: 'Datos y pipelines (Big Data)', tagline: 'Datos limpios y unificados para que la IA funcione bien.', how: 'Recoge, limpia y organiza datos dispersos en un solo lugar: la base de agentes, previsiones y paneles fiables.', flow: ['Datos dispersos de {sector}', 'Recogida automática', 'Limpieza y unificación', 'Base lista para la IA'] },
      de: { name: 'Daten & Pipelines (Big Data)', tagline: 'Saubere, vereinte Daten, damit KI gut funktioniert.', how: 'Er sammelt, bereinigt und ordnet verstreute Daten an einem Ort – die Basis für verlässliche Agenten, Prognosen und Dashboards.', flow: ['Verstreute Daten bei {sector}', 'Automatische Erfassung', 'Bereinigung und Zusammenführung', 'Basis bereit für KI'] },
      sv: { name: 'Data och pipelines (Big Data)', tagline: 'Ren, samlad data så att AI fungerar bra.', how: 'Den samlar, tvättar och organiserar spridd data på ett ställe – grunden för pålitliga agenter, prognoser och dashboards.', flow: ['Spridd data hos {sector}', 'Automatisk insamling', 'Tvätt och sammanslagning', 'Grund redo för AI'] },
    },
  },
  {
    id: 'previsao-ml',
    group: 'crescimento',
    icon: 'trend',
    text: {
      pt: { name: 'Previsão e machine learning', tagline: 'Antecipa procura, stock, faltas e riscos.', how: 'Modelos treinados com o histórico da empresa preveem o que vai acontecer e sugerem a próxima ação.', flow: ['Histórico de {sector}', 'O modelo aprende os padrões', 'Calcula a previsão e o risco', 'Alerta com ação sugerida'] },
      en: { name: 'Forecasting & machine learning', tagline: 'Anticipates demand, stock, no-shows and risks.', how: 'Models trained on your history predict what is coming and suggest the next action.', flow: ['History at {sector}', 'The model learns the patterns', 'Computes forecast and risk', 'Alert with a suggested action'] },
      fr: { name: 'Prévision et machine learning', tagline: 'Anticipe la demande, les stocks, les absences et les risques.', how: 'Des modèles entraînés sur votre historique prévoient ce qui va arriver et suggèrent l’action suivante.', flow: ['Historique de {sector}', 'Le modèle apprend les tendances', 'Calcule prévision et risque', 'Alerte avec action suggérée'] },
      es: { name: 'Previsión y machine learning', tagline: 'Anticipa demanda, stock, ausencias y riesgos.', how: 'Modelos entrenados con el histórico de la empresa predicen lo que va a pasar y sugieren la siguiente acción.', flow: ['Histórico de {sector}', 'El modelo aprende los patrones', 'Calcula la previsión y el riesgo', 'Alerta con acción sugerida'] },
      de: { name: 'Prognose & Machine Learning', tagline: 'Sagt Nachfrage, Bestand, Ausfälle und Risiken voraus.', how: 'Mit Ihrer Historie trainierte Modelle sagen voraus, was kommt, und schlagen den nächsten Schritt vor.', flow: ['Historie bei {sector}', 'Das Modell lernt Muster', 'Berechnet Prognose und Risiko', 'Warnung mit Handlungsvorschlag'] },
      sv: { name: 'Prognoser och maskininlärning', tagline: 'Förutser efterfrågan, lager, uteblivna besök och risker.', how: 'Modeller tränade på er historik förutser vad som kommer och föreslår nästa åtgärd.', flow: ['Historik hos {sector}', 'Modellen lär sig mönster', 'Beräknar prognos och risk', 'Varning med förslag'] },
    },
  },
  {
    id: 'dashboards',
    group: 'crescimento',
    icon: 'gauge',
    text: {
      pt: { name: 'Dashboards em tempo real', tagline: 'Indicadores e alertas sempre atualizados.', how: 'Junta os dados dos vários sistemas num painel único e avisa quando algo sai do normal.', flow: ['Dados de vários sistemas', 'O agente junta e limpa', 'Calcula os indicadores', 'Painel e alertas em tempo real'] },
      en: { name: 'Real-time dashboards', tagline: 'KPIs and alerts that are always up to date.', how: 'It brings data from your systems into one dashboard and warns you when something is off.', flow: ['Data from several systems', 'The agent merges and cleans', 'Calculates the KPIs', 'Live dashboard and alerts'] },
      fr: { name: 'Tableaux de bord en temps réel', tagline: 'Indicateurs et alertes toujours à jour.', how: 'Il réunit les données de vos systèmes dans un tableau unique et vous alerte en cas d’anomalie.', flow: ['Données de plusieurs systèmes', 'L’agent regroupe et nettoie', 'Calcule les indicateurs', 'Tableau et alertes en direct'] },
      es: { name: 'Paneles en tiempo real', tagline: 'Indicadores y alertas siempre actualizados.', how: 'Reúne los datos de sus sistemas en un único panel y avisa cuando algo se sale de lo normal.', flow: ['Datos de varios sistemas', 'El agente los reúne y limpia', 'Calcula los indicadores', 'Panel y alertas en tiempo real'] },
      de: { name: 'Echtzeit-Dashboards', tagline: 'Kennzahlen und Warnungen, immer aktuell.', how: 'Führt die Daten Ihrer Systeme in einem Dashboard zusammen und warnt bei Auffälligkeiten.', flow: ['Daten aus mehreren Systemen', 'Der Agent führt zusammen und bereinigt', 'Berechnet die Kennzahlen', 'Live-Dashboard und Warnungen'] },
      sv: { name: 'Dashboards i realtid', tagline: 'Nyckeltal och varningar som alltid är aktuella.', how: 'Samlar data från era system i en dashboard och varnar när något avviker.', flow: ['Data från flera system', 'Agenten samlar och tvättar', 'Beräknar nyckeltalen', 'Live-dashboard och varningar'] },
    },
  },
  {
    id: 'conteudo',
    group: 'crescimento',
    icon: 'pen',
    text: {
      pt: { name: 'Geração de conteúdo', tagline: 'Propostas, emails e publicações com a voz da marca.', how: 'Cria rascunhos de propostas, respostas, publicações e descrições a partir dos seus dados — alguém revê antes de sair.', flow: ['Pedido de proposta ou publicação', 'O agente reúne dados e o tom da marca', 'Gera o rascunho', 'Revisão humana e envio'] },
      en: { name: 'Content generation', tagline: 'Proposals, emails and posts in your brand voice.', how: 'It drafts proposals, replies, posts and descriptions from your data — someone reviews before anything goes out.', flow: ['Request for a proposal or post', 'The agent gathers data and brand tone', 'Generates the draft', 'Human review and send'] },
      fr: { name: 'Génération de contenu', tagline: 'Propositions, e-mails et publications avec la voix de la marque.', how: 'Il rédige propositions, réponses, publications et descriptions à partir de vos données — une personne relit avant diffusion.', flow: ['Demande de proposition ou publication', 'L’agent réunit données et ton de marque', 'Génère le brouillon', 'Relecture humaine et envoi'] },
      es: { name: 'Generación de contenido', tagline: 'Propuestas, emails y publicaciones con la voz de la marca.', how: 'Crea borradores de propuestas, respuestas, publicaciones y descripciones a partir de sus datos; alguien revisa antes de enviarlos.', flow: ['Petición de propuesta o publicación', 'El agente reúne datos y tono de marca', 'Genera el borrador', 'Revisión humana y envío'] },
      de: { name: 'Content-Erstellung', tagline: 'Angebote, E-Mails und Posts in Ihrer Markenstimme.', how: 'Erstellt Entwürfe für Angebote, Antworten, Posts und Beschreibungen aus Ihren Daten – ein Mensch prüft vor dem Versand.', flow: ['Anfrage für Angebot oder Post', 'Der Agent sammelt Daten und Markenton', 'Erstellt den Entwurf', 'Menschliche Prüfung und Versand'] },
      sv: { name: 'Innehållsgenerering', tagline: 'Offerter, mejl och inlägg med varumärkets röst.', how: 'Skriver utkast till offerter, svar, inlägg och beskrivningar utifrån era data – någon granskar innan det skickas.', flow: ['Beställning av offert eller inlägg', 'Agenten samlar data och ton', 'Skapar utkastet', 'Mänsklig granskning och utskick'] },
    },
  },
  {
    id: 'leads',
    group: 'crescimento',
    icon: 'target',
    text: {
      pt: { name: 'Qualificação de leads', tagline: 'Pontua e segue cada contacto no momento certo.', how: 'Avalia cada contacto que chega, prioriza os melhores e envia seguimentos personalizados sem esquecer ninguém.', flow: ['Novo contacto de {who}', 'O agente avalia e pontua', 'Atualiza o CRM', 'Seguimento personalizado agendado'] },
      en: { name: 'Lead qualification', tagline: 'Scores and follows up every contact at the right time.', how: 'It assesses every incoming contact, prioritises the best ones and sends personalised follow-ups without missing anyone.', flow: ['New contact from {who}', 'The agent assesses and scores', 'Updates the CRM', 'Personalised follow-up scheduled'] },
      fr: { name: 'Qualification des prospects', tagline: 'Note et relance chaque contact au bon moment.', how: 'Il évalue chaque contact entrant, priorise les meilleurs et envoie des relances personnalisées sans oublier personne.', flow: ['Nouveau contact de {who}', 'L’agent évalue et note', 'Met à jour le CRM', 'Relance personnalisée planifiée'] },
      es: { name: 'Cualificación de leads', tagline: 'Puntúa y sigue cada contacto en el momento adecuado.', how: 'Evalúa cada contacto que llega, prioriza los mejores y envía seguimientos personalizados sin olvidar a nadie.', flow: ['Nuevo contacto de {who}', 'El agente evalúa y puntúa', 'Actualiza el CRM', 'Seguimiento personalizado programado'] },
      de: { name: 'Lead-Qualifizierung', tagline: 'Bewertet jeden Kontakt und fasst zum richtigen Zeitpunkt nach.', how: 'Bewertet jeden eingehenden Kontakt, priorisiert die besten und sendet persönliche Nachfassungen, ohne jemanden zu vergessen.', flow: ['Neuer Kontakt von {who}', 'Der Agent bewertet und punktet', 'Aktualisiert das CRM', 'Persönliches Nachfassen geplant'] },
      sv: { name: 'Kvalificering av leads', tagline: 'Poängsätter och följer upp varje kontakt i rätt tid.', how: 'Bedömer varje inkommande kontakt, prioriterar de bästa och skickar personliga uppföljningar utan att glömma någon.', flow: ['Ny kontakt från {who}', 'Agenten bedömer och poängsätter', 'Uppdaterar CRM', 'Personlig uppföljning bokad'] },
    },
  },
  {
    id: 'estrategia',
    group: 'estrategia',
    icon: 'compass',
    text: {
      pt: { name: 'Diagnóstico e roadmap de IA', tagline: 'Onde a IA dá retorno — e por onde começar.', how: 'Mapeamos os processos, escolhemos os casos com mais impacto e definimos um plano por fases, com riscos, RGPD e AI Act.', flow: ['Conversa sobre {pain}', 'Mapa dos processos', 'Prioridades, riscos e RGPD', 'Plano por fases'] },
      en: { name: 'AI assessment & roadmap', tagline: 'Where AI pays off — and where to start.', how: 'We map your processes, pick the highest-impact cases and define a phased plan covering risks, GDPR and the AI Act.', flow: ['Conversation about {pain}', 'Process map', 'Priorities, risks and GDPR', 'Phased plan'] },
      fr: { name: 'Diagnostic et feuille de route IA', tagline: 'Où l’IA est rentable — et par où commencer.', how: 'Nous cartographions vos processus, choisissons les cas à plus fort impact et définissons un plan par phases, avec risques, RGPD et AI Act.', flow: ['Échange sur {pain}', 'Cartographie des processus', 'Priorités, risques et RGPD', 'Plan par phases'] },
      es: { name: 'Diagnóstico y hoja de ruta de IA', tagline: 'Dónde la IA da retorno y por dónde empezar.', how: 'Mapeamos los procesos, elegimos los casos de mayor impacto y definimos un plan por fases con riesgos, RGPD y AI Act.', flow: ['Conversación sobre {pain}', 'Mapa de procesos', 'Prioridades, riesgos y RGPD', 'Plan por fases'] },
      de: { name: 'KI-Analyse & Roadmap', tagline: 'Wo sich KI lohnt – und wo Sie anfangen.', how: 'Wir bilden Ihre Prozesse ab, wählen die wirkungsvollsten Fälle und erstellen einen Stufenplan mit Risiken, DSGVO und AI Act.', flow: ['Gespräch über {pain}', 'Prozesslandkarte', 'Prioritäten, Risiken, DSGVO', 'Stufenplan'] },
      sv: { name: 'AI-analys och färdplan', tagline: 'Där AI lönar sig – och var ni ska börja.', how: 'Vi kartlägger processerna, väljer fallen med störst effekt och tar fram en plan i etapper med risker, GDPR och AI Act.', flow: ['Samtal om {pain}', 'Processkarta', 'Prioriteringar, risker och GDPR', 'Plan i etapper'] },
    },
  },
];

export const CAP_BY_ID = new Map(CAPABILITIES.map((c) => [c.id, c]));

/** Aceita ids novos e antigos; devolve ids válidos do catálogo, sem repetidos. */
export function resolveCaps(ids: readonly string[]): CapId[] {
  const out: CapId[] = [];
  for (const raw of ids) {
    const id = (CAP_BY_ID.has(raw as CapId) ? raw : LEGACY[raw]) as CapId | undefined;
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}

export interface CaseContext {
  who?: string;
  pain?: string;
  sector?: string;
}

/** Fluxo de exemplo adaptado ao caso da conversa (placeholders preenchidos). */
export function adaptFlow(cap: Capability, lang: Lang, ctx: CaseContext): string[] {
  const g = GENERIC[lang];
  const low = (s: string) => (lang === 'de' ? s : s.charAt(0).toLowerCase() + s.slice(1));
  const vals = {
    who: ctx.who ? low(ctx.who) : g.who,
    pain: ctx.pain ? low(ctx.pain) : g.pain,
    sector: ctx.sector ? low(ctx.sector) : g.sector,
  };
  return cap.text[lang].flow.map((s) => {
    const filled = s.replace(/\{(who|pain|sector)\}/g, (_, k: keyof typeof vals) => vals[k]);
    return filled.charAt(0).toUpperCase() + filled.slice(1);
  });
}
