import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { Reveal } from './ui';
import { BookButton } from './ui';
import { LEAD_ENDPOINT, SITE_URL } from '../config';
import { downloadText, submitLead } from '../lib/booking';

export function useChecklist() {
  const { t } = useTranslation();
  return () => {
    const items = t('v2.lead.items', { returnObjects: true }) as string[];
    const body = [
      t('v2.lead.docTitle'),
      '='.repeat(48),
      '',
      t('v2.lead.docIntro'),
      '',
      ...items.map((it, i) => `[ ] ${String(i + 1).padStart(2, '0')}. ${it}`),
      '',
      t('v2.lead.docOutro', { url: `${SITE_URL}/#agendar` }),
    ].join('\n');
    downloadText(t('v2.lead.file'), body);
  };
}

const LeadMagnet: React.FC = () => {
  const { t } = useTranslation();
  const download = useChecklist();
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (LEAD_ENDPOINT) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr(t('v2.lead.errEmail'));
      if (!consent) return setErr(t('v2.lead.errConsent'));
      await submitLead(email);
    }
    setErr('');
    download();
    setDone(true);
  };

  return (
    <section aria-labelledby="h-lead" className="section">
      <Reveal className="max-w-5xl mx-auto">
        <div className="rounded-3xl border border-gold/30 bg-gradient-to-br from-gold/10 via-black/40 to-transparent p-6 sm:p-12 grid gap-8 md:grid-cols-[1.2fr_1fr] items-center">
          <div>
            <h2 id="h-lead" className="font-anton uppercase text-3xl sm:text-4xl leading-tight">{t('v2.lead.title')}</h2>
            <p className="mt-4 text-gray-light text-lg">{t('v2.lead.text')}</p>
          </div>
          <form onSubmit={submit} noValidate className="space-y-3">
            {LEAD_ENDPOINT && (
              <>
                <label htmlFor="lead-email" className="block font-bold">{t('v2.lead.email')}</label>
                <input id="lead-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg bg-primary border border-white/25 px-4 py-3 min-h-[48px] focus:outline focus:outline-2 focus:outline-gold" />
                <label className="flex gap-3 items-start text-sm text-gray-light cursor-pointer">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-5 w-5 accent-[#D4AF37]" />
                  <span>{t('v2.lead.consent')} <Link to="/privacy-policy" className="text-gold underline">{t('v2.book.privacy')}</Link></span>
                </label>
              </>
            )}
            <p role="alert" className="text-red-300 min-h-[1.25rem]">{err}</p>
            <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 min-h-[48px] font-bold text-primary">
              <Download size={18} aria-hidden="true" /> {t('v2.lead.cta')}
            </button>
            {done && (
              <div role="status" className="pt-2">
                <p className="text-gray-light mb-3">{t('v2.lead.thanks')}</p>
                <BookButton variant="ghost" />
              </div>
            )}
          </form>
        </div>
      </Reveal>
    </section>
  );
};

export default LeadMagnet;
