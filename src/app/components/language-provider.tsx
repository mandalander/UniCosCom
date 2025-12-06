'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { translations } from '@/lib/translations';

type Language = 'pl' | 'en';

// Add a type for the interpolation values
type TranslationVariables = { [key: string]: string | number };

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: import('@/lib/translations').TranslationKeys, vars?: TranslationVariables) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('pl');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLanguage = localStorage.getItem('language') as Language;
      if (storedLanguage && (storedLanguage === 'pl' || storedLanguage === 'en')) {
        setLanguageState(storedLanguage);
      }
    }
    setIsMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
    setLanguageState(lang);
  };

  const t = useMemo(() => (key: import('@/lib/translations').TranslationKeys, vars?: TranslationVariables): string => {
    const lang = translations[language];
    let translation = (lang[key as keyof typeof lang] as string) || key;

    if (vars) {
      Object.keys(vars).forEach(varKey => {
        const regex = new RegExp(`{{${varKey}}}`, 'g');
        translation = translation.replace(regex, String(vars[varKey]));
      });
    }

    return translation;
  }, [language]);


  if (!isMounted) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
