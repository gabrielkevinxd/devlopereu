import type { Dict } from './pt';

export const sv: Dict = {
  meta: {
    title: 'DevloperEU — AI-agenter och automatisering för företag | Braga, Portugal',
    description:
      'AI-agenter och hyperautomatisering för företag i Portugal och Europa. Prata med vår agent, se en simulering av ditt fall och boka 30 minuter. Braga, sedan 2024.',
    ogAlt: 'DevloperEU-logotyp — gyllene huvud av neurala nätverk',
    ogLocale: 'sv_SE',
  },

  ui: {
    skip: 'Hoppa till innehållet',
    modeLabel: 'Visningsläge',
    modeChat: 'Chatta',
    modeRead: 'Bläddra',
    book: 'Boka möte',
    bookShort: 'Boka',
    language: 'Språk',
    status: 'agent online',
    location: 'Braga, PT',
    restart: 'Börja om',
    skipToBooking: 'Gå direkt till bokning',
    toClassic: 'Klassiskt läge',
    toChat: 'Prata med agenten',
    simulation: 'Illustrativ simulering',
    typing: 'Agenten skriver…',
    stageLabel: 'Agentens scen',
    chatLabel: 'Samtal med agenten',
    answersLabel: 'Föreslagna svar',
    close: 'Stäng',
    you: 'Du',
    agent: 'DevloperEU-agenten',
    home: 'Startsida',
  },

  boot: ['startar devloper.eu-agenten', 'laddar förmågor · 6/6', 'kontext · företag i Portugal och Europa', 'redo'],

  chat: {
    intro: 'Hej. Jag är DevloperEU:s agent.',
    introSub:
      'På under en minut visar jag vad en AI-agent skulle göra i ditt företag — med en simulering av ditt fall. Inga formulär.',
    introYes: 'Visa mig i mitt företag',
    introNo: 'Jag bläddrar hellre på sajten',
    askSector: 'Till att börja med: vilken bransch är ditt företag verksamt i?',
    askPain: 'Uppfattat — {sector}. Var förlorar teamet mest tid i dag?',
    askTeam: 'Sista frågan. Hur många personer arbetar med detta, och hur många timmar i veckan lägger var och en?',
    people: 'Personer som berörs',
    hours: 'Timmar per person och vecka',
    confirmTeam: 'Bygg min agent',
    teamAnswer: '{people} personer · {hours} h/vecka var',
    building: 'Perfekt. Jag bygger en agent för {pain} inom {sector} … titta på scenen.',
    simDone:
      'Här är agenten i arbete med ditt fall. Om den tar över hälften av de repetitiva uppgifterna får teamet tillbaka ungefär {result} timmar i veckan.',
    simNote: 'Det här är en illustrativ simulering med dina siffror — på mötet mäter vi med dina riktiga data.',
    toCaps: 'Vilka förmågor skulle den använda?',
    capsIntro:
      'För ditt fall har jag aktiverat {count} förmågor. De övriga finns också — tryck på någon för att läsa mer.',
    capsOpened: '{name}: {short}',
    toBook: 'Jag vill se det här med mina data',
    askBook:
      'Jag föreslår 30 minuter via videosamtal: vi förstår processen, visar agenten med dina data och berättar vad som är möjligt. Välj dag och tid på scenen.',
    bookedWhatsapp: 'Förfrågan är klar och öppnad i WhatsApp. Så fort du skickar den bekräftar vi tiden.',
    bookedEmail: 'Förfrågan är klar i ditt e-postprogram. Så fort du skickar den bekräftar vi tiden.',
    bookedCalendar: 'Jag öppnade vår kalender i ett nytt fönster så att du kan bekräfta tiden.',
    afterBook: 'Medan du väntar kan du ta med dig den kostnadsfria checklistan med 12 uppgifter som en AI-agent kan ta över direkt.',
    magnetCta: 'Öppna checklistan',
    jumpBook: 'Vi går direkt till bokningen. Välj dag och tid på scenen — resten tar jag hand om.',
  },

  sectors: [
    { id: 'comercio', label: 'Handel och e-handel', who: 'butikskunder' },
    { id: 'servicos', label: 'Professionella tjänster', who: 'kunder' },
    { id: 'industria', label: 'Industri och logistik', who: 'kunder och leverantörer' },
    { id: 'saude', label: 'Vård och kliniker', who: 'patienter' },
    { id: 'imobiliario', label: 'Fastigheter', who: 'intressenter' },
    { id: 'turismo', label: 'Turism och restaurang', who: 'gäster och kunder' },
  ],

  pains: [
    {
      id: 'atendimento',
      label: 'Kundservice och meddelanden',
      agentName: 'kundservice',
      flow: ['WhatsApp, e-post och webb', 'Agenten förstår förfrågan', 'Kollar dina system', 'Svarar och loggar'],
      log: [
        'Nytt WhatsApp-meddelande — ”Har ni fortfarande lediga tider den här veckan?”',
        'Avsikt identifierad: tillgänglighet · säkerhet 0,94',
        'Intern kalender kontrollerad → 3 lediga tider',
        'Svar skickat med 3 tidsförslag',
        'Val bekräftat → post skapad i CRM',
        'Dagssammanfattning skickad till teamet',
      ],
      services: ['automacao', 'consultoria', 'desenvolvimento'],
    },
    {
      id: 'documentos',
      label: 'Fakturor och dokument',
      agentName: 'dokument',
      flow: ['E-post och skanningar', 'Agenten läser dokumentet', 'Validerar och stämmer av', 'Bokför i affärssystemet'],
      log: [
        'Faktura mottagen via e-post — PDF, 2 sidor',
        'Fält extraherade: momsnr, datum, summa, moms',
        'Validering: leverantörens momsnummer stämmer',
        'Avstämning mot beställningen → beloppen stämmer',
        'Verifikation förberedd i ERP för godkännande',
        'Avvikelse flaggad: 1 dokument utan beställning',
      ],
      services: ['automacao', 'machine_learning', 'desenvolvimento'],
    },
    {
      id: 'agenda',
      label: 'Bokningar och kalender',
      agentName: 'bokningar',
      flow: ['Bokningsförfrågningar', 'Agenten föreslår tider', 'Synkar kalendern', 'Bekräftar och påminner'],
      log: [
        'Bokningsförfrågan mottagen via webbplatsen',
        'Önskemål identifierat: sen eftermiddag',
        'Teamets kalender kontrollerad → 2 alternativ',
        'Bokning bekräftad och tillagd i kalendern',
        'Påminnelse schemalagd dagen innan',
        'Avbokning mottagen → tiden öppnad igen automatiskt',
      ],
      services: ['automacao', 'desenvolvimento'],
    },
    {
      id: 'leads',
      label: 'Leads och försäljning',
      agentName: 'försäljning',
      flow: ['Formulär och annonser', 'Agenten kvalificerar', 'Uppdaterar CRM', 'Följer upp'],
      log: [
        'Ny kontakt via webbformuläret',
        'Berikning: bransch och storlek identifierade',
        'Kvalificeringspoäng: 82/100',
        'Affärsmöjlighet skapad i CRM med sammanfattning',
        'Personligt första svar skickat',
        'Uppföljning schemalagd om 3 dagar',
      ],
      services: ['automacao', 'analytics', 'machine_learning'],
    },
    {
      id: 'relatorios',
      label: 'Rapporter och data',
      agentName: 'rapportering',
      flow: ['Kalkylark, ERP och CRM', 'Agenten samlar data', 'Beräknar nyckeltal', 'Skickar rapporten'],
      log: [
        'Insamling: 4 datakällor anslutna',
        'Tvätt: 37 dubblettrader borttagna',
        'Veckans nyckeltal beräknade',
        'Avvikelse upptäckt: försäljning region norr −12 %',
        'PDF-rapport skapad och dashboard uppdaterad',
        'Varning skickad till ledningen',
      ],
      services: ['analytics', 'big_data', 'automacao'],
    },
    {
      id: 'operacoes',
      label: 'Order och lager',
      agentName: 'drift',
      flow: ['Order och försäljning', 'Agenten prognostiserar efterfrågan', 'Kontrollerar lagret', 'Förbereder påfyllning'],
      log: [
        'Order mottagen — 3 artiklar',
        'Lager kontrollerat i 2 lagerlokaler',
        'Prognos: artikel A slut om 9 dagar',
        'Förslag på påfyllning skapat',
        'Leverantörsorder förberedd för godkännande',
        'Kunden informerad om leveranstiden',
      ],
      services: ['machine_learning', 'big_data', 'automacao'],
    },
  ],

  profile: {
    title: 'Företagsprofil',
    subtitle: 'skapas live av agenten',
    sector: 'Bransch',
    pain: 'Prioritet',
    team: 'Team',
    hours: 'Tidsåtgång',
    pending: 'väntar…',
    peopleUnit: 'personer',
    hoursUnit: 'h/vecka var',
  },

  sim: {
    title: 'Agent · {pain}',
    running: 'körs',
    events: 'Händelselogg',
    tasks: 'Hanterade uppgifter',
    response: 'Svarstid',
    responseValue: '< 5 s',
    scenario: 'Scenario: frigjorda timmar per vecka',
    formula: '{people} personer × {hours} h × 50 % = {result} h',
    disclaimer: 'Illustrativ simulering. De verkliga värdena beror på din process och mäts på mötet.',
  },

  services: [
    {
      id: 'consultoria',
      name: 'AI-rådgivning',
      short: 'Strategi och analys: där AI lönar sig i ditt företag.',
      bullets: ['Karta över processer och möjligheter', 'Plan i etapper med prioriteringar', 'Val av verktyg och risker (GDPR, AI Act)'],
      why: 'Avgör var du ska börja och vad som inte är värt att automatisera.',
    },
    {
      id: 'automacao',
      name: 'Automatisering',
      short: 'AI-agenter och hyperautomatisering som sköter repetitiva uppgifter från början till slut.',
      bullets: ['Agenter i WhatsApp, e-post och webb', 'Integration med ERP, CRM och kalkylark', 'En människa i loopen när det behövs'],
      why: 'Den är motorn i agenten du såg i simuleringen.',
    },
    {
      id: 'machine_learning',
      name: 'Machine Learning',
      short: 'Modeller som klassificerar, extraherar och förutser utifrån dina data.',
      bullets: ['Dokumentläsning', 'Prognoser för efterfrågan och risker', 'Klassificering av förfrågningar'],
      why: 'Ger agenten förmågan att läsa, klassificera och förutse.',
    },
    {
      id: 'big_data',
      name: 'Big Data',
      short: 'Insamling, tvätt och organisering av data som är utspridd i flera källor.',
      bullets: ['Datapipelines', 'Kvalitet och deduplicering', 'Skalbar arkitektur'],
      why: 'Samlar de datakällor som agenten behöver.',
    },
    {
      id: 'desenvolvimento',
      name: 'Utveckling',
      short: 'Skräddarsydd mjukvara: portaler, integrationer, API:er och appar.',
      bullets: ['Integrationer och API:er', 'Portaler och interna dashboards', 'Webb- och mobilappar'],
      why: 'Kopplar agenten till de system du redan använder.',
    },
    {
      id: 'analytics',
      name: 'Analytics',
      short: 'Dashboards och nyckeltal för datadrivna beslut.',
      bullets: ['Dashboards i realtid', 'Automatiska rapporter', 'Varningar vid avvikelser'],
      why: 'Visar agentens effekt i siffror.',
    },
  ],

  caps: {
    title: 'Förmågor',
    unlocked: 'aktiverad för ditt fall',
    available: 'tillgänglig',
    why: 'Varför',
  },

  booking: {
    title: 'Boka 30 minuter',
    duration: '30 min · videosamtal · utan förpliktelser',
    day: 'Dag',
    time: 'Tid (Lissabon)',
    name: 'Namn',
    company: 'Företag (valfritt)',
    contact: 'E-post eller telefon',
    contactHint: 'Endast för att bekräfta mötet.',
    notes: 'Något vi bör veta? (valfritt)',
    consent: 'Jag godkänner att DevloperEU använder dessa uppgifter enbart för att besvara denna förfrågan, enligt',
    consentLink: 'Integritetspolicyn',
    whatsapp: 'Skicka förfrågan via WhatsApp',
    email: 'Skicka via e-post',
    calendar: 'Öppna kalendern',
    preview: 'Meddelande som agenten förberett',
    errors: {
      day: 'Välj en dag.',
      time: 'Välj en tid.',
      name: 'Ange ditt namn.',
      contact: 'Ange en giltig e-postadress eller ett telefonnummer.',
      consent: 'Vi behöver ditt samtycke för att skicka förfrågan.',
    },
    message: {
      greeting: 'Hej DevloperEU! Jag vill boka ett möte på 30 min.',
      when: 'När: {day} kl. {time} (Lissabontid)',
      name: 'Namn: {name}',
      company: 'Företag: {company}',
      contact: 'Kontakt: {contact}',
      case: 'Fall: {sector} · {pain} · {people} personer × {hours} h/vecka',
      notes: 'Anteckningar: {notes}',
      subject: 'Mötesförfrågan — {day} {time}',
    },
    done: 'Förfrågan klar',
    doneBody: 'Om fönstret inte öppnades kan du använda kontaktuppgifterna nedan.',
  },

  classic: {
    eyebrow: 'AI-agenter · Hyperautomatisering · Braga, Portugal',
    h1: 'AI-agenter som tar hand om det repetitiva arbetet i ditt företag',
    lead:
      'DevloperEU designar, integrerar och förvaltar skräddarsydda AI-agenter och automatiseringar — kopplade till de system du redan använder, med en människa i loopen när det behövs.',
    ctaPrimary: 'Boka 30 minuter',
    ctaSecondary: 'Prata med agenten',
    servicesTitle: 'Vad vi gör',
    servicesLead: 'Sex förmågor som vi kombinerar efter problemet — inte tvärtom.',
    processTitle: 'Så arbetar vi',
    process: [
      { t: 'Samtal på 30 min', d: 'Vi förstår processen, systemen och var tiden försvinner.' },
      { t: 'Analys', d: 'Vi kartlägger flödet och berättar vad som är möjligt, med risker och prioriteringar.' },
      { t: 'Prototyp', d: 'En första agent i drift på ett verkligt fall, för att validera med teamet.' },
      { t: 'Införande och uppföljning', d: 'Fullständig integration, utbildning och löpande förbättring.' },
    ],
    aboutTitle: 'Om DevloperEU',
    about: [
      'DevloperEU grundades 2024 i Braga, Portugal, och bygger AI-agenter och automatiseringslösningar för företag i Portugal och Europa.',
      'Vi arbetar på sex språk och fokuserar på det som går att mäta: färre manuella uppgifter, snabbare svar och mer tillförlitliga data — alltid i enlighet med GDPR.',
    ],
    faqTitle: 'Vanliga frågor',
    bookingTitle: 'Boka ett möte',
    bookingLead: 'Välj dag och tid. Förfrågan skickas via WhatsApp eller e-post, redan ifylld.',
    contactTitle: 'Kontakt',
  },

  faq: [
    {
      q: 'Vad är en AI-agent?',
      a: 'Ett program som förstår förfrågningar på naturligt språk, kollar dina system och utför uppgifter — svarar kunder, läser dokument, uppdaterar CRM — inom regler som vi sätter upp tillsammans med dig.',
    },
    {
      q: 'Måste vi byta de system vi redan använder?',
      a: 'Oftast inte. Vi kopplar agenten till det som redan finns (e-post, WhatsApp, ERP, CRM, kalkylark) via integrationer och API:er.',
    },
    {
      q: 'Är data säkra och GDPR-kompatibla?',
      a: 'Ja. Vi behandlar bara nödvändiga data, med kontrollerad åtkomst och en logg över agentens åtgärder. På mötet förklarar vi var data lagras i varje lösning.',
    },
    {
      q: 'Vad kostar det?',
      a: 'Det beror på omfattningen. Efter det inledande samtalet och analysen presenterar vi ett förslag med etapper och fasta priser.',
    },
    {
      q: 'Hur lång tid tar det innan en agent är i drift?',
      a: 'Det beror på komplexitet och integrationer. Vi börjar med en prototyp på ett konkret fall för att validera tidigt; den exakta tidsplanen fastställs i analysen.',
    },
    {
      q: 'Ersätter agenten människor?',
      a: 'Målet är att befria teamet från repetitivt arbete. Känsliga beslut ligger kvar hos en person, som agenten förbereder och informerar.',
    },
    {
      q: 'Arbetar ni bara i Braga?',
      a: 'Vi finns i Braga men arbetar på distans med företag i hela Portugal och Europa.',
    },
    {
      q: 'Är det första mötet förpliktande?',
      a: 'Nej. Det är 30 minuter för att förstå ditt fall och ärligt berätta om och hur AI kan hjälpa.',
    },
  ],

  magnet: {
    title: 'Checklista: 12 uppgifter som en AI-agent kan ta över direkt',
    lead: 'Bocka för de som förekommer i ditt företag. Har du bockat för tre eller fler finns det en agent som kan spara tid åt dig.',
    cta: 'Se den kostnadsfria checklistan',
    print: 'Spara som PDF / skriv ut',
    back: 'Tillbaka till agenten',
    footer: 'Vill du veta var du ska börja? Boka 30 minuter med oss.',
    items: [
      'Svara på återkommande kundfrågor (öppettider, priser, tillgänglighet)',
      'Sortera och vidarebefordra e-post till rätt person',
      'Boka, bekräfta och påminna om möten eller besök',
      'Extrahera data från fakturor, kvitton och avtal',
      'Föra in dokument i affärssystemet eller bokföringen',
      'Kvalificera kontakter som kommer via webben eller annonser',
      'Uppdatera CRM efter varje samtal',
      'Följa upp obesvarade offerter',
      'Samla data från flera kalkylark i en veckorapport',
      'Upptäcka avvikelser i försäljning, kostnader eller lager',
      'Förutse slutförsäljning och förbereda leverantörsorder',
      'Besvara interna informationsförfrågningar (HR, rutiner)',
    ],
  },

  exit: {
    title: 'Innan du går…',
    body: 'Ta med dig den kostnadsfria checklistan med 12 uppgifter som en AI-agent kan ta över direkt. Ingen registrering.',
    cta: 'Se checklistan',
    alt: 'Boka 30 minuter',
    close: 'Nej tack',
  },

  cookies: {
    text: 'Vi använder nödvändig lagring för att webbplatsen ska fungera. Med ditt tillstånd använder vi även Meta Pixel för att mäta kampanjer. Du kan ändra dig när som helst.',
    accept: 'Godkänn',
    reject: 'Avvisa',
    policy: 'Cookiepolicy',
    manage: 'Cookie-inställningar',
  },

  footer: {
    tagline: 'AI-agenter och hyperautomatisering för företag. Braga, Portugal — sedan 2024.',
    contact: 'Kontakt',
    follow: 'Sociala medier',
    legal: 'Juridiskt',
    languages: 'Språk',
    rights: 'Alla rättigheter förbehållna.',
  },

  legal: {
    updated: 'Senast uppdaterad: 27 september 2026',
    privacy: {
      title: 'Integritetspolicy',
      sections: [
        {
          h: '1. Personuppgiftsansvarig',
          p: ['DevloperEU (devloper.eu), Braga, Portugal. Kontakt: contato@devlopereu.com.'],
        },
        {
          h: '2. Vilka uppgifter vi behandlar',
          items: [
            'Uppgifter du skickar när du begär ett möte: namn, företag, e-post eller telefon, önskad dag och tid samt anteckningar.',
            'Dina svar till webbplatsens agent (bransch, prioritet, teamstorlek) — de stannar endast i din webbläsare, om du inte tar med dem i förfrågan.',
            'Data för kampanjmätning (Meta Pixel), endast om du godkänner marknadsföringscookies.',
          ],
        },
        {
          h: '3. Ändamål och rättslig grund',
          items: [
            'Besvara din förfrågan och boka mötet — åtgärder före avtal på din begäran.',
            'Kampanjmätning — samtycke, som du kan återkalla när som helst.',
            'Fullgörande av rättsliga förpliktelser, i förekommande fall.',
          ],
        },
        {
          h: '4. Lagringstid',
          p: ['Kontaktförfrågningar sparas så länge som behövs för att hantera dem, dock högst 24 månader utan ny kontakt.'],
        },
        {
          h: '5. Delning och överföringar',
          p: [
            'Förfrågningar skickas via den kanal du väljer (WhatsApp eller e-post) och omfattas av dessa tjänsters villkor. Med ditt samtycke tar Meta Platforms emot surfdata för mätning; överföringar utanför EES kan ske med stöd av standardavtalsklausuler.',
          ],
        },
        {
          h: '6. Dina rättigheter',
          items: [
            'Tillgång till, rättelse och radering av dina uppgifter.',
            'Begränsning av och invändning mot behandling samt dataportabilitet.',
            'Återkalla samtycket när som helst, utan att det påverkar tidigare behandling.',
            'Lämna klagomål till CNPD (www.cnpd.pt).',
          ],
        },
      ],
    },
    cookies: {
      title: 'Cookiepolicy',
      sections: [
        {
          h: '1. Vad vi använder',
          items: [
            'Nödvändiga (lokal lagring): sparar ditt cookieval, språket och visningsläget. Kräver inget samtycke.',
            'Marknadsföring (Meta Pixel, id 998154455530660): laddas först när du klickar på ”Godkänn”. Mäter besök och konverteringar från kampanjer.',
          ],
        },
        {
          h: '2. Så hanterar du dem',
          p: [
            'Du kan ändra ditt val när som helst via länken ”Cookie-inställningar” i sidfoten, eller radera webbplatsens data i webbläsarens inställningar.',
          ],
        },
        {
          h: '3. Varaktighet',
          items: ['Ditt val sparas tills du ändrar det eller rensar webbläsarens data.', 'Metas cookies följer de tider som Meta fastställt (upp till 90 dagar).'],
        },
      ],
    },
    terms: {
      title: 'Användarvillkor',
      sections: [
        {
          h: '1. Godkännande',
          p: ['Genom att använda devloper.eu godkänner du dessa villkor. Om du inte godkänner dem ska du inte använda webbplatsen.'],
        },
        {
          h: '2. Webbplatsen',
          p: [
            'Agenten och de simuleringar som visas är illustrativa och utgör inget kommersiellt erbjudande. Verkliga resultat beror på varje fall och bedöms vid ett möte.',
          ],
        },
        {
          h: '3. Immateriella rättigheter',
          p: ['Varumärket, logotypen, texterna och koden på webbplatsen tillhör DevloperEU och får inte återanvändas utan tillstånd.'],
        },
        {
          h: '4. Ansvar',
          p: ['Vi strävar efter att hålla informationen korrekt och aktuell, men garanterar inte att den är fri från fel eller avbrott.'],
        },
        {
          h: '5. Tillämplig lag',
          p: ['Dessa villkor regleras av portugisisk lag. Domstolarna i Braga är behöriga, utan att det påverkar tvingande konsumentskyddsregler.'],
        },
      ],
    },
  },
};
