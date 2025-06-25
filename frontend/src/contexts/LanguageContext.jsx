import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTranslation } from '../i18n/locales';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get saved language from localStorage or default to 'en'
    return localStorage.getItem('emi_language') || 'en';
  });

  // Save language to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('emi_language', language);
  }, [language]);

  const t = (key) => getTranslation(key, language);

  const changeLanguage = (newLanguage) => {
    if (newLanguage === 'en' || newLanguage === 'ru') {
      setLanguage(newLanguage);
    }
  };

  const value = {
    language,
    changeLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};