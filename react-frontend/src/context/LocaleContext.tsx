import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isLocale, Locale, LOCALE_STORAGE_KEY, translate, TranslationKey } from '@/i18n';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, variables?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

function getInitialLocale(): Locale {
  const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
  return isLocale(storedLocale) ? storedLocale : 'en';
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale,
    t: (key, variables) => translate(locale, key, variables),
  }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used inside LocaleProvider');
  return context;
}
