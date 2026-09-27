import type { Dict } from './pt';

export const fr: Dict = {
  meta: {
    title: 'DevloperEU — Agents IA et automatisation pour les entreprises | Braga, Portugal',
    description:
      'Agents IA et hyperautomatisation pour les entreprises au Portugal et en Europe. Discutez avec notre agent, voyez une simulation de votre cas et réservez 30 minutes. Braga, depuis 2024.',
    ogAlt: 'Logo DevloperEU — tête en réseau neuronal doré',
    ogLocale: 'fr_FR',
  },

  ui: {
    skip: 'Aller au contenu',
    modeLabel: "Mode d'affichage",
    modeChat: 'Discuter',
    modeRead: 'Naviguer',
    book: 'Prendre rendez-vous',
    bookShort: 'Réserver',
    language: 'Langue',
    status: 'agent en ligne',
    location: 'Braga, PT',
    restart: 'Recommencer',
    skipToBooking: 'Aller directement à la réservation',
    toClassic: 'Mode classique',
    toChat: "Discuter avec l'agent",
    simulation: 'Simulation illustrative',
    typing: "L'agent écrit…",
    stageLabel: "Scène de l'agent",
    chatLabel: "Conversation avec l'agent",
    answersLabel: 'Réponses suggérées',
    close: 'Fermer',
    you: 'Vous',
    agent: 'Agent DevloperEU',
    home: "Page d'accueil",
  },

  boot: ["démarrage de l'agent devloper.eu", 'chargement des capacités · 6/6', 'contexte · entreprises au Portugal et en Europe', 'prêt'],

  chat: {
    intro: "Bonjour. Je suis l'agent de DevloperEU.",
    introSub:
      "En moins d'une minute, je vous montre ce qu'un agent IA ferait dans votre entreprise — avec une simulation de votre cas. Sans formulaire.",
    introYes: 'Montrez-moi dans mon entreprise',
    introNo: 'Je préfère naviguer sur le site',
    askSector: 'Pour commencer : dans quel secteur travaille votre entreprise ?',
    askPain: 'Compris — {sector}. Où votre équipe perd-elle le plus de temps aujourd’hui ?',
    askTeam: 'Dernière question. Combien de personnes s’en occupent et combien d’heures par semaine chacune y consacre-t-elle ?',
    people: 'Personnes concernées',
    hours: 'Heures par personne, par semaine',
    confirmTeam: 'Construire mon agent',
    teamAnswer: '{people} personnes · {hours} h/semaine chacune',
    building: 'Parfait. Je construis un agent {pain} pour {sector}… regardez la scène.',
    simDone:
      "Voici l'agent au travail sur votre cas. S'il prend en charge la moitié des tâches répétitives, votre équipe récupère environ {result} heures par semaine.",
    simNote: 'Il s’agit d’une simulation illustrative avec vos chiffres — en rendez-vous, nous mesurons avec vos données réelles.',
    toCaps: 'Quelles capacités utiliserait-il ?',
    capsIntro:
      "Pour votre cas, j'ai activé {count} capacités. Les autres sont aussi disponibles — touchez-en une pour en savoir plus.",
    capsOpened: '{name} : {short}',
    toBook: 'Je veux voir ça avec mes données',
    askBook:
      'Je vous propose 30 minutes en visioconférence : nous comprenons le processus, vous montrons l’agent avec vos données et vous disons ce qui est faisable. Choisissez un jour et une heure sur la scène.',
    bookedWhatsapp: 'Demande prête et ouverte dans WhatsApp. Dès que vous l’envoyez, nous confirmons l’heure.',
    bookedEmail: 'Demande prête dans votre messagerie. Dès que vous l’envoyez, nous confirmons l’heure.',
    bookedCalendar: "J'ai ouvert notre calendrier dans une nouvelle fenêtre pour confirmer l'heure.",
    afterBook: 'En attendant, emportez la checklist gratuite des 12 tâches qu’un agent IA peut reprendre dès maintenant.',
    magnetCta: 'Ouvrir la checklist',
    jumpBook: 'Allons directement à la réservation. Choisissez un jour et une heure sur la scène — je m’occupe du reste.',
  },

  sectors: [
    { id: 'comercio', label: 'Commerce et e-commerce', who: 'clients de la boutique' },
    { id: 'servicos', label: 'Services professionnels', who: 'clients' },
    { id: 'industria', label: 'Industrie et logistique', who: 'clients et fournisseurs' },
    { id: 'saude', label: 'Santé et cliniques', who: 'patients' },
    { id: 'imobiliario', label: 'Immobilier', who: 'prospects' },
    { id: 'turismo', label: 'Tourisme et restauration', who: 'hôtes et clients' },
  ],

  pains: [
    {
      id: 'atendimento',
      label: 'Service client et messages',
      agentName: 'service client',
      flow: ['WhatsApp, e-mail et site', 'L’agent comprend la demande', 'Consulte vos systèmes', 'Répond et enregistre'],
      log: [
        'Nouveau message WhatsApp — « Avez-vous encore des disponibilités cette semaine ? »',
        'Intention détectée : disponibilité · confiance 0,94',
        'Agenda interne consulté → 3 créneaux libres',
        'Réponse envoyée avec 3 options d’horaire',
        'Choix confirmé → fiche créée dans le CRM',
        'Résumé du jour envoyé à l’équipe',
      ],
      services: ['automacao', 'consultoria', 'desenvolvimento'],
    },
    {
      id: 'documentos',
      label: 'Factures et documents',
      agentName: 'documents',
      flow: ['E-mails et numérisations', 'L’agent lit le document', 'Valide et recoupe', 'Saisit dans l’ERP'],
      log: [
        'Facture reçue par e-mail — PDF, 2 pages',
        'Champs extraits : n° TVA, date, total, TVA',
        'Validation : n° TVA du fournisseur conforme',
        'Rapprochement avec la commande → montants concordants',
        'Écriture préparée dans l’ERP pour validation',
        'Exception signalée : 1 document sans commande',
      ],
      services: ['automacao', 'machine_learning', 'desenvolvimento'],
    },
    {
      id: 'agenda',
      label: 'Rendez-vous et agenda',
      agentName: 'rendez-vous',
      flow: ['Demandes de rendez-vous', 'L’agent propose des créneaux', 'Synchronise l’agenda', 'Confirme et rappelle'],
      log: [
        'Demande de rendez-vous reçue via le site',
        'Préférence détectée : fin d’après-midi',
        'Agenda de l’équipe consulté → 2 options',
        'Rendez-vous confirmé et ajouté au calendrier',
        'Rappel programmé pour la veille',
        'Annulation reçue → créneau rouvert automatiquement',
      ],
      services: ['automacao', 'desenvolvimento'],
    },
    {
      id: 'leads',
      label: 'Prospects et ventes',
      agentName: 'ventes',
      flow: ['Formulaires et annonces', 'L’agent qualifie', 'Met à jour le CRM', 'Assure le suivi'],
      log: [
        'Nouveau contact via le formulaire du site',
        'Enrichissement : secteur et taille identifiés',
        'Score de qualification : 82/100',
        'Opportunité créée dans le CRM avec résumé',
        'Première réponse personnalisée envoyée',
        'Relance programmée dans 3 jours',
      ],
      services: ['automacao', 'analytics', 'machine_learning'],
    },
    {
      id: 'relatorios',
      label: 'Rapports et données',
      agentName: 'reporting',
      flow: ['Tableurs, ERP et CRM', 'L’agent regroupe les données', 'Calcule les indicateurs', 'Envoie le rapport'],
      log: [
        'Collecte : 4 sources de données connectées',
        'Nettoyage : 37 lignes en double supprimées',
        'Indicateurs hebdomadaires calculés',
        'Écart détecté : ventes région nord −12 %',
        'Rapport PDF généré et tableau de bord mis à jour',
        'Alerte envoyée à la direction',
      ],
      services: ['analytics', 'big_data', 'automacao'],
    },
    {
      id: 'operacoes',
      label: 'Commandes et stock',
      agentName: 'opérations',
      flow: ['Commandes et ventes', 'L’agent prévoit la demande', 'Vérifie le stock', 'Prépare le réassort'],
      log: [
        'Commande reçue — 3 articles',
        'Stock vérifié dans 2 entrepôts',
        'Prévision : rupture de l’article A dans 9 jours',
        'Proposition de réassort générée',
        'Commande fournisseur préparée pour validation',
        'Client informé du délai de livraison',
      ],
      services: ['machine_learning', 'big_data', 'automacao'],
    },
  ],

  profile: {
    title: "Fiche de l'entreprise",
    subtitle: "générée en direct par l'agent",
    sector: 'Secteur',
    pain: 'Priorité',
    team: 'Équipe',
    hours: 'Temps passé',
    pending: 'en attente…',
    peopleUnit: 'personnes',
    hoursUnit: 'h/semaine chacune',
  },

  sim: {
    title: 'Agent · {pain}',
    running: 'en cours',
    events: 'Journal des événements',
    tasks: 'Tâches traitées',
    response: 'Réponse',
    responseValue: '< 5 s',
    scenario: 'Scénario : heures libérées par semaine',
    formula: '{people} personnes × {hours} h × {share}% = {result} h',
    disclaimer: 'Simulation illustrative. Les valeurs réelles dépendent de votre processus et sont mesurées en rendez-vous.',
  },

  services: [
    {
      id: 'consultoria',
      name: 'Conseil IA',
      short: 'Stratégie et diagnostic : là où l’IA est rentable dans votre entreprise.',
      bullets: ['Cartographie des processus et opportunités', 'Plan par phases avec priorités', 'Choix des outils et risques (RGPD, AI Act)'],
      why: 'Définit par où commencer et ce qui ne vaut pas la peine d’être automatisé.',
    },
    {
      id: 'automacao',
      name: 'Automatisation',
      short: 'Agents IA et hyperautomatisation qui traitent les tâches répétitives de bout en bout.',
      bullets: ['Agents sur WhatsApp, e-mail et site', 'Intégration avec ERP, CRM et tableurs', 'Un humain dans la boucle si nécessaire'],
      why: 'C’est le moteur de l’agent que vous avez vu dans la simulation.',
    },
    {
      id: 'machine_learning',
      name: 'Machine Learning',
      short: 'Des modèles qui classent, extraient et prévoient à partir de vos données.',
      bullets: ['Lecture de documents', 'Prévision de la demande et des risques', 'Classification des demandes'],
      why: 'Donne à l’agent la capacité de lire, classer et prévoir.',
    },
    {
      id: 'big_data',
      name: 'Big Data',
      short: 'Collecte, nettoyage et organisation de données dispersées entre plusieurs sources.',
      bullets: ['Pipelines de données', 'Qualité et dédoublonnage', 'Architecture évolutive'],
      why: 'Réunit les sources de données dont l’agent a besoin.',
    },
    {
      id: 'desenvolvimento',
      name: 'Développement',
      short: 'Logiciels sur mesure : portails, intégrations, API et applications.',
      bullets: ['Intégrations et API', 'Portails et tableaux de bord internes', 'Applications web et mobiles'],
      why: 'Connecte l’agent aux systèmes que vous utilisez déjà.',
    },
    {
      id: 'analytics',
      name: 'Analytics',
      short: 'Tableaux de bord et indicateurs pour décider sur la base des données.',
      bullets: ['Tableaux de bord en temps réel', 'Rapports automatiques', 'Alertes d’écart'],
      why: 'Vous montre l’impact de l’agent en chiffres.',
    },
  ],

  caps: {
    title: 'Capacités',
    unlocked: 'activée pour votre cas',
    available: 'disponible',
    why: 'Pourquoi',
  },

  booking: {
    title: 'Réserver 30 minutes',
    duration: '30 min · visioconférence · sans engagement',
    day: 'Jour',
    time: 'Heure (Lisbonne)',
    name: 'Nom',
    company: 'Entreprise (facultatif)',
    contact: 'E-mail ou téléphone',
    contactHint: 'Uniquement pour confirmer le rendez-vous.',
    notes: 'Quelque chose à nous signaler ? (facultatif)',
    consent: 'J’accepte que DevloperEU utilise ces données uniquement pour répondre à cette demande, conformément à la',
    consentLink: 'Politique de confidentialité',
    whatsapp: 'Envoyer la demande par WhatsApp',
    email: 'Envoyer par e-mail',
    calendar: 'Ouvrir le calendrier',
    preview: "Message préparé par l'agent",
    errors: {
      day: 'Choisissez un jour.',
      time: 'Choisissez une heure.',
      name: 'Indiquez votre nom.',
      contact: 'Indiquez un e-mail ou un téléphone valide.',
      consent: 'Votre consentement est nécessaire pour envoyer la demande.',
    },
    message: {
      greeting: 'Bonjour DevloperEU ! Je souhaite réserver un rendez-vous de 30 min.',
      when: 'Quand : {day} à {time} (heure de Lisbonne)',
      name: 'Nom : {name}',
      company: 'Entreprise : {company}',
      contact: 'Contact : {contact}',
      case: 'Cas : {sector} · {pain} · {people} personnes × {hours} h/semaine',
      notes: 'Notes : {notes}',
      subject: 'Demande de rendez-vous — {day} {time}',
    },
    done: 'Demande prête',
    doneBody: 'Si la fenêtre ne s’est pas ouverte, utilisez les contacts ci-dessous.',
  },

  classic: {
    eyebrow: 'Agents IA · Hyperautomatisation · Braga, Portugal',
    h1: 'Des agents IA qui prennent en charge le travail répétitif de votre entreprise',
    lead:
      'DevloperEU conçoit, intègre et accompagne des agents IA et des automatisations sur mesure — connectés aux systèmes que vous utilisez déjà, avec une personne dans la boucle quand c’est nécessaire.',
    ctaPrimary: 'Réserver 30 minutes',
    ctaSecondary: "Discuter avec l'agent",
    servicesTitle: 'Ce que nous faisons',
    servicesLead: 'Six capacités que nous combinons selon le problème — et non l’inverse.',
    processTitle: 'Notre méthode',
    process: [
      { t: 'Échange de 30 min', d: 'Nous comprenons le processus, les systèmes et où le temps se perd.' },
      { t: 'Diagnostic', d: 'Nous cartographions le flux et vous disons ce qui est faisable, avec risques et priorités.' },
      { t: 'Prototype', d: 'Un premier agent opérationnel sur un cas réel, validé avec l’équipe.' },
      { t: 'Mise en œuvre et suivi', d: 'Intégration complète, formation et amélioration continue.' },
    ],
    aboutTitle: 'À propos de DevloperEU',
    about: [
      'Fondée en 2024 à Braga, au Portugal, DevloperEU crée des agents IA et des solutions d’automatisation pour les entreprises au Portugal et en Europe.',
      'Nous travaillons en six langues et nous concentrons sur ce qui se mesure : moins de tâches manuelles, des réponses plus rapides et des données plus fiables — toujours en conformité avec le RGPD.',
    ],
    faqTitle: 'Questions fréquentes',
    bookingTitle: 'Prendre rendez-vous',
    bookingLead: 'Choisissez un jour et une heure. La demande part par WhatsApp ou e-mail, déjà remplie.',
    contactTitle: 'Contacts',
  },

  faq: [
    {
      q: 'Qu’est-ce qu’un agent IA ?',
      a: 'Un programme qui comprend les demandes en langage naturel, consulte vos systèmes et exécute des tâches — répondre aux clients, lire des documents, mettre à jour le CRM — selon des règles définies avec vous.',
    },
    {
      q: 'Devons-nous changer les systèmes que nous utilisons ?',
      a: 'En général, non. Nous connectons l’agent à l’existant (e-mail, WhatsApp, ERP, CRM, tableurs) via des intégrations et des API.',
    },
    {
      q: 'Les données sont-elles sécurisées et conformes au RGPD ?',
      a: 'Oui. Nous ne traitons que les données nécessaires, avec des accès contrôlés et un journal des actions de l’agent. En rendez-vous, nous expliquons où les données sont hébergées pour chaque solution.',
    },
    {
      q: 'Combien cela coûte-t-il ?',
      a: 'Cela dépend du périmètre. Après l’échange initial et le diagnostic, nous présentons une proposition avec des phases et des prix fermes.',
    },
    {
      q: 'Combien de temps faut-il pour qu’un agent soit opérationnel ?',
      a: 'Cela dépend de la complexité et des intégrations. Nous commençons par un prototype sur un cas concret pour valider tôt ; le délai exact est fixé lors du diagnostic.',
    },
    {
      q: 'L’agent remplace-t-il des personnes ?',
      a: 'L’objectif est de libérer l’équipe du travail répétitif. Les décisions sensibles restent à une personne, que l’agent prépare et informe.',
    },
    {
      q: 'Travaillez-vous uniquement à Braga ?',
      a: 'Nous sommes à Braga, mais nous travaillons à distance avec des entreprises de tout le Portugal et d’Europe.',
    },
    {
      q: 'Le premier rendez-vous engage-t-il à quelque chose ?',
      a: 'Non. Ce sont 30 minutes pour comprendre votre cas et vous dire, en toute franchise, si et comment l’IA peut aider.',
    },
  ],

  magnet: {
    title: 'Checklist : 12 tâches qu’un agent IA peut reprendre dès maintenant',
    lead: 'Cochez celles qui existent dans votre entreprise. Si vous en cochez trois ou plus, un agent peut vous faire gagner du temps.',
    cta: 'Voir la checklist gratuite',
    print: 'Enregistrer en PDF / imprimer',
    back: "Retour à l'agent",
    footer: 'Vous voulez savoir par où commencer ? Réservez 30 minutes avec nous.',
    items: [
      'Répondre aux questions répétitives des clients (horaires, prix, disponibilités)',
      'Trier et transférer les e-mails à la bonne personne',
      'Fixer, confirmer et rappeler réunions ou rendez-vous',
      'Extraire les données des factures, reçus et contrats',
      'Saisir les documents dans l’ERP ou la comptabilité',
      'Qualifier les contacts issus du site ou des annonces',
      'Mettre à jour le CRM après chaque conversation',
      'Relancer les propositions restées sans réponse',
      'Regrouper les données de plusieurs tableurs dans un rapport hebdomadaire',
      'Détecter les écarts de ventes, de coûts ou de stock',
      'Prévoir les ruptures et préparer les commandes fournisseurs',
      'Répondre aux demandes internes d’information (RH, procédures)',
    ],
  },

  ai: {
    placeholder: 'Écrivez à l’agent…',
    send: 'Envoyer',
    mic: 'Parler à l’agent',
    micStop: 'Arrêter et envoyer',
    listening: 'Je vous écoute…',
    transcribing: 'Transcription…',
    speaking: 'Je parle…',
    mute: 'Couper la voix',
    unmute: 'Activer la voix',
    thinking: 'Réflexion…',
    consentTitle: 'Avant de discuter',
    consentText: 'Pour vous répondre, vos messages sont traités par un modèle d’IA ({provider}). Ne partagez pas de données sensibles. Détails dans la',
    consentLink: 'Politique de confidentialité',
    consentAccept: 'Accepter et continuer',
    consentDecline: 'Je préfère les options guidées',
    fallback: 'Pour l’instant, je continue avec les options guidées — choisissez-en une ci-dessous.',
    micDenied: 'Je n’ai pas pu accéder au micro. Vous pouvez écrire votre message.',
    caseLine: 'Cas : {summary}',
    live: 'IA en direct',
    company: 'Entreprise',
    systems: 'Systèmes',
    peopleUnit: 'personnes',
  },

  exit: {
    title: 'Avant de partir…',
    body: 'Emportez la checklist gratuite des 12 tâches qu’un agent IA peut reprendre dès maintenant. Sans inscription.',
    cta: 'Voir la checklist',
    alt: 'Réserver 30 minutes',
    close: 'Non, merci',
  },

  cookies: {
    text: 'Nous utilisons un stockage essentiel au fonctionnement du site. Avec votre accord, nous utilisons aussi le Meta Pixel pour mesurer nos campagnes. Vous pouvez changer d’avis à tout moment.',
    accept: 'Accepter',
    reject: 'Refuser',
    policy: 'Politique de cookies',
    manage: 'Préférences de cookies',
  },

  footer: {
    tagline: 'Agents IA et hyperautomatisation pour les entreprises. Braga, Portugal — depuis 2024.',
    contact: 'Contact',
    follow: 'Réseaux',
    legal: 'Mentions légales',
    languages: 'Langues',
    rights: 'Tous droits réservés.',
  },

  legal: {
    updated: 'Dernière mise à jour : 27 septembre 2026',
    privacy: {
      title: 'Politique de confidentialité',
      sections: [
        {
          h: '1. Responsable du traitement',
          p: ['DevloperEU (devloper.eu), Braga, Portugal. Contact : contato@devlopereu.com.'],
        },
        {
          h: '2. Données traitées',
          items: [
            'Les données que vous nous envoyez en demandant un rendez-vous : nom, entreprise, e-mail ou téléphone, jour et heure souhaités et notes.',
            'Vos réponses à l’agent du site (secteur, priorité, taille de l’équipe) — elles restent uniquement dans votre navigateur, sauf si vous les incluez dans la demande.',
            'Données de mesure des campagnes (Meta Pixel), uniquement si vous acceptez les cookies marketing.',
            'Messages écrits ou dictés à l’agent du site : après l’avis affiché dans le chat, ils sont envoyés au fournisseur d’IA configuré (p. ex. Google Gemini) uniquement pour générer la réponse ; nous ne les conservons pas sur le serveur. La voix est transcrite dans le navigateur ou, si nécessaire, par ce même fournisseur.',
          ],
        },
        {
          h: '3. Finalités et base légale',
          items: [
            'Répondre à votre demande et fixer le rendez-vous — mesures précontractuelles prises à votre demande.',
            'Mesure des campagnes — consentement, que vous pouvez retirer à tout moment.',
            'Respect des obligations légales, le cas échéant.',
          ],
        },
        {
          h: '4. Conservation',
          p: ['Les demandes de contact sont conservées le temps nécessaire à leur suivi et, au maximum, 24 mois sans nouvelle interaction.'],
        },
        {
          h: '5. Partage et transferts',
          p: [
            'Les demandes passent par le canal que vous choisissez (WhatsApp ou e-mail), soumis aux politiques de ces services. Avec votre consentement, Meta Platforms reçoit des données de navigation à des fins de mesure ; des transferts hors EEE peuvent avoir lieu sur la base de clauses contractuelles types.',
          ],
        },
        {
          h: '6. Vos droits',
          items: [
            'Accès, rectification et effacement de vos données.',
            'Limitation et opposition au traitement, et portabilité.',
            'Retrait du consentement à tout moment, sans affecter le traitement antérieur.',
            'Réclamation auprès de la CNPD (www.cnpd.pt).',
          ],
        },
      ],
    },
    cookies: {
      title: 'Politique de cookies',
      sections: [
        {
          h: '1. Ce que nous utilisons',
          items: [
            'Essentiels (stockage local) : mémorisent votre choix de cookies, la langue et le mode d’affichage. Aucun consentement requis.',
            'Marketing (Meta Pixel, id 998154455530660) : chargé uniquement après un clic sur « Accepter ». Mesure les visites et conversions des campagnes.',
          ],
        },
        {
          h: '2. Comment les gérer',
          p: [
            'Vous pouvez modifier votre choix à tout moment via le lien « Préférences de cookies » en pied de page, ou supprimer les données du site dans les réglages du navigateur.',
          ],
        },
        {
          h: '3. Durée',
          items: ['Votre choix est conservé jusqu’à ce que vous le modifiiez ou effaciez les données du navigateur.', 'Les cookies de Meta suivent les durées fixées par Meta (jusqu’à 90 jours).'],
        },
      ],
    },
    terms: {
      title: "Conditions d'utilisation",
      sections: [
        {
          h: '1. Acceptation',
          p: ['En utilisant devloper.eu, vous acceptez ces conditions. Si vous n’êtes pas d’accord, n’utilisez pas le site.'],
        },
        {
          h: '2. Le site',
          p: [
            'L’agent et les simulations présentés sont illustratifs et ne constituent pas une offre commerciale. Les résultats réels dépendent de chaque cas et sont évalués en rendez-vous.',
          ],
        },
        {
          h: '3. Propriété intellectuelle',
          p: ['La marque, le logo, les textes et le code du site appartiennent à DevloperEU et ne peuvent être réutilisés sans autorisation.'],
        },
        {
          h: '4. Responsabilité',
          p: ['Nous nous efforçons de maintenir des informations exactes et à jour, sans garantir l’absence d’erreurs ou d’interruptions.'],
        },
        {
          h: '5. Droit applicable',
          p: ['Ces conditions sont régies par le droit portugais. Le tribunal de la circonscription de Braga est compétent, sans préjudice des règles impératives de protection des consommateurs.'],
        },
      ],
    },
  },
};
