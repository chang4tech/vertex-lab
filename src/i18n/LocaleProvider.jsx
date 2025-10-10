import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';
import { IntlProvider } from 'react-intl';
import { LOCALES, getInitialLocale } from './index';

const LocaleContext = createContext();

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(() => getInitialLocale());

  const changeLocale = useCallback((newLocale) => {
    if (LOCALES[newLocale]) {
      setLocale(newLocale);
      try {
        if (typeof window !== 'undefined') {
          window.localStorage?.setItem('preferredLocale', newLocale);
        }
      } catch (error) {
        console.warn('[i18n] failed to persist locale', error);
      }
    }
  }, []);

  const value = useMemo(() => ({
    locale,
    locales: LOCALES,
    changeLocale,
  }), [locale, changeLocale]);

  return (
    <LocaleContext.Provider value={value}>
      <IntlProvider
        messages={LOCALES[locale].messages}
        locale={locale}
        defaultLocale="en-US"
      >
        {children}
      </IntlProvider>
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

export function useLocaleOptions() {
  const { locale, changeLocale } = useLocale();
  return useMemo(() => ({
    locale,
    changeLocale,
    options: Object.entries(LOCALES).map(([value, config]) => ({
      value,
      label: config.name,
    })),
  }), [locale, changeLocale]);
}
