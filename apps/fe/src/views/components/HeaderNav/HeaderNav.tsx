import type { Component } from 'solid-js';

import { A, useParams } from '@solidjs/router';

import { useI18n } from '@/common/libs/i18n';

import { MobileNav } from '../MobileNav/MobileNav';
import * as styles from './styles.css';

/** Brand mark + primary nav, the left-hand group in `RootLayout`'s header. */
export const HeaderNav: Component = () => {
  const { t } = useI18n();
  const params = useParams<{ locale?: string }>();
  const pfx = () => (params.locale ? `/${params.locale}` : '');

  return (
    <div class={styles.headerLeft}>
      <strong class={styles.brand}>SolidJS App</strong>
      <MobileNav label={t().nav.menuLabel}>
        <A href={pfx() || '/'} end class={styles.navLink}>
          {t().nav.home}
        </A>
        <A href={`${pfx()}/news`} class={styles.navLink}>
          {t().nav.news}
        </A>
      </MobileNav>
    </div>
  );
};
