import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToHero = () => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsOpen(false);
  };

  const openWhatsApp = () => {
    window.open('https://wa.me/351929070650', '_blank');
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-primary shadow-lg' : 'bg-black/50 backdrop-blur-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="https://i.imgur.com/VDqPzzx.png" 
              alt="Devloper.eu" 
              className="h-64 sm:h-16 md:h-80 cursor-pointer transition-all duration-300 object-contain"
              onClick={scrollToHero}
              width={320}
              height={80}
              loading="eager"
              fetchpriority="high"
              decoding="async"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => scrollToSection('inicio')} className="nav-link">
              {t('nav.inicio')}
            </button>
            <button onClick={() => scrollToSection('servicos')} className="nav-link">
              {t('nav.servicos')}
            </button>
            <button onClick={() => scrollToSection('portfolio')} className="nav-link">
              {t('nav.portfolio')}
            </button>
            <button onClick={() => scrollToSection('sobre')} className="nav-link">
              {t('nav.sobre')}
            </button>
            <button onClick={() => scrollToSection('faq')} className="nav-link">
              {t('nav.faq')}
            </button>
            <LanguageSelector />
            <button 
              onClick={openWhatsApp} 
              className="bg-gold text-primary px-6 py-2 rounded-md hover:bg-transparent hover:text-gold border-2 border-gold transition-colors"
            >
              {t('nav.contato')}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-gold transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-primary shadow-lg">
          <div className="px-4 py-4 space-y-3">
            <button
              onClick={() => scrollToSection('inicio')}
              className="block w-full text-left px-4 py-2 text-white hover:text-gold transition-colors rounded-md hover:bg-black/20"
            >
              {t('nav.inicio')}
            </button>
            <button
              onClick={() => scrollToSection('servicos')}
              className="block w-full text-left px-4 py-2 text-white hover:text-gold transition-colors rounded-md hover:bg-black/20"
            >
              {t('nav.servicos')}
            </button>
            <button
              onClick={() => scrollToSection('portfolio')}
              className="block w-full text-left px-4 py-2 text-white hover:text-gold transition-colors rounded-md hover:bg-black/20"
            >
              {t('nav.portfolio')}
            </button>
            <button
              onClick={() => scrollToSection('sobre')}
              className="block w-full text-left px-4 py-2 text-white hover:text-gold transition-colors rounded-md hover:bg-black/20"
            >
              {t('nav.sobre')}
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="block w-full text-left px-4 py-2 text-white hover:text-gold transition-colors rounded-md hover:bg-black/20"
            >
              {t('nav.faq')}
            </button>
            <div className="px-4 py-2">
              <LanguageSelector />
            </div>
            <button 
              onClick={openWhatsApp} 
              className="block w-full px-4 py-2 bg-gold text-primary hover:bg-transparent hover:text-gold border-2 border-gold transition-colors rounded-md"
            >
              {t('nav.contato')}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
