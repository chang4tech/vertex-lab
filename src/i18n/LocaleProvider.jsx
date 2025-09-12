import React, { createContext, useState, useContext, useCallback } from 'react';
import { IntlProvider } from 'react-intl';
import { LOCALES, getBrowserLocale } from './index';

const LocaleContext = createContext();

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(getBrowserLocale());

  const changeLocale = useCallback((newLocale) => {
    if (LOCALES[newLocale]) {
      setLocale(newLocale);
      localStorage.setItem('preferredLocale', newLocale);
    }
  }, []);

  const value = React.useMemo(() => ({
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

export const LocaleSelector = () => {
  const { locale, locales, changeLocale } = useLocale();
  
  return (
    <div style={{ padding: '8px 20px', cursor: 'pointer' }}>
      <select 
        value={locale}
        onChange={(e) => changeLocale(e.target.value)}
        style={{
          padding: '4px 8px',
          borderRadius: '4px',
          border: '1px solid #eee',
          fontSize: '14px',
          width: '100%'
        }}
      >
        {Object.entries(locales).map(([key, value]) => (
          <option key={key} value={key}>
            {value.name}
          </option>
        ))}
      </select>
    </div>
  );
};
