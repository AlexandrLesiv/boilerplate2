import type { Component } from 'solid-js';

import { A, useLocation, useParams } from '@solidjs/router';

import { useI18n, SUPPORTED_LOCALES, DEFAULT_LOCALE } from '../../../common/libs/i18n';
import type { Locale } from '../../../common/libs/i18n';
import { container, localeLink, localeLinkVariants } from './styles.css';

export const LocaleSwitcher: Component = () => {
  const params = useParams<{ locale?: string }>();
  const location = useLocation();
  const { locale } = useI18n();

  const makeLocaleUrl = (target: Locale): string => {
    const currentLocale = params.locale as Locale | undefined;
    const basePath = currentLocale ? location.pathname.slice(`/${currentLocale}`.length) || '/' : location.pathname;
    if (target === DEFAULT_LOCALE) return basePath;
    return `/${target}${basePath === '/' ? '' : basePath}`;
  };

  return (
    <div class={container}>
      {SUPPORTED_LOCALES.map((target) => (
        <A
          href={makeLocaleUrl(target)}
          class={[localeLink, locale() === target ? localeLinkVariants.active : localeLinkVariants.inactive].join(' ')}
          aria-current={locale() === target ? 'true' : undefined}
        >
          {target.toUpperCase()}
        </A>
      ))}
    </div>
  );
};
