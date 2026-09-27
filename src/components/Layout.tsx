import React from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from './Navbar';
import Footer from './Footer';
import StickyCTA from './StickyCTA';
import ExitIntent from './ExitIntent';
import ScrollSpine from './ScrollSpine';
import SeoHead from './SeoHead';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  return (
    <div className="relative min-h-screen flex flex-col bg-primary">
      <SeoHead />
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded focus:bg-gold focus:px-4 focus:py-2 focus:text-primary">
        {t('v2.skip')}
      </a>
      <div className="fixed inset-0 grid-bg pointer-events-none" aria-hidden="true" />
      <ScrollSpine />
      <div className="relative z-10 flex flex-col flex-grow">
        <Navbar />
        <main id="conteudo" className="flex-grow">
          {children}
        </main>
        <Footer />
        <StickyCTA />
        <ExitIntent />
      </div>
    </div>
  );
};

export default Layout;
