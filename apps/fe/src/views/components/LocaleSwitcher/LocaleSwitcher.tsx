import type { Component } from 'solid-js';
import { For } from 'solid-js';

import { A, useLocation, useParams } from '@solidjs/router';

import { useI18n, SUPPORTED_LOCALES, localePath, stripLocale } from '@/common/libs/i18n';
import type { Locale } from '@/common/libs/i18n';

import * as styles from './styles.css';

export const LocaleSwitcher: Component = () => {
  const params = useParams<{ locale?: string }>();
  const location = useLocation();
  const { locale } = useI18n();

  const makeLocaleUrl = (target: Locale): string => localePath(stripLocale(location.pathname, params.locale), target);

  return (
    <div class={styles.container}>
      <For each={SUPPORTED_LOCALES}>
        {(target) => (
          <A
            href={makeLocaleUrl(target)}
            class={[
              styles.localeLink,
              locale() === target ? styles.localeLinkVariants.active : styles.localeLinkVariants.inactive,
            ].join(' ')}
            aria-current={locale() === target ? 'true' : undefined}
          >
            {target.toUpperCase()}
          </A>
        )}
      </For>
    </div>
  );
};
