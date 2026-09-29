/** Configuração central do site. Alterar aqui, nunca espalhado pelos componentes. */

export const SITE_URL = 'https://devlopereu.com';

/**
 * URL de agendamento (Calendly embutido no site).
 * Vazio → o fluxo de agendamento usa WhatsApp/email com o pedido pré-preenchido.
 */
export const CALENDAR_URL = 'https://calendly.com/devlopereu/30min';

export const CONTACT = {
  phoneDisplay: '+351 929 070 650',
  phoneE164: '+351929070650',
  whatsapp: '351929070650',
  email: 'devlopereu@gmail.com',
  city: 'Braga',
  country: 'PT',
  foundingYear: 2024,
} as const;

export const SOCIAL = {
  instagram: 'https://www.instagram.com/devlopereu',
  x: 'https://x.com/DevloperEU',
  facebook: 'https://www.facebook.com/profile.php?id=61569296285202',
  github: 'https://github.com/devloper-eu',
} as const;

/** Meta Pixel — só é carregado depois de consentimento explícito (ver consent/pixel.ts). */
export const META_PIXEL_ID = '998154455530660';

/**
 * TODO(dono): casos reais (com autorização do cliente). Vazio → nada é mostrado.
 * NÃO inventar clientes, números ou testemunhos.
 */
export const CASE_STUDIES: ReadonlyArray<{ client: string; result: string; url?: string }> = [];
