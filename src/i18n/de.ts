import type { Dict } from './pt';

export const de: Dict = {
  meta: {
    title: 'DevloperEU — KI-Agenten und Automatisierung für Unternehmen | Braga, Portugal',
    description:
      'KI-Agenten und Hyperautomatisierung für Unternehmen in Portugal und Europa. Sprechen Sie mit unserem Agenten, sehen Sie eine Simulation Ihres Falls und buchen Sie 30 Minuten. Braga, seit 2024.',
    ogAlt: 'DevloperEU-Logo — goldener Kopf aus einem neuronalen Netz',
    ogLocale: 'de_DE',
  },

  ui: {
    skip: 'Zum Inhalt springen',
    modeLabel: 'Ansichtsmodus',
    modeChat: 'Chatten',
    modeRead: 'Stöbern',
    book: 'Termin buchen',
    bookShort: 'Buchen',
    language: 'Sprache',
    status: 'Agent online',
    location: 'Braga, PT',
    restart: 'Neu starten',
    skipToBooking: 'Direkt zur Terminbuchung',
    toClassic: 'Klassische Ansicht',
    toChat: 'Mit dem Agenten sprechen',
    simulation: 'Beispielhafte Simulation',
    typing: 'Der Agent schreibt…',
    stageLabel: 'Bühne des Agenten',
    chatLabel: 'Gespräch mit dem Agenten',
    answersLabel: 'Vorgeschlagene Antworten',
    close: 'Schließen',
    you: 'Sie',
    agent: 'DevloperEU-Agent',
    home: 'Startseite',
  },

  boot: ['devloper.eu-Agent wird gestartet', 'Fähigkeiten werden geladen · 6/6', 'Kontext · Unternehmen in Portugal und Europa', 'bereit'],

  chat: {
    intro: 'Hallo. Ich bin der Agent von DevloperEU.',
    introSub:
      'In weniger als einer Minute zeige ich Ihnen, was ein KI-Agent in Ihrem Unternehmen tun würde — mit einer Simulation Ihres Falls. Ohne Formulare.',
    introYes: 'Zeigen Sie es mir für mein Unternehmen',
    introNo: 'Ich sehe mich lieber auf der Website um',
    askSector: 'Zum Start: In welcher Branche ist Ihr Unternehmen tätig?',
    askPain: 'Verstanden — {sector}. Wo verliert Ihr Team heute am meisten Zeit?',
    askTeam: 'Letzte Frage. Wie viele Personen kümmern sich darum, und wie viele Stunden pro Woche verbringt jede damit?',
    people: 'Beteiligte Personen',
    hours: 'Stunden pro Person und Woche',
    confirmTeam: 'Meinen Agenten bauen',
    teamAnswer: '{people} Personen · je {hours} h/Woche',
    building: 'Perfekt. Ich baue einen Agenten für {pain} in der Branche {sector} … sehen Sie auf die Bühne.',
    simDone:
      'So arbeitet der Agent an Ihrem Fall. Übernimmt er die Hälfte der Routineaufgaben, gewinnt Ihr Team rund {result} Stunden pro Woche zurück.',
    simNote: 'Das ist eine beispielhafte Simulation mit Ihren Angaben — im Termin messen wir mit Ihren echten Daten.',
    toCaps: 'Welche Fähigkeiten würde er nutzen?',
    capsIntro:
      'Für Ihren Fall habe ich {count} Fähigkeiten aktiviert. Die übrigen sind ebenfalls verfügbar — tippen Sie auf eine, um mehr zu erfahren.',
    capsOpened: '{name}: {short}',
    toBook: 'Ich möchte das mit meinen Daten sehen',
    askBook:
      'Ich schlage 30 Minuten per Videocall vor: Wir verstehen den Prozess, zeigen Ihnen den Agenten mit Ihren Daten und sagen Ihnen, was machbar ist. Wählen Sie Tag und Uhrzeit auf der Bühne.',
    bookedWhatsapp: 'Anfrage vorbereitet und in WhatsApp geöffnet. Sobald Sie sie senden, bestätigen wir die Uhrzeit.',
    bookedEmail: 'Anfrage in Ihrem E-Mail-Programm vorbereitet. Sobald Sie sie senden, bestätigen wir die Uhrzeit.',
    bookedCalendar: 'Ich habe unseren Kalender in einem neuen Fenster geöffnet, damit Sie die Uhrzeit bestätigen können.',
    afterBook: 'Nehmen Sie sich in der Zwischenzeit die kostenlose Checkliste mit 12 Aufgaben mit, die ein KI-Agent sofort übernehmen kann.',
    magnetCta: 'Checkliste öffnen',
    jumpBook: 'Gehen wir direkt zur Buchung. Wählen Sie Tag und Uhrzeit auf der Bühne — um den Rest kümmere ich mich.',
  },

  sectors: [
    { id: 'comercio', label: 'Handel und E-Commerce', who: 'Shop-Kunden' },
    { id: 'servicos', label: 'Professionelle Dienstleistungen', who: 'Kunden' },
    { id: 'industria', label: 'Industrie und Logistik', who: 'Kunden und Lieferanten' },
    { id: 'saude', label: 'Gesundheit und Kliniken', who: 'Patienten' },
    { id: 'imobiliario', label: 'Immobilien', who: 'Interessenten' },
    { id: 'turismo', label: 'Tourismus und Gastronomie', who: 'Gäste und Kunden' },
  ],

  pains: [
    {
      id: 'atendimento',
      label: 'Kundenservice und Nachrichten',
      agentName: 'Kundenservice',
      flow: ['WhatsApp, E-Mail und Website', 'Agent versteht die Anfrage', 'Prüft Ihre Systeme', 'Antwortet und protokolliert'],
      log: [
        'Neue WhatsApp-Nachricht — „Haben Sie diese Woche noch Termine frei?“',
        'Absicht erkannt: Verfügbarkeit · Konfidenz 0,94',
        'Interner Kalender abgefragt → 3 freie Termine',
        'Antwort mit 3 Terminoptionen gesendet',
        'Auswahl bestätigt → Eintrag im CRM angelegt',
        'Tageszusammenfassung an das Team gesendet',
      ],
      services: ['automacao', 'consultoria', 'desenvolvimento'],
    },
    {
      id: 'documentos',
      label: 'Rechnungen und Dokumente',
      agentName: 'Dokumente',
      flow: ['E-Mails und Scans', 'Agent liest das Dokument', 'Prüft und gleicht ab', 'Bucht ins ERP'],
      log: [
        'Rechnung per E-Mail erhalten — PDF, 2 Seiten',
        'Felder extrahiert: USt-IdNr., Datum, Summe, USt',
        'Prüfung: USt-IdNr. des Lieferanten stimmt',
        'Abgleich mit der Bestellung → Beträge stimmen überein',
        'Buchung im ERP zur Freigabe vorbereitet',
        'Ausnahme markiert: 1 Dokument ohne Bestellung',
      ],
      services: ['automacao', 'machine_learning', 'desenvolvimento'],
    },
    {
      id: 'agenda',
      label: 'Termine und Kalender',
      agentName: 'Terminvergabe',
      flow: ['Terminanfragen', 'Agent schlägt Zeiten vor', 'Synchronisiert den Kalender', 'Bestätigt und erinnert'],
      log: [
        'Terminanfrage über die Website erhalten',
        'Präferenz erkannt: später Nachmittag',
        'Teamkalender abgefragt → 2 Optionen',
        'Termin bestätigt und in den Kalender eingetragen',
        'Erinnerung für den Vortag geplant',
        'Absage erhalten → Termin automatisch wieder freigegeben',
      ],
      services: ['automacao', 'desenvolvimento'],
    },
    {
      id: 'leads',
      label: 'Leads und Vertrieb',
      agentName: 'Vertrieb',
      flow: ['Formulare und Anzeigen', 'Agent qualifiziert', 'Aktualisiert das CRM', 'Fasst nach'],
      log: [
        'Neuer Kontakt über das Website-Formular',
        'Anreicherung: Branche und Größe erkannt',
        'Qualifizierungsscore: 82/100',
        'Opportunity mit Zusammenfassung im CRM angelegt',
        'Personalisierte erste Antwort gesendet',
        'Nachfassen in 3 Tagen geplant',
      ],
      services: ['automacao', 'analytics', 'machine_learning'],
    },
    {
      id: 'relatorios',
      label: 'Berichte und Daten',
      agentName: 'Reporting',
      flow: ['Tabellen, ERP und CRM', 'Agent führt Daten zusammen', 'Berechnet Kennzahlen', 'Versendet den Bericht'],
      log: [
        'Erfassung: 4 Datenquellen verbunden',
        'Bereinigung: 37 doppelte Zeilen entfernt',
        'Wöchentliche Kennzahlen berechnet',
        'Abweichung erkannt: Umsatz Region Nord −12 %',
        'PDF-Bericht erstellt und Dashboard aktualisiert',
        'Warnung an die Geschäftsleitung gesendet',
      ],
      services: ['analytics', 'big_data', 'automacao'],
    },
    {
      id: 'operacoes',
      label: 'Bestellungen und Lager',
      agentName: 'Betrieb',
      flow: ['Bestellungen und Verkäufe', 'Agent prognostiziert die Nachfrage', 'Prüft den Bestand', 'Bereitet Nachschub vor'],
      log: [
        'Bestellung eingegangen — 3 Artikel',
        'Bestand in 2 Lagern geprüft',
        'Prognose: Artikel A in 9 Tagen ausverkauft',
        'Nachschubvorschlag erstellt',
        'Lieferantenbestellung zur Freigabe vorbereitet',
        'Kunde über die Lieferzeit informiert',
      ],
      services: ['machine_learning', 'big_data', 'automacao'],
    },
  ],

  profile: {
    title: 'Unternehmensprofil',
    subtitle: 'live vom Agenten erstellt',
    sector: 'Branche',
    pain: 'Priorität',
    team: 'Team',
    hours: 'Zeitaufwand',
    pending: 'wartet…',
    peopleUnit: 'Personen',
    hoursUnit: 'h/Woche je Person',
  },

  sim: {
    title: 'Agent · {pain}',
    running: 'läuft',
    events: 'Ereignisprotokoll',
    tasks: 'Erledigte Aufgaben',
    response: 'Antwortzeit',
    responseValue: '< 5 s',
    scenario: 'Szenario: freigewordene Stunden pro Woche',
    formula: '{people} Personen × {hours} h × {share}% = {result} h',
    disclaimer: 'Beispielhafte Simulation. Die tatsächlichen Werte hängen von Ihrem Prozess ab und werden im Termin ermittelt.',
  },

  services: [
    {
      id: 'consultoria',
      name: 'KI-Beratung',
      short: 'Strategie und Analyse: wo sich KI in Ihrem Unternehmen lohnt.',
      bullets: ['Prozess- und Potenzialkarte', 'Stufenplan mit Prioritäten', 'Tool-Auswahl und Risiken (DSGVO, AI Act)'],
      why: 'Legt fest, wo Sie anfangen und was sich nicht zu automatisieren lohnt.',
    },
    {
      id: 'automacao',
      name: 'Automatisierung',
      short: 'KI-Agenten und Hyperautomatisierung, die Routineaufgaben durchgängig erledigen.',
      bullets: ['Agenten in WhatsApp, E-Mail und Website', 'Integration mit ERP, CRM und Tabellen', 'Mensch im Prozess, wenn nötig'],
      why: 'Sie ist der Motor des Agenten aus der Simulation.',
    },
    {
      id: 'machine_learning',
      name: 'Machine Learning',
      short: 'Modelle, die aus Ihren Daten klassifizieren, extrahieren und prognostizieren.',
      bullets: ['Dokumentenerkennung', 'Nachfrage- und Risikoprognosen', 'Klassifizierung von Anfragen'],
      why: 'Gibt dem Agenten die Fähigkeit zu lesen, zu klassifizieren und vorherzusagen.',
    },
    {
      id: 'big_data',
      name: 'Big Data',
      short: 'Erfassung, Bereinigung und Organisation verstreuter Daten aus mehreren Quellen.',
      bullets: ['Datenpipelines', 'Qualität und Deduplizierung', 'Skalierbare Architektur'],
      why: 'Führt die Datenquellen zusammen, die der Agent braucht.',
    },
    {
      id: 'desenvolvimento',
      name: 'Entwicklung',
      short: 'Individuelle Software: Portale, Integrationen, APIs und Anwendungen.',
      bullets: ['Integrationen und APIs', 'Portale und interne Dashboards', 'Web- und Mobile-Apps'],
      why: 'Verbindet den Agenten mit den Systemen, die Sie bereits nutzen.',
    },
    {
      id: 'analytics',
      name: 'Analytics',
      short: 'Dashboards und Kennzahlen für datenbasierte Entscheidungen.',
      bullets: ['Echtzeit-Dashboards', 'Automatische Berichte', 'Warnungen bei Abweichungen'],
      why: 'Zeigt Ihnen die Wirkung des Agenten in Zahlen.',
    },
  ],

  caps: {
    title: 'Fähigkeiten',
    unlocked: 'für Ihren Fall aktiviert',
    available: 'verfügbar',
    why: 'Warum',
  },

  booking: {
    title: '30 Minuten buchen',
    duration: '30 Min. · Videocall · unverbindlich',
    day: 'Tag',
    time: 'Uhrzeit (Lissabon)',
    name: 'Name',
    company: 'Unternehmen (optional)',
    contact: 'E-Mail oder Telefon',
    contactHint: 'Nur, um den Termin zu bestätigen.',
    notes: 'Sollten wir etwas wissen? (optional)',
    consent: 'Ich willige ein, dass DevloperEU diese Daten ausschließlich zur Beantwortung dieser Anfrage verwendet, gemäß der',
    consentLink: 'Datenschutzerklärung',
    whatsapp: 'Anfrage per WhatsApp senden',
    email: 'Per E-Mail senden',
    calendar: 'Kalender öffnen',
    preview: 'Vom Agenten vorbereitete Nachricht',
    errors: {
      day: 'Bitte wählen Sie einen Tag.',
      time: 'Bitte wählen Sie eine Uhrzeit.',
      name: 'Bitte geben Sie Ihren Namen an.',
      contact: 'Bitte geben Sie eine gültige E-Mail-Adresse oder Telefonnummer an.',
      consent: 'Wir benötigen Ihre Einwilligung, um die Anfrage zu senden.',
    },
    message: {
      greeting: 'Hallo DevloperEU! Ich möchte einen 30-minütigen Termin buchen.',
      when: 'Wann: {day} um {time} (Lissabonner Zeit)',
      name: 'Name: {name}',
      company: 'Unternehmen: {company}',
      contact: 'Kontakt: {contact}',
      case: 'Fall: {sector} · {pain} · {people} Personen × {hours} h/Woche',
      notes: 'Hinweise: {notes}',
      subject: 'Terminanfrage — {day} {time}',
    },
    done: 'Anfrage vorbereitet',
    doneBody: 'Falls sich das Fenster nicht geöffnet hat, nutzen Sie die Kontakte unten.',
  },

  classic: {
    eyebrow: 'KI-Agenten · Hyperautomatisierung · Braga, Portugal',
    h1: 'KI-Agenten, die Ihrem Unternehmen die Routinearbeit abnehmen',
    lead:
      'DevloperEU konzipiert, integriert und betreut maßgeschneiderte KI-Agenten und Automatisierungen — verbunden mit den Systemen, die Sie bereits nutzen, und mit einem Menschen im Prozess, wo es darauf ankommt.',
    ctaPrimary: '30 Minuten buchen',
    ctaSecondary: 'Mit dem Agenten sprechen',
    servicesTitle: 'Was wir tun',
    servicesLead: 'Sechs Fähigkeiten, die wir passend zum Problem kombinieren — nicht umgekehrt.',
    processTitle: 'So arbeiten wir',
    process: [
      { t: '30-Minuten-Gespräch', d: 'Wir verstehen den Prozess, die Systeme und wo Zeit verloren geht.' },
      { t: 'Analyse', d: 'Wir bilden den Ablauf ab und sagen Ihnen, was machbar ist — mit Risiken und Prioritäten.' },
      { t: 'Prototyp', d: 'Ein erster Agent im Einsatz an einem echten Fall, zur Validierung mit dem Team.' },
      { t: 'Umsetzung und Betreuung', d: 'Vollständige Integration, Schulung und kontinuierliche Verbesserung.' },
    ],
    aboutTitle: 'Über DevloperEU',
    about: [
      'DevloperEU wurde 2024 in Braga, Portugal, gegründet und entwickelt KI-Agenten und Automatisierungslösungen für Unternehmen in Portugal und Europa.',
      'Wir arbeiten in sechs Sprachen und konzentrieren uns auf Messbares: weniger manuelle Aufgaben, schnellere Antworten und verlässlichere Daten — stets DSGVO-konform.',
    ],
    faqTitle: 'Häufige Fragen',
    bookingTitle: 'Termin buchen',
    bookingLead: 'Wählen Sie Tag und Uhrzeit. Die Anfrage geht bereits ausgefüllt per WhatsApp oder E-Mail raus.',
    contactTitle: 'Kontakt',
  },

  faq: [
    {
      q: 'Was ist ein KI-Agent?',
      a: 'Ein Programm, das Anfragen in natürlicher Sprache versteht, Ihre Systeme abfragt und Aufgaben erledigt — Kunden antworten, Dokumente lesen, das CRM aktualisieren — innerhalb von Regeln, die wir mit Ihnen festlegen.',
    },
    {
      q: 'Müssen wir unsere bestehenden Systeme ändern?',
      a: 'In der Regel nicht. Wir verbinden den Agenten über Integrationen und APIs mit dem Vorhandenen (E-Mail, WhatsApp, ERP, CRM, Tabellen).',
    },
    {
      q: 'Sind die Daten sicher und DSGVO-konform?',
      a: 'Ja. Wir verarbeiten nur die nötigen Daten, mit kontrollierten Zugriffen und einem Protokoll der Aktionen des Agenten. Im Termin erklären wir, wo die Daten bei jeder Lösung gehostet werden.',
    },
    {
      q: 'Was kostet das?',
      a: 'Das hängt vom Umfang ab. Nach dem Erstgespräch und der Analyse legen wir ein Angebot mit Phasen und Festpreisen vor.',
    },
    {
      q: 'Wie lange dauert es, bis ein Agent läuft?',
      a: 'Das hängt von Komplexität und Integrationen ab. Wir starten mit einem Prototyp an einem konkreten Fall, um früh zu validieren; der genaue Zeitplan wird in der Analyse festgelegt.',
    },
    {
      q: 'Ersetzt der Agent Menschen?',
      a: 'Ziel ist es, das Team von Routinearbeit zu entlasten. Heikle Entscheidungen bleiben bei einer Person, die der Agent vorbereitet und informiert.',
    },
    {
      q: 'Arbeiten Sie nur in Braga?',
      a: 'Wir sitzen in Braga, arbeiten aber remote mit Unternehmen in ganz Portugal und Europa.',
    },
    {
      q: 'Ist der erste Termin verbindlich?',
      a: 'Nein. Es sind 30 Minuten, um Ihren Fall zu verstehen und Ihnen offen zu sagen, ob und wie KI hilft.',
    },
  ],

  magnet: {
    title: 'Checkliste: 12 Aufgaben, die ein KI-Agent sofort übernehmen kann',
    lead: 'Haken Sie ab, was in Ihrem Unternehmen vorkommt. Bei drei oder mehr Haken wartet ein Agent darauf, Ihnen Zeit zu sparen.',
    cta: 'Kostenlose Checkliste ansehen',
    print: 'Als PDF speichern / drucken',
    back: 'Zurück zum Agenten',
    footer: 'Sie möchten wissen, wo Sie anfangen sollen? Buchen Sie 30 Minuten mit uns.',
    items: [
      'Wiederkehrende Kundenfragen beantworten (Öffnungszeiten, Preise, Verfügbarkeit)',
      'E-Mails sortieren und an die richtige Person weiterleiten',
      'Besprechungen oder Termine vereinbaren, bestätigen und erinnern',
      'Daten aus Rechnungen, Belegen und Verträgen extrahieren',
      'Dokumente ins ERP oder in die Buchhaltung übernehmen',
      'Kontakte aus Website oder Anzeigen qualifizieren',
      'Das CRM nach jedem Gespräch aktualisieren',
      'Bei unbeantworteten Angeboten nachfassen',
      'Daten aus mehreren Tabellen zu einem Wochenbericht zusammenführen',
      'Abweichungen bei Umsatz, Kosten oder Lager erkennen',
      'Engpässe vorhersagen und Lieferantenbestellungen vorbereiten',
      'Interne Informationsanfragen beantworten (HR, Abläufe)',
    ],
  },

  ai: {
    placeholder: 'Schreiben Sie dem Agenten…',
    send: 'Senden',
    mic: 'Mit dem Agenten sprechen',
    micStop: 'Stoppen und senden',
    listening: 'Ich höre zu…',
    transcribing: 'Wird transkribiert…',
    speaking: 'Spricht…',
    mute: 'Stimme stummschalten',
    unmute: 'Stimme einschalten',
    thinking: 'Denkt nach…',
    consentTitle: 'Bevor wir sprechen',
    consentText: 'Für die Antwort werden Ihre Nachrichten von einem KI-Modell ({provider}) verarbeitet. Bitte teilen Sie keine sensiblen Daten. Details in der',
    consentLink: 'Datenschutzerklärung',
    consentAccept: 'Akzeptieren und fortfahren',
    consentDecline: 'Lieber die geführten Optionen',
    fallback: 'Vorerst mache ich mit den geführten Optionen weiter — wählen Sie unten eine aus.',
    micDenied: 'Ich konnte nicht auf das Mikrofon zugreifen. Sie können Ihre Nachricht tippen.',
    caseLine: 'Fall: {summary}',
    live: 'Live-KI',
    company: 'Unternehmen',
    systems: 'Systeme',
    peopleUnit: 'Personen',
    closedTitle: 'Danke für das Gespräch',
    closedBody: 'Hier ist die kostenlose Checkliste mit 12 Aufgaben, die ein KI-Agent übernehmen kann — und unsere Kontakte, wenn es passt.',
    limitNote: 'Um weiterzukommen, ist ein 30-minütiges Gespräch mit Ihren Daten der beste Schritt — die Buchung ist auf der Bühne vorbereitet.',
  },

  exit: {
    title: 'Bevor Sie gehen…',
    body: 'Nehmen Sie die kostenlose Checkliste mit 12 Aufgaben mit, die ein KI-Agent sofort übernehmen kann. Ohne Anmeldung.',
    cta: 'Checkliste ansehen',
    alt: '30 Minuten buchen',
    close: 'Nein, danke',
  },

  cookies: {
    text: 'Wir verwenden notwendigen Speicher, damit die Website funktioniert. Mit Ihrer Erlaubnis nutzen wir zusätzlich das Meta Pixel zur Messung von Kampagnen. Sie können Ihre Entscheidung jederzeit ändern.',
    accept: 'Akzeptieren',
    reject: 'Ablehnen',
    policy: 'Cookie-Richtlinie',
    manage: 'Cookie-Einstellungen',
  },

  footer: {
    tagline: 'KI-Agenten und Hyperautomatisierung für Unternehmen. Braga, Portugal — seit 2024.',
    contact: 'Kontakt',
    follow: 'Social Media',
    legal: 'Rechtliches',
    languages: 'Sprachen',
    rights: 'Alle Rechte vorbehalten.',
  },

  legal: {
    updated: 'Zuletzt aktualisiert: 27. September 2026',
    privacy: {
      title: 'Datenschutzerklärung',
      sections: [
        {
          h: '1. Verantwortlicher',
          p: ['DevloperEU (devloper.eu), Braga, Portugal. Kontakt: contato@devlopereu.com.'],
        },
        {
          h: '2. Welche Daten wir verarbeiten',
          items: [
            'Daten, die Sie uns bei einer Terminanfrage senden: Name, Unternehmen, E-Mail oder Telefon, gewünschter Tag und Uhrzeit sowie Hinweise.',
            'Ihre Antworten an den Agenten der Website (Branche, Priorität, Teamgröße) — sie bleiben nur in Ihrem Browser, sofern Sie sie nicht in die Anfrage übernehmen.',
            'Daten zur Kampagnenmessung (Meta Pixel), nur wenn Sie Marketing-Cookies akzeptieren.',
            'An den Agenten der Website geschriebene oder gesprochene Nachrichten: Nach dem Hinweis im Chat werden sie nur zur Erstellung der Antwort an den konfigurierten KI-Anbieter (z. B. Google Gemini) gesendet; wir speichern sie nicht auf dem Server. Sprache wird im Browser oder bei Bedarf vom selben Anbieter transkribiert.',
          ],
        },
        {
          h: '3. Zwecke und Rechtsgrundlage',
          items: [
            'Beantwortung Ihrer Anfrage und Terminvereinbarung — vorvertragliche Maßnahmen auf Ihre Anfrage.',
            'Kampagnenmessung — Einwilligung, die Sie jederzeit widerrufen können.',
            'Erfüllung rechtlicher Pflichten, sofern zutreffend.',
          ],
        },
        {
          h: '4. Speicherdauer',
          p: ['Kontaktanfragen werden so lange gespeichert, wie es für ihre Bearbeitung nötig ist, höchstens 24 Monate ohne erneuten Kontakt.'],
        },
        {
          h: '5. Weitergabe und Übermittlungen',
          p: [
            'Anfragen laufen über den von Ihnen gewählten Kanal (WhatsApp oder E-Mail) und unterliegen dessen Richtlinien. Mit Ihrer Einwilligung erhält Meta Platforms Nutzungsdaten zur Messung; Übermittlungen außerhalb des EWR können auf Grundlage von Standardvertragsklauseln erfolgen.',
          ],
        },
        {
          h: '6. Ihre Rechte',
          items: [
            'Auskunft, Berichtigung und Löschung Ihrer Daten.',
            'Einschränkung der Verarbeitung, Widerspruch und Datenübertragbarkeit.',
            'Widerruf der Einwilligung jederzeit, ohne Auswirkung auf die bisherige Verarbeitung.',
            'Beschwerde bei der CNPD (www.cnpd.pt).',
          ],
        },
      ],
    },
    cookies: {
      title: 'Cookie-Richtlinie',
      sections: [
        {
          h: '1. Was wir verwenden',
          items: [
            'Notwendig (lokaler Speicher): speichert Ihre Cookie-Auswahl, die Sprache und den Ansichtsmodus. Keine Einwilligung erforderlich.',
            'Marketing (Meta Pixel, ID 998154455530660): wird erst nach einem Klick auf „Akzeptieren“ geladen. Misst Besuche und Conversions von Kampagnen.',
          ],
        },
        {
          h: '2. Verwaltung',
          p: [
            'Sie können Ihre Auswahl jederzeit über den Link „Cookie-Einstellungen“ in der Fußzeile ändern oder die Daten der Website in den Browsereinstellungen löschen.',
          ],
        },
        {
          h: '3. Dauer',
          items: ['Ihre Auswahl bleibt gespeichert, bis Sie sie ändern oder die Browserdaten löschen.', 'Meta-Cookies folgen den von Meta festgelegten Fristen (bis zu 90 Tage).'],
        },
      ],
    },
    terms: {
      title: 'Nutzungsbedingungen',
      sections: [
        {
          h: '1. Annahme',
          p: ['Mit der Nutzung von devloper.eu akzeptieren Sie diese Bedingungen. Wenn Sie nicht einverstanden sind, nutzen Sie die Website bitte nicht.'],
        },
        {
          h: '2. Die Website',
          p: [
            'Der Agent und die gezeigten Simulationen sind beispielhaft und stellen kein kommerzielles Angebot dar. Die tatsächlichen Ergebnisse hängen vom Einzelfall ab und werden in einem Termin bewertet.',
          ],
        },
        {
          h: '3. Geistiges Eigentum',
          p: ['Marke, Logo, Texte und Code der Website gehören DevloperEU und dürfen ohne Genehmigung nicht weiterverwendet werden.'],
        },
        {
          h: '4. Haftung',
          p: ['Wir bemühen uns, die Informationen korrekt und aktuell zu halten, garantieren jedoch keine Fehler- oder Unterbrechungsfreiheit.'],
        },
        {
          h: '5. Anwendbares Recht',
          p: ['Diese Bedingungen unterliegen portugiesischem Recht. Zuständig sind die Gerichte des Bezirks Braga, unbeschadet zwingender Verbraucherschutzvorschriften.'],
        },
      ],
    },
  },
};
