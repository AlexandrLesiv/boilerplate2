import type { Component, ParentProps } from 'solid-js';
import { For, Show, Suspense, createEffect } from 'solid-js';

import { Link, Meta } from '@solidjs/meta';
import { useLocation, useParams } from '@solidjs/router';

import { absoluteUrl } from '@/common/constants/environment';
import { ConfigContext, createConfigStore } from '@/common/libs/config';
import {
  LOCALES,
  I18nContext,
  bcp47Alias,
  createI18nStore,
  localeFromParams,
  localePath,
  stripLocale,
} from '@/common/libs/i18n';
import type { Locale } from '@/common/libs/i18n';

import { HeaderNav } from '../components/HeaderNav/HeaderNav';
import { LocaleSwitcher } from '../components/LocaleSwitcher/LocaleSwitcher';
import { SkipLinks } from '../components/SkipLinks/SkipLinks';
import { RouteErrorBoundary } from '../containers/ErrorBoundaries/RouteErrorBoundary';
import { LoginDialog } from '../containers/LoginDialog/LoginDialog';
import { OfflineStatus } from '../containers/OfflineStatus/OfflineStatus';
import * as styles from './styles.css';

const RootLayout: Component<ParentProps> = (props) => {
  const params = useParams<{ locale?: string }>();
  const location = useLocation();
  const locale = () => localeFromParams(params);
  createEffect(() => {
    document.documentElement.lang = bcp47Alias(locale());
  });
  const i18n = createI18nStore(locale);
  // Kept alongside `i18n` for consistency, not because `createConfigStore` itself needs router
  // context — it doesn't call any router hook, and `createAsync` (which it does use) has no router
  // dependency at all (verified live; see `AppProvider.tsx`'s own `createAsync` call, which works
  // fine above the router). `i18n`, above, is the one that actually needs it, via `useParams()`.
  const config = createConfigStore();
  // Reads the store directly: this component provides ConfigContext, so it cannot consume it.
  const features = () => config.config().features;

  const pagePath = () => stripLocale(location.pathname, params.locale);

  const alternateHref = (target: Locale) => localePath(pagePath(), target);

  return (
    <ConfigContext.Provider value={config}>
      <I18nContext.Provider value={i18n}>
        <Link rel="manifest" href="/manifest.json" />
        <Link rel="icon" href="/assets/favicon/favicon.ico" sizes="any" />
        <Link rel="icon" type="image/svg+xml" href="/assets/favicon/favicon.svg" />
        <Link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon/favicon-16x16.png" />
        <Link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon/favicon-32x32.png" />
        <Link rel="apple-touch-icon" sizes="180x180" href="/assets/favicon/apple-touch-icon-180x180.png" />
        <Link rel="apple-touch-icon" href="/assets/favicon/apple-touch-icon.png" />
        <Meta name="msapplication-config" content="/assets/favicon/browserconfig.xml" />
        <Meta name="theme-color" content="#3b82f6" />
        <For each={LOCALES}>
          {(entry) => <Link rel="alternate" hreflang={entry.alias} href={absoluteUrl(alternateHref(entry.lang))} />}
        </For>
        <Link rel="alternate" hreflang="x-default" href={absoluteUrl(pagePath())} />
        <Link rel="canonical" href={absoluteUrl(pagePath())} />

        {/* Required: Suspense waits on loading resources even when they have an initialValue.
            Without it the nav's t() renders once server-side as the en default. */}
        <Suspense>
          <div>
            <SkipLinks />
            <header class={styles.header}>
              <HeaderNav />
              <div class={styles.headerRight}>
                <Show when={features().localeSwitcher}>
                  <LocaleSwitcher />
                </Show>
                <LoginDialog />
              </div>
              <OfflineStatus />
            </header>
            <main id="main-content" tabindex={-1} class={styles.main}>
              <RouteErrorBoundary>
                <Suspense>{props.children}</Suspense>
              </RouteErrorBoundary>
            </main>
          </div>
        </Suspense>
      </I18nContext.Provider>
    </ConfigContext.Provider>
  );
};

export default RootLayout;
