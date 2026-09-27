import { META_PIXEL_ID } from '../../config';

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...a: unknown[]) => void;
  queue: unknown[];
  loaded: boolean;
  version: string;
  push: unknown;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

/** Carrega o Meta Pixel. Chamar APENAS depois de consentimento de marketing. */
export function loadPixel(): void {
  if (typeof window === 'undefined' || window.fbq) return;
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Fbq;
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.push = fbq;
  window.fbq = fbq;
  window._fbq = fbq;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  fbq('init', META_PIXEL_ID);
  fbq('track', 'PageView');
}

/** Regista um evento só se o Pixel já estiver carregado (i.e. houve consentimento). */
export function track(event: 'Lead' | 'Schedule' | 'Contact', data?: Record<string, string>): void {
  window.fbq?.('track', event, data);
}
