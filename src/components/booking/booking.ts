import { CONTACT } from '../../config';
import { fill, LANG_TAGS, type Dict, type Lang } from '../../i18n';

export const TIMES = ['09:30', '10:30', '11:30', '14:00', '15:00', '16:00', '17:00'] as const;

/** Próximos N dias úteis a partir de amanhã (fim de semana excluído). */
export function nextWorkdays(n = 10, from = new Date()): Date[] {
  const out: Date[] = [];
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  while (out.length < n) {
    d.setDate(d.getDate() + 1);
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) out.push(new Date(d));
  }
  return out;
}

export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function formatDay(d: Date, lang: Lang, style: 'short' | 'long' = 'long'): string {
  return new Intl.DateTimeFormat(LANG_TAGS[lang], {
    weekday: style === 'long' ? 'long' : 'short',
    day: 'numeric',
    month: style === 'long' ? 'long' : 'short',
  }).format(d);
}

export interface CaseSummary {
  sector: string;
  pain: string;
  people: number;
  hours: number;
}

export interface BookingData {
  day: string; // já formatado
  time: string;
  name: string;
  company: string;
  contact: string;
  notes: string;
  caseSummary?: CaseSummary;
  /** resumo livre do caso (conversa com o LLM) */
  caseText?: string;
}

export function composeMessage(t: Dict, b: BookingData): string {
  const m = t.booking.message;
  const lines = [m.greeting, '', fill(m.when, { day: b.day, time: b.time }), fill(m.name, { name: b.name.trim() })];
  if (b.company.trim()) lines.push(fill(m.company, { company: b.company.trim() }));
  lines.push(fill(m.contact, { contact: b.contact.trim() }));
  if (b.caseSummary) lines.push(fill(m.case, { ...b.caseSummary }));
  else if (b.caseText) lines.push(fill(t.ai.caseLine, { summary: b.caseText }));
  if (b.notes.trim()) lines.push(fill(m.notes, { notes: b.notes.trim() }));
  return lines.join('\n');
}

export const whatsappUrl = (text: string) => `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;

export const mailtoUrl = (subject: string, body: string) =>
  `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

export const isValidContact = (v: string) => {
  const s = v.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) || s.replace(/[^\d]/g, '').length >= 9;
};
