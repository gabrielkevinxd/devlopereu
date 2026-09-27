import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CalendarCheck } from 'lucide-react';
import { scrollToId } from '../lib/booking';

export const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children,
  delay = 0,
  className,
}) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

export const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="font-montserrat text-xs sm:text-sm font-bold uppercase tracking-[0.28em] text-gold mb-4">{children}</p>
);

export const SectionTitle: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <h2 id={id} className="font-anton uppercase leading-[1.02] text-3xl sm:text-5xl lg:text-6xl text-white max-w-4xl">
    {children}
  </h2>
);

/** Botão de agendamento: faz scroll suave para a secção #agendar. */
export const BookButton: React.FC<{
  variant?: 'solid' | 'ghost';
  label?: string;
  onBefore?: () => void;
  className?: string;
}> = ({ variant = 'solid', label, onBefore, className = '' }) => {
  const { t } = useTranslation();
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 min-h-[48px] font-montserrat font-bold text-base transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ';
  const styles =
    variant === 'solid'
      ? 'bg-gold text-primary hover:shadow-[0_0_32px_-4px_rgba(212,175,55,0.7)] hover:-translate-y-0.5'
      : 'border border-gold/60 text-gold hover:bg-gold/10';
  return (
    <a
      href="#agendar"
      onClick={(e) => {
        e.preventDefault();
        onBefore?.();
        scrollToId('agendar');
      }}
      className={`${base}${styles} ${className}`}
    >
      <CalendarCheck size={18} aria-hidden="true" />
      {label ?? t('v2.nav.book')}
    </a>
  );
};
