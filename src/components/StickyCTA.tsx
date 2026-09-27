import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react';
import { BookButton } from './ui';
import { whatsappUrl } from '../lib/booking';

/** CTA fixa: aparece depois do hero e esconde-se quando a secção de agendamento está visível. */
const StickyCTA: React.FC = () => {
  const { t } = useTranslation();
  const [pastHero, setPastHero] = useState(false);
  const [atBooking, setAtBooking] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setPastHero(window.scrollY > window.innerHeight * 0.6);
      const r = document.getElementById('agendar')?.getBoundingClientRect();
      setAtBooking(!!r && r.top < window.innerHeight * 0.8 && r.bottom > window.innerHeight * 0.2);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const show = pastHero && !atBooking;
  return (
    <div
      className={`fixed z-40 inset-x-0 bottom-0 sm:inset-x-auto sm:right-6 sm:bottom-6 transition-all duration-300 ${show ? 'translate-y-0 opacity-100' : 'translate-y-full sm:translate-y-8 opacity-0 pointer-events-none'}`}
      {...(show ? {} : ({ inert: '' } as Record<string, string>))}
    >
      <div className="flex gap-2 p-3 sm:p-2 bg-primary/95 backdrop-blur border-t border-gold/30 sm:border sm:rounded-full sm:shadow-[0_10px_40px_-10px_rgba(212,175,55,0.5)]">
        <BookButton label={t('v2.sticky.book')} className="flex-1 sm:flex-none" />
        <a
          href={whatsappUrl()}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={show ? 0 : -1}
          aria-label="WhatsApp"
          className="grid place-items-center min-h-[48px] min-w-[48px] rounded-full bg-[#25D366] text-primary hover:scale-105 transition-transform"
        >
          <MessageCircle size={22} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
};

export default StickyCTA;
