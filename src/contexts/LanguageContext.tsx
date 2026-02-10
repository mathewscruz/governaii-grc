import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { pt } from '@/i18n/pt';
import { en } from '@/i18n/en';

type Locale = 'pt' | 'en';
type Dictionary = Record<string, any>;

const dictionaries: Record<Locale, Dictionary> = { pt, en };

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('governaii-locale');
    return (saved === 'en' ? 'en' : 'pt') as Locale;
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('governaii-locale', newLocale);
  }, []);

  const t = useCallback((key: string): string => {
    const dict = dictionaries[locale];
    const keys = key.split('.');
    let result: any = dict;
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) return key;
    }
    return typeof result === 'string' ? result : key;
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
