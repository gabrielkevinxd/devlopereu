import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const AboutSection = () => {
  const { t } = useTranslation();

  return (
    <section id="about" className="section bg-primary relative overflow-hidden">
      <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Conteúdo de texto */}
          <div className="space-y-4 order-2 lg:order-1">
            <h2 className="text-2xl sm:text-3xl font-anton text-gold mb-4 sm:mb-6 text-center lg:text-left">
              {t('about.title')}
            </h2>
            {t('about.paragraphs', { returnObjects: true, foundingYear: 2024 }).map((paragraph, index) => (
              <p key={index} className="text-base sm:text-lg text-white/90 leading-relaxed text-center lg:text-left">
                {paragraph}
              </p>
            ))}
            
            <div className="pt-6">
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 sm:gap-8">
                <div className="text-center">
                  <span className="block text-2xl sm:text-3xl font-bold text-amber-400">
                    {t('about.stats.projects.value')}
                  </span>
                  <span className="text-sm sm:text-base text-white/90">
                    {t('about.stats.projects.label')}
                  </span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl sm:text-3xl font-bold text-amber-400">
                    {t('about.stats.satisfaction.value')}
                  </span>
                  <span className="text-sm sm:text-base text-white/90">
                    {t('about.stats.satisfaction.label')}
                  </span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl sm:text-3xl font-bold text-amber-400">
                    {t('about.stats.support.value')}
                  </span>
                  <span className="text-sm sm:text-base text-white/90">
                    {t('about.stats.support.label')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Vídeo (lazy-load quando visível) */}
          <VideoContainer />
        </div>
      </div>
    </section>
  );
};

export default AboutSection; 

// Componente separado para lidar com o carregamento e reprodução do vídeo
const VideoContainer = () => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const onError = (e) => {
      // Evita logs silenciosos; ajuda depuração caso falhe
      console.error('Erro ao carregar vídeo /videos/DevloperEU.mp4', e);
    };

    video.addEventListener('error', onError);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!video.src) {
              video.src = '/videos/DevloperEU.mp4';
              video.load();
            }
            // Tenta reproduzir; se bloquear, ignora erro
            video
              .play()
              .catch(() => {
                /* autoplay pode falhar em alguns navegadores */
              });
          } else {
            // Pausa e libera o recurso fora de viewport para evitar aborts
            video.pause();
            video.removeAttribute('src');
            video.load();
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      video.removeEventListener('error', onError);
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-0 pb-[56.25%] rounded-lg overflow-hidden shadow-xl order-1 lg:order-2"
    >
      <video
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full object-cover rounded-lg"
        muted
        loop
        playsInline
        preload="none"
        poster="/neural-network.svg"
      >
        {/* Fallback para navegadores sem suporte */}
        Seu navegador não suporta o elemento de vídeo.
      </video>
    </div>
  );
};