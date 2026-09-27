import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import Logo from './Logo';
import { BookButton } from './ui';

const LINKS = [
  ['servicos', 'services'],
  ['diagnostico', 'diagnostic'],
  ['metodo', 'process'],
  ['sobre', 'about'],
  ['faq', 'faq'],
] as const;

const Navbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8);
    h();
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const go = (id: string) => {
    setOpen(false);
    const doScroll = () =>
      id === 'inicio' ? window.scrollTo({ top: 0, behavior: 'smooth' }) : document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(doScroll, 150);
    } else doScroll();
  };

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${scrolled || open ? 'bg-primary/95 backdrop-blur border-b border-white/10' : 'bg-transparent'}`}>
      <nav aria-label="Principal" className="max-w-7xl mx-auto px-4 sm:px-8 h-[72px] flex items-center justify-between">
        <a href="/" onClick={(e) => { e.preventDefault(); go('inicio'); }} aria-label={t('v2.nav.home')} className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold rounded">
          <Logo />
        </a>
        <ul className="hidden lg:flex items-center gap-7">
          {LINKS.map(([id, k]) => (
            <li key={id}>
              <a href={`#${id}`} onClick={(e) => { e.preventDefault(); go(id); }} className="text-white/90 hover:text-gold transition-colors py-2">{t(`v2.nav.${k}`)}</a>
            </li>
          ))}
        </ul>
        <div className="hidden lg:flex items-center gap-4">
          <LanguageSelector />
          <BookButton />
        </div>
        <button type="button" className="lg:hidden grid place-items-center h-12 w-12 text-white hover:text-gold" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? t('v2.nav.close') : t('v2.nav.menu')} onClick={() => setOpen(!open)}>
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>
      {open && (
        <div id="mobile-menu" className="lg:hidden bg-primary border-t border-white/10 px-4 pb-6">
          <ul>
            {LINKS.map(([id, k]) => (
              <li key={id}>
                <a href={`#${id}`} onClick={(e) => { e.preventDefault(); go(id); }} className="block py-4 min-h-[48px] text-lg border-b border-white/10">{t(`v2.nav.${k}`)}</a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between gap-4">
            <LanguageSelector />
            <BookButton onBefore={() => setOpen(false)} />
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
