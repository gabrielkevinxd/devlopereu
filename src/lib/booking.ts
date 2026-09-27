import { useSyncExternalStore } from 'react';
import {
  EMAIL,
  LEAD_ENDPOINT,
  MEETING_DAYS_AHEAD,
  WHATSAPP_NUMBER,
} from '../config';

/* ---------- Resultado do diagnóstico (partilhado entre secções) ---------- */
export type DiagnosticResult = {
  areas: string[]; // rótulos já traduzidos dos módulos
  systems: string;
  urgency: string;
  tier: string;
};

let diagnostic: DiagnosticResult | null = null;
const listeners = new Set<() => void>();
export const diagnosticStore = {
  get: () => diagnostic,
  set: (d: DiagnosticResult | null) => {
    diagnostic = d;
    listeners.forEach((l) => l());
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};
export const useDiagnostic = () =>
  useSyncExternalStore(diagnosticStore.subscribe, diagnosticStore.get, () => null);

/* ---------- Dias úteis ---------- */
export function nextBusinessDays(n = MEETING_DAYS_AHEAD): Date[] {
  const out: Date[] = [];
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  while (out.length < n) {
    d.setDate(d.getDate() + 1);
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) out.push(new Date(d));
  }
  return out;
}
export const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/* ---------- Mensagem do pedido de reunião ---------- */
export type BookingData = {
  name: string;
  email: string;
  phone: string;
  company: string;
  topic: string;
  dayLabel: string;
  time: string;
};

export function buildMessage(b: BookingData, diag: DiagnosticResult | null): string {
  const lines = [
    'Pedido de reunião — DevloperEU',
    `Data pretendida: ${b.dayLabel} às ${b.time} (Lisboa)`,
    `Nome: ${b.name}`,
    `Email: ${b.email}`,
    b.phone && `Telemóvel: ${b.phone}`,
    b.company && `Empresa: ${b.company}`,
    b.topic && `Assunto: ${b.topic}`,
    diag &&
      `Diagnóstico: ${diag.areas.join(', ')} | Sistemas: ${diag.systems} | Prioridade: ${diag.urgency} | Âmbito: ${diag.tier}`,
  ].filter(Boolean);
  return lines.join('\n');
}

export const whatsappUrl = (text?: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
export const mailUrl = (subject: string, body: string) =>
  `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

/* ---------- Lead (checklist) ---------- */
export async function submitLead(email: string): Promise<boolean> {
  if (!LEAD_ENDPOINT) return false;
  try {
    const r = await fetch(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, source: 'checklist-automacao' }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
