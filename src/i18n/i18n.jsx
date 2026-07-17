// i18n/i18n.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import en from './locales/en';
import tl from './locales/tl';
import zhTW from './locales/zh-TW';
import zhCN from './locales/zh-CN';
import th from './locales/th';
import vi from './locales/vi';

const locales = {
  en,
  tl,
  'zh-TW': zhTW,
  'zh-CN': zhCN,
  th,
  vi,
};

const I18nContext = createContext({
  locale: 'en',
  setLocale: () => {},
  t: () => '',
});

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState('en');

  useEffect(() => {
    // Load saved locale from localStorage
    const saved = localStorage.getItem('fleshlab_locale');
    if (saved && locales[saved]) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale) => {
    if (locales[newLocale]) {
      setLocaleState(newLocale);
      localStorage.setItem('fleshlab_locale', newLocale);
    }
  };

  const t = (key) => {
    const keys = key.split('.');
    let value = locales[locale];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English
        value = locales.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if not found in English either
          }
        }
        return value;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

// Helper to get current locale translations
export function getTranslations(locale) {
  return locales[locale] || locales.en;
}