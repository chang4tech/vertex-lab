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

// Get browser locale or system locale
export function getBrowserLocale() {
  const browserLocale = navigator.language;
  return LOCALES[browserLocale] ? browserLocale : 'en-US';
}

// Create intl instance with messages
export function createI18n(locale = getBrowserLocale()) {
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
