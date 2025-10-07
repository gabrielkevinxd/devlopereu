import React from 'react';
import { Mail, Phone, MapPin, Twitter, Instagram, Facebook, Github, Linkedin } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCookieConsent } from '../contexts/CookieContext';

const Footer: React.FC = () => {
  const { showCookieConsent, setShowCookieConsent } = useCookieConsent();
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const socialLinks = [
    { icon: Twitter, url: 'https://x.com/DevloperEU', label: 'Twitter' },
    { icon: Instagram, url: 'https://www.instagram.com/devlopereu/', label: 'Instagram' },
    { icon: Facebook, url: 'https://www.facebook.com/profile.php?id=61569296285202', label: 'Facebook' },
    { icon: Github, url: 'https://github.com/devloper-eu', label: 'GitHub' },
    { icon: Linkedin, url: 'https://www.linkedin.com/public-profile/settings?trk=d_flagship3_profile_self_view_public_profile', label: 'LinkedIn' },
  ];

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

  return (
    <footer className="bg-gray-dark text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Logo e Descrição */}
        <div className="flex flex-col items-center mb-8">
          <img 
            src="https://i.imgur.com/lwoK4d2.png" 
            alt="Devloper.eu Logo" 
            className="hidden lg:block absolute top-[-130px] h-50 w-auto cursor-pointer"
            onClick={scrollToHero}
          />
          <img 
            src="https://i.imgur.com/lwoK4d2.png" 
            alt="Devloper.eu Logo" 
            className="lg:hidden h-64 w-auto mb-4 cursor-pointer"
            onClick={scrollToHero}
          />
          <p className="text-center max-w-xl text-sm sm:text-base mb-4">
            {t('footer.description')}
          </p>
          <div className="flex justify-center space-x-4 mb-8">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-gold transition-colors"
                aria-label={link.label}
              >
                <link.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Links em 3 colunas no desktop, 1 coluna no mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Links Rápidos */}
          <div className="text-center md:text-right">
            <h3 className="text-xl font-anton text-white mb-3">{t('footer.quickLinks.title')}</h3>
            <ul className="space-y-2">
              <li><a href="#servicos" className="text-sm hover:text-gold transition-colors">{t('footer.quickLinks.services')}</a></li>
              <li><a href="#sobre" className="text-sm hover:text-gold transition-colors">{t('footer.quickLinks.about')}</a></li>
              <li><a href="#portfolio" className="text-sm hover:text-gold transition-colors">{t('footer.quickLinks.portfolio')}</a></li>
              <li><a href="#faq" className="text-sm hover:text-gold transition-colors">{t('footer.quickLinks.faq')}</a></li>
            </ul>
          </div>

          {/* Nossos Serviços */}
          <div className="text-center">
            <h3 className="text-xl font-anton text-white mb-3">{t('footer.ourServices.title')}</h3>
            <ul className="space-y-2">
              <li><a href="#ia-consultoria" className="text-sm hover:text-gold transition-colors">{t('footer.ourServices.aiConsulting')}</a></li>
              <li><a href="#automacao" className="text-sm hover:text-gold transition-colors">{t('footer.ourServices.automation')}</a></li>
              <li><a href="#machine-learning" className="text-sm hover:text-gold transition-colors">{t('footer.ourServices.machineLearning')}</a></li>
              <li><a href="#desenvolvimento" className="text-sm hover:text-gold transition-colors">{t('footer.ourServices.development')}</a></li>
            </ul>
          </div>

          {/* Contato */}
          <div className="text-center md:text-left">
            <h3 className="text-xl font-anton text-white mb-3">{t('footer.contact.title')}</h3>
            <ul className="space-y-2">
              <li className="flex items-center justify-center md:justify-start">
                <Mail className="h-5 w-5 text-gold mr-2" />
                <a href="mailto:contato@devlopereu.com" className="text-sm hover:text-gold transition-colors">
                  contato@devlopereu.com
                </a>
              </li>
              <li className="flex items-center justify-center md:justify-start">
                <Phone className="h-5 w-5 text-gold mr-2" />
                <a href="tel:+351929070650" className="text-sm hover:text-gold transition-colors">
                  +351 929 070 650
                </a>
              </li>
              <li className="flex items-center justify-center md:justify-start">
                <MapPin className="h-5 w-5 text-gold mr-2" />
                <span className="text-sm">Braga, Portugal</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright e Links */}
        <div className="border-t border-gray-medium pt-4">
          <div className="flex flex-col items-center space-y-2">
            <p className="text-xs text-center">
              {t('footer.copyright', { year: currentYear })}
            </p>
            <div>
              <ul className="flex justify-center space-x-4 text-xs">
                <li><Link to="/privacy-policy" className="hover:text-gold transition-colors">{t('footer.legal.privacy')}</Link></li>
                <li><Link to="/terms" className="hover:text-gold transition-colors">{t('footer.legal.terms')}</Link></li>
                <li><Link to="/cookie-policy" className="hover:text-gold transition-colors">{t('footer.legal.cookies')}</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Banner de Cookies */}
        {showCookieConsent && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-dark/95 backdrop-blur-sm z-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
              <div className="bg-gray-dark/80 rounded-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-anton text-white mb-3 sm:mb-4">{t('footer.cookieBanner.title')}</h2>
                <p className="text-sm sm:text-base mb-4 text-gray-light">
                  {t('footer.cookieBanner.description')}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="essential" checked disabled className="rounded border-gray-medium" />
                    <label htmlFor="essential" className="text-sm text-white">{t('footer.cookieBanner.categories.essential')}</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="preferences" className="rounded border-gray-medium" />
                    <label htmlFor="preferences" className="text-sm text-white">{t('footer.cookieBanner.categories.preferences')}</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="analytics" className="rounded border-gray-medium" />
                    <label htmlFor="analytics" className="text-sm text-white">{t('footer.cookieBanner.categories.analytics')}</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="marketing" className="rounded border-gray-medium" />
                    <label htmlFor="marketing" className="text-sm text-white">{t('footer.cookieBanner.categories.marketing')}</label>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  <button 
                    className="w-full sm:w-auto bg-gold text-primary hover:bg-transparent hover:text-gold border-2 border-gold transition-colors duration-300 rounded-md px-4 py-2 text-sm"
                    onClick={() => setShowCookieConsent(false)}
                  >
                    {t('footer.cookieBanner.buttons.acceptAll')}
                  </button>
                  <button 
                    className="w-full sm:w-auto bg-gray-medium text-white hover:bg-gray-light hover:text-primary border-2 border-gray-medium transition-colors duration-300 rounded-md px-4 py-2 text-sm"
                    onClick={() => setShowCookieConsent(false)}
                  >
                    {t('footer.cookieBanner.buttons.acceptSelected')}
                  </button>
                  <button 
                    className="w-full sm:w-auto bg-transparent text-white hover:bg-gray-light hover:text-primary border-2 border-gray-medium transition-colors duration-300 rounded-md px-4 py-2 text-sm"
                    onClick={() => setShowCookieConsent(false)}
                  >
                    {t('footer.cookieBanner.buttons.rejectAll')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
};

export default Footer; 