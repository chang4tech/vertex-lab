import { createIntl, createIntlCache } from 'react-intl';
import enUS from './locales/en-US';
import zhCN from './locales/zh-CN';

export const LOCALES = {
  'en-US': {
    name: 'English',
    messages: enUS,
  },
  'zh-CN': {
    name: '中文',
    messages: zhCN,
  },
};

// Create the cache for better performance
const cache = createIntlCache();

function getStoredLocale() {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage?.getItem('preferredLocale');
    if (stored && LOCALES[stored]) {
      return stored;
    }
  } catch (error) {
    console.warn('[i18n] failed to read stored locale', error);
  }
  return null;
}

// Get browser locale or system locale
export function getBrowserLocale() {
  if (typeof navigator !== 'undefined') {
    const browserLocale = navigator.language;
    if (browserLocale && LOCALES[browserLocale]) {
      return browserLocale;
    }
    const baseLocale = browserLocale?.split?.('-')?.[0];
    if (baseLocale) {
      const match = Object.keys(LOCALES).find((key) => key.startsWith(baseLocale));
      if (match) return match;
    }
  }
  return 'en-US';
}

export function getInitialLocale() {
  return getStoredLocale() ?? getBrowserLocale();
}

// Create intl instance with messages
export function createI18n(locale = getInitialLocale()) {
  return createIntl(
    {
      locale,
      messages: LOCALES[locale].messages,
    },
    cache
  );
}

// Export a default instance
export const defaultI18n = createI18n();
