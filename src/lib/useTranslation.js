"use client";

import { useState, useEffect, createContext, useContext } from 'react';

// Create a context for language
const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState('en');

  // Load saved language from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem('preferred-language');
    if (savedLocale && ['en', 'hi'].includes(savedLocale)) {
      setLocale(savedLocale);
    }
  }, []);

  // Save language to localStorage when it changes
  const changeLocale = (newLocale) => {
    setLocale(newLocale);
    localStorage.setItem('preferred-language', newLocale);
  };

  return (
    <LanguageContext.Provider value={{ locale, changeLocale }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (namespace = 'common') => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }

  const { locale, changeLocale } = context;
  const [translations, setTranslations] = useState({});

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const translationModule = await import(`../locales/${locale}/${namespace}.json`);
        setTranslations(translationModule.default);
      } catch (error) {
        console.warn(`Could not load translations for ${locale}/${namespace}`, error);
        // Fallback to English
        try {
          const fallbackModule = await import(`../locales/en/${namespace}.json`);
          setTranslations(fallbackModule.default);
        } catch (fallbackError) {
          console.error('Could not load fallback translations', fallbackError);
        }
      }
    };

    loadTranslations();
  }, [locale, namespace]);

  const t = (key) => {
    return key.split('.').reduce((obj, k) => obj?.[k], translations) || key;
  };

  return { t, locale, changeLocale };
};
