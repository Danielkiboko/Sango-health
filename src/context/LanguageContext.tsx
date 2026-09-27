import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, LANGUAGES, translations } from '../lib/i18n';

type TranslationKey = keyof typeof translations['fr'];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sango_language') as Language;
      if (saved && ['fr', 'en', 'ln', 'sw', 'kg', 'ts'].includes(saved)) {
        return saved;
      }
    }
    return 'fr';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sango_language', lang);
    }
  };

  const t = (key: TranslationKey): string => {
    const langDict = translations[language] || translations['fr'];
    return (langDict as any)[key] || (translations['fr'] as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
