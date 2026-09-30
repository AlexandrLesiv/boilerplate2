import { createContext, useContext } from 'solid-js';

import { query, createAsync } from '@solidjs/router';

import en from './locales/en.json';

export type Translations = typeof en;
export { format } from './format';

/**
 * `lang` is this app's own locale code — the URL prefix (`/ua/news`), the translation filename,
 * the `LocaleSwitcher` label. `alias` is the standards-correct BCP 47 language tag, needed only
 * where a real language tag must be emitted (`hreflang`, `<html lang>`). They differ for
 * Ukrainian: `ua` is the ISO 3166-1 *country* code (Ukraine), not a language code, and is
 * rejected as an invalid/unexpected language tag by search engines and `<html lang>` consumers
 * (e.g. screen readers) — `uk` is the real one. One record per locale rather than a second
 * parallel map, since renaming `lang` itself everywhere is a much bigger, separate change.
 */
export const LOCALES = [
  { lang: 'en', alias: 'en' },
  { lang: 'ua', alias: 'uk' },
  { lang: 'ru', alias: 'ru' },
] as const;

export type Locale = (typeof LOCALES)[number]['lang'];
export const SUPPORTED_LOCALES: readonly Locale[] = LOCALES.map((entry) => entry.lang);
export const DEFAULT_LOCALE: Locale = 'en';

const BCP47_ALIAS: Record<Locale, string> = Object.fromEntries(
  LOCALES.map((entry) => [entry.lang, entry.alias])
) as Record<Locale, string>;

/** The real language tag for `<html lang>` — see `LOCALES`' `alias` field. */
export const bcp47Alias = (lang: Locale): string => BCP47_ALIAS[lang];

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
