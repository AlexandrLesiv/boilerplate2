import { createContext, useContext } from 'solid-js';

import { en } from './locales/en';
import type { Translations } from './locales/en';
import { ru } from './locales/ru';
import { ua } from './locales/ua';

export type { Translations };

export const SUPPORTED_LOCALES = ['en', 'ua', 'ru'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

const localeMap: Record<Locale, Translations> = { en, ua, ru };

export function createI18nStore(getLocale: () => Locale) {
  return {
    locale: getLocale,
    t: () => localeMap[getLocale()],
  };
}

export type I18nStore = ReturnType<typeof createI18nStore>;

export const I18nContext = createContext<I18nStore>();

export const useI18n = (): I18nStore => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nContext.Provider');
  return ctx;
};
