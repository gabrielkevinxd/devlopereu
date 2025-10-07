import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    fbq: any;
  }
}

const MetaPixel = () => {
  const location = useLocation();

  useEffect(() => {
    // Inicialização do Pixel
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    
    // Inicialização do seu Pixel ID
    window.fbq('init', '998154455530660');
    
    // Primeiro PageView
    window.fbq('track', 'PageView');
  }, []);

  // Rastrear PageView em mudanças de rota
  useEffect(() => {
    window.fbq('track', 'PageView');
  }, [location]);

  return null;
};

export default MetaPixel; 