import React from 'react';
import Hero from '../components/Hero';
import Services from '../components/Services';
import { Advantages } from '../components/Advantages';
import { FAQ } from '../components/FAQ';
import AboutSection from '../components/AboutSection';

const HomePage: React.FC = () => {
  return (
    <>
      <section id="inicio">
        <Hero />
      </section>
      
      <section id="servicos">
        <Services />
      </section>
      
      <section id="portfolio">
        <Advantages />
      </section>
      
      <section id="sobre">
        <AboutSection />
      </section>
      
      <section id="faq" className="section">
        <FAQ />
      </section>
    </>
  );
};

export default HomePage; 