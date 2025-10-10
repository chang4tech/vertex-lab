import { describe, it, expect } from 'vitest';
import enUS from '../../i18n/locales/en-US';
import zhCN from '../../i18n/locales/zh-CN';
import esES from '../../i18n/locales/es-ES';

const locales = {
  'zh-CN': zhCN,
  'es-ES': esES,
};

describe('i18n locale coverage', () => {
  const englishKeys = Object.keys(enUS).sort();

  Object.entries(locales).forEach(([localeId, messages]) => {
    it(`${localeId} includes all English keys`, () => {
      const localeKeys = Object.keys(messages).sort();
      expect(localeKeys).toEqual(englishKeys);
    });
  });
});
