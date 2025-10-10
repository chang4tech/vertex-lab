import { LOCALES, getInitialLocale } from './index';

export function t(id, defaultMessage) {
  try {
    const locale = getInitialLocale();
    const messages = LOCALES[locale]?.messages ?? {};
    return messages[id] ?? defaultMessage;
  } catch (error) {
    console.warn('[i18n] translate fallback', id, error);
    return defaultMessage;
  }
}
