import { createContext, useContext } from 'solid-js';

import { query, createAsync } from '@solidjs/router';

import en from './locales/en.json';

export type Translations = typeof en;
export { format } from './format';

export const SUPPORTED_LOCALES = ['en', 'ua', 'ru'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

const localeLoaders: Record<Locale, () => Promise<Translations>> = {
  en: async () => en,
  ua: () => import('./locales/ua.json').then((m) => m.default as Translations),
  ru: () => import('./locales/ru.json').then((m) => m.default as Translations),
};

export const loadLocale = query((locale: Locale) => localeLoaders[locale](), 'i18n:locale');

export const localeFromParams = (params: { locale?: string }): Locale =>
  (params.locale as Locale | undefined) ?? DEFAULT_LOCALE;

/** Drops the locale prefix: (`/ua/news`, `ua`) → `/news`, (`/ua`, `ua`) → `/`. */
export const stripLocale = (pathname: string, locale: string | undefined): string =>
  locale ? pathname.slice(`/${locale}`.length) || '/' : pathname;

/** Adds the locale prefix, except for the default locale, which is served unprefixed. */
export const localePath = (path: string, locale: Locale): string =>
  locale === DEFAULT_LOCALE ? path : `/${locale}${path === '/' ? '' : path}`;

export const createI18nStore = (getLocale: () => Locale) => {
  const translations = createAsync(() => loadLocale(getLocale()), { initialValue: en });
  return {
    locale: getLocale,
    t: () => translations() ?? en,
  };
};

export type I18nStore = ReturnType<typeof createI18nStore>;

export const I18nContext = createContext<I18nStore>();

export const useI18n = (): I18nStore => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nContext.Provider');
  return ctx;
};
