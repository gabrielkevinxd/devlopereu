import React, { createContext, useContext, useState, useCallback } from 'react';

interface CookieContextType {
  showCookieConsent: boolean;
  setShowCookieConsent: (show: boolean) => void;
  toggleCookieConsent: () => void;
}

const CookieContext = createContext<CookieContextType | undefined>(undefined);

export const CookieProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showCookieConsent, setShowCookieConsent] = useState(true);

  const toggleCookieConsent = useCallback(() => {
    setShowCookieConsent(prev => !prev);
  }, []);

  return (
    <CookieContext.Provider value={{ showCookieConsent, setShowCookieConsent, toggleCookieConsent }}>
      {children}
    </CookieContext.Provider>
  );
};

export const useCookieConsent = () => {
  const context = useContext(CookieContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieProvider');
  }
  return context;
}; 