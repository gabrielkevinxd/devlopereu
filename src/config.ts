// Configuração central de contacto, agendamento e captação de leads.
// Só contém dados que já existiam no projeto; o resto fica marcado como TODO.

export const SITE_URL = 'https://devloper.eu'; // origem: index.html (og:url)
export const WHATSAPP_NUMBER = '351929070650'; // origem: WhatsAppButton.tsx / Footer.tsx
export const WHATSAPP_DISPLAY = '+351 929 070 650';
export const EMAIL = 'contato@devlopereu.com'; // origem: Footer.tsx

// TODO(dono): URL do calendário (Cal.com, Calendly, Google Calendar…). Não existe no projeto.
// Enquanto estiver vazio, o pedido de reunião segue por WhatsApp/email.
export const CALENDAR_URL = '';

// TODO(dono): endpoint (Formspree, Web3Forms, função serverless…) para guardar leads da checklist.
// Enquanto estiver vazio, a checklist descarrega sem pedir email (não se recolhem dados).
export const LEAD_ENDPOINT = '';

// TODO(dono): confirmar horários reais de atendimento. Placeholder de slots (hora de Lisboa).
export const MEETING_SLOTS = ['10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
export const MEETING_DAYS_AHEAD = 10; // dias úteis oferecidos

export const SOCIALS = [
  { key: 'Instagram', url: 'https://www.instagram.com/devlopereu/' },
  { key: 'X', url: 'https://x.com/DevloperEU' },
  { key: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61569296285202' },
  { key: 'GitHub', url: 'https://github.com/devloper-eu' },
];
// LinkedIn omitido: o URL existente é uma página de definições, não um perfil público.

export const SERVICE_KEYS = [
  'ia_consultoria',
  'automacao',
  'machine_learning',
  'big_data',
  'desenvolvimento',
  'analytics',
] as const;
