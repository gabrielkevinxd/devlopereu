import React from 'react';

// Marca em vetor: símbolo de rede neuronal (public/neural-network.svg) + wordmark em Anton.
const Logo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`inline-flex items-center gap-2 ${className}`}>
    <img src="/neural-network.svg" alt="" width={32} height={32} className="h-8 w-8" />
    <span className="font-anton text-xl sm:text-2xl tracking-wide bg-gradient-to-r from-[#F3D77A] via-gold to-[#B8901F] bg-clip-text text-transparent">
      DEVLOPER.EU
    </span>
  </span>
);

export default Logo;
